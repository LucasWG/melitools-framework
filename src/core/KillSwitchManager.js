import { DebugLogger } from './DebugLogger.js'
import { gmFetch } from './Net.js'

const FRAMEWORK_CONFIG_URL =
	'https://raw.githubusercontent.com/LucasWG/melitools-framework/main/framework.json'

export class KillSwitchManager {
	constructor(currentVersion) {
		this.currentVersion = currentVersion
		this.config = null
	}

	async check() {
		try {
			const resp = await gmFetch(FRAMEWORK_CONFIG_URL, { cache: 'no-store' })
			if (!resp.ok) throw new Error('fetch fail')
			this.config = await resp.json()
			if (this.config.enabled === false) {
				alert('Framework desativado remotamente')
				throw new Error('kill switch')
			}
			if (
				this.config.minVersion &&
				this.compareVersion(this.currentVersion, this.config.minVersion) < 0
			) {
				alert('Por favor atualize o framework (minVersion ' + this.config.minVersion + ')')
				throw new Error('version outdated')
			}
		} catch (e) {
			DebugLogger.error('KillSwitch check failed', e)
			// network failure – assume ok
		}
	}

	compareVersion(a, b) {
		const pa = a.split('.').map(Number)
		const pb = b.split('.').map(Number)
		for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
			const na = pa[i] || 0,
				nb = pb[i] || 0
			if (na < nb) return -1
			if (na > nb) return 1
		}
		return 0
	}
}
