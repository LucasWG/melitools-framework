import { EventBus } from './event-bus'
import { sha256 } from './integrity'
import { PluginAPI } from './plugin-api'

// tampermonkey globals
declare function GM_getValue(key: string): string | undefined
declare function GM_setValue(key: string, value: string): void
declare function GM_xmlhttpRequest(details: any): void
declare function GM_addStyle(css: string): void

interface PluginManifest {
	name: string
	version: string
	file: string
	sha256: string
}

interface CachedPlugin {
	version: string
	code: string
	sha256: string
}

export class Loader {
	private events: EventBus
	private registryUrl =
		'https://raw.githubusercontent.com/LucasWG/melitools-framework/main/src/plugins/plugin-list.json'

	constructor(events: EventBus) {
		this.events = events
	}

	async initialize() {
		const manifest = await this.fetchRegistry()
		await this.processPlugins(manifest.plugins)
	}

	private async fetchRegistry(): Promise<{ plugins: PluginManifest[] }> {
		const res = await fetch(this.registryUrl)
		if (!res.ok) throw new Error('failed to load plugin registry')
		return res.json()
	}

	private async processPlugins(plugins: PluginManifest[]) {
		for (const plugin of plugins) {
			try {
				await this.loadPlugin(plugin)
			} catch (err) {
				console.error('plugin load error', plugin.name, err)
			}
		}
	}

	private getCache(): Record<string, CachedPlugin> {
		const raw = GM_getValue('plugin_cache') as string | undefined
		if (raw) return JSON.parse(raw)
		return {}
	}

	private setCache(cache: Record<string, CachedPlugin>) {
		GM_setValue('plugin_cache', JSON.stringify(cache))
	}

	async loadPlugin(manifest: PluginManifest) {
		const cache = this.getCache()
		const existing = cache[manifest.name]
		if (
			existing &&
			existing.version === manifest.version &&
			existing.sha256 === manifest.sha256
		) {
			// run from cache
			this.executePlugin(existing.code, manifest.name)
			return
		}

		const url = `https://raw.githubusercontent.com/LucasWG/melitools-framework/main/src/plugins/${manifest.file}`
		const code = await fetch(url).then(r => r.text())
		const hash = await sha256(code)
		if (hash !== manifest.sha256) {
			throw new Error('Plugin integrity failed')
		}
		cache[manifest.name] = { version: manifest.version, code, sha256: hash }
		this.setCache(cache)
		this.executePlugin(code, manifest.name)
	}

	private executePlugin(code: string, name: string) {
		try {
			// provide minimal module environment so plugin can use `export default` syntax
			const wrapped = `(function(api){\nconst exports = {};\n${code}\nreturn exports.default || exports;\n})`
			const factory = eval(wrapped) as any
			if (typeof factory === 'function') {
				factory(PluginAPI)
			}
			this.events.emit('plugin:loaded', name)
		} catch (e) {
			console.error('plugin execution failed', name, e)
		}
	}
}
