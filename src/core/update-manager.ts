import { Loader } from './loader'

export class UpdateManager {
	private loader: Loader
	private interval = 60_000
	private timer?: number

	constructor(loader: Loader) {
		this.loader = loader
	}

	start() {
		this.timer = window.setInterval(() => this.check(), this.interval)
	}

	stop() {
		if (this.timer) window.clearInterval(this.timer)
	}

	async check() {
		try {
			await this.loader.initialize()
		} catch (err) {
			console.error('update check failed', err)
		}
	}
}
