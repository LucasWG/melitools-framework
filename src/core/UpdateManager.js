import { DebugLogger } from './DebugLogger.js'

export class UpdateManager {
	constructor(pluginManager) {
		this.pluginManager = pluginManager
		this.timer = null
	}

	start(intervalMs = 1000 * 60 * 5) {
		this.stop()
		this.timer = setInterval(async () => {
			DebugLogger.log('update manager tick')
			await this.pluginManager.checkUpdates()
		}, intervalMs)
	}

	stop() {
		if (this.timer) clearInterval(this.timer)
	}
}
