import { DebugLogger } from './DebugLogger.js'
import { gmFetch } from './Net.js'

const BASE_URL = 'https://raw.githubusercontent.com/LucasWG/melitools-framework/main'

export class RemoteLoader {
	constructor() {
		this.index = null
	}

	async loadIndex() {
		if (this.index) return this.index
		try {
			const resp = await gmFetch(`${BASE_URL}/plugins/index.json`, { cache: 'no-store' })
			if (!resp.ok) throw new Error('failed to load index')
			this.index = await resp.json()
			return this.index
		} catch (e) {
			DebugLogger.error('RemoteLoader.loadIndex error', e)
			// fallback to local copy if available (development)
			try {
				const local = await fetch(
					chrome.runtime
						? chrome.runtime.getURL('plugins/index.json')
						: '/src/plugins/index.json'
				)
				if (local.ok) {
					this.index = await local.json()
					return this.index
				}
			} catch (_) {}
			return null
		}
	}

	getIndex() {
		return this.index
	}

	async fetchPluginMeta(id) {
		try {
			const resp = await gmFetch(`${BASE_URL}/plugins/${id}/plugin.json`, {
				cache: 'no-store'
			})
			if (!resp.ok) throw new Error('failed to fetch meta')
			return await resp.json()
		} catch (e) {
			DebugLogger.error('fetchPluginMeta', e)
			return null
		}
	}

	async fetchPluginCode(id, entry) {
		try {
			const resp = await gmFetch(`${BASE_URL}/plugins/${id}/${entry}`, { cache: 'no-store' })
			if (!resp.ok) throw new Error('failed to fetch code')
			return await resp.text()
		} catch (e) {
			DebugLogger.error('fetchPluginCode', e)
			return null
		}
	}
}
