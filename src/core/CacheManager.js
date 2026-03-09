import { DebugLogger } from './DebugLogger.js'

export class CacheManager {
	constructor(storage) {
		this.storage = storage
	}

	async getPlugin(id) {
		const data = await this.storage.get(`plugin_${id}`)
		return data || null
	}

	async savePlugin(id, version, code, hash) {
		DebugLogger.log('caching plugin', id, version)
		const payload = { id, version, code, hash, timestamp: Date.now() }
		await this.storage.set(`plugin_${id}`, payload)
	}

	async clearPlugin(id) {
		await this.storage.remove(`plugin_${id}`)
	}
}
