import { Loader } from './loader'
import { UpdateManager } from './update-manager'
import { EventBus } from './event-bus'
import { PluginAPI } from './plugin-api'

export class Framework {
	loader: Loader
	update: UpdateManager
	events: EventBus

	constructor() {
		this.events = new EventBus()
		// expose event bus to plugin API
		PluginAPI.events = this.events
		this.loader = new Loader(this.events)
		this.update = new UpdateManager(this.loader)
	}

	async start() {
		// initial load
		await this.loader.initialize()
		// start update poller
		this.update.start()
		this.events.emit('framework:ready')
	}
}
