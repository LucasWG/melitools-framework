import { DebugLogger } from './DebugLogger.js'
import { RemoteLoader } from './RemoteLoader.js'
import { CacheManager } from './CacheManager.js'
import { SecurityManager } from './SecurityManager.js'
import { PermissionManager } from './PermissionManager.js'
import { PluginSandbox } from './PluginSandbox.js'
// helper to adapt Tampermonkey GM_xmlhttpRequest to fetch-like API
async function gmFetch(url, options = {}) {
	if (typeof GM_xmlhttpRequest !== 'function') {
		return fetch(url, options)
	}
	return new Promise((resolve, reject) => {
		GM_xmlhttpRequest({
			method: options.method || 'GET',
			url,
			headers: options.headers,
			responseType: 'json',
			onload: res => {
				resolve({
					ok: res.status >= 200 && res.status < 300,
					status: res.status,
					json: () => Promise.resolve(res.response),
					text: () => Promise.resolve(res.responseText)
				})
			},
			onerror: reject
		})
	})
}
export class PluginManager {
	constructor(storage, licenseManager) {
		this.storage = storage
		this.licenseManager = licenseManager
		this.remote = new RemoteLoader()
		this.cache = new CacheManager(storage)
		this.plugins = {}
	}

	async init() {
		DebugLogger.log('PluginManager init')
		// ensure index.json cached
		await this.remote.loadIndex()
		// load enabled plugins from cache
		const state = (await this.storage.get('pluginState')) || {}
		for (const id in state) {
			if (state[id].enabled) {
				await this.load(id, state[id].version)
			}
		}
	}

	async load(id, version) {
		if (!this.licenseManager.hasPermission(id)) {
			DebugLogger.warn('no permission for plugin', id)
			return
		}
		DebugLogger.log('loading plugin', id)
		const meta = await this.remote.fetchPluginMeta(id)
		if (!meta) throw new Error('plugin meta missing')
		if (version && meta.version !== version) {
			// version mismatch, will load latest
		}
		// check cache first
		const cached = await this.cache.getPlugin(id)
		if (cached && cached.version === meta.version) {
			DebugLogger.log('using cached plugin', id)
			return this.executePlugin(cached.code, meta)
		}
		// else download plugin code
		const code = await this.remote.fetchPluginCode(id, meta.entry)
		// security checks
		const ok = await SecurityManager.validate(meta, code)
		if (!ok) {
			throw new Error('security validation failed for ' + id)
		}
		await this.cache.savePlugin(id, meta.version, code, meta.sha256)
		return this.executePlugin(code, meta)
	}

	async executePlugin(code, meta) {
		const sandbox = new PluginSandbox({
			events: this,
			navigation: {
				redirect: url => {
					window.location.href = url
				}
			},
			dom: {
				read: sel => document.querySelector(sel)?.value,
				write: (sel, val) => {
					const el = document.querySelector(sel)
					if (el) el.value = val
				}
			},
			toast: window.ToastManager
		})
		sandbox.run(code, meta)
		this.plugins[meta.id] = { meta, sandbox }
	}

	async checkUpdates() {
		DebugLogger.log('checking plugin updates')
		const index = await this.remote.getIndex()
		for (const id in index.plugins) {
			const remoteVersion = index.plugins[id]
			const cached = await this.cache.getPlugin(id)
			if (cached && cached.version !== remoteVersion) {
				DebugLogger.log('update available for', id)
				// hot reload if enabled
				await this.load(id, remoteVersion)
			}
		}
	}

	async toggle(id, enabled) {
		const state = (await this.storage.get('pluginState')) || {}
		state[id] = state[id] || {}
		state[id].enabled = enabled
		await this.storage.set('pluginState', state)
		if (enabled) {
			await this.load(id)
		} else {
			const p = this.plugins[id]
			if (p && p.sandbox.destroy) p.sandbox.destroy()
			delete this.plugins[id]
		}
	}
}
