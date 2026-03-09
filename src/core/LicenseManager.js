import { DebugLogger } from './DebugLogger.js'
import { gmFetch } from './Net.js'

const LICENSE_URL =
	'https://raw.githubusercontent.com/LucasWG/melitools-framework/main/licenses.json'

export class LicenseManager {
	constructor(storage) {
		this.storage = storage
		this.licenseKey = null
		this.licenseData = null
	}

	async init() {
		DebugLogger.log('LicenseManager init')
		this.licenseKey = await this.storage.get('licenseKey')
		if (this.licenseKey) {
			await this.verify()
		}
	}

	async promptForKey() {
		// simple blocking prompt (could be replaced by UIManager)
		const key = prompt('Digite sua chave de licença')
		if (key) {
			this.licenseKey = key.trim()
			await this.verify()
		}
	}

	async verify() {
		DebugLogger.log('verifying license', this.licenseKey)
		try {
			const resp = await gmFetch(LICENSE_URL, { cache: 'no-store' })
			if (!resp.ok) throw new Error('failed fetch')
			const data = await resp.json()
			const info = data[this.licenseKey]
			if (!info || !info.active) {
				DebugLogger.warn('license invalid or inactive')
				await this.storage.remove('licenseKey')
				this.licenseKey = null
				this.licenseData = null
				alert('Licença inválida ou revogada')
				return this.promptForKey()
			}
			DebugLogger.log('license valid', info)
			this.licenseData = info
			await this.storage.set('licenseKey', this.licenseKey)
		} catch (e) {
			DebugLogger.error('license check failed', e)
			// network failure: keep existing key if any
		}
	}

	hasPermission(pluginId) {
		if (!this.licenseData) return false
		const allowed = this.licenseData.plugins
		return allowed.includes('*') || allowed.includes(pluginId)
	}
}
