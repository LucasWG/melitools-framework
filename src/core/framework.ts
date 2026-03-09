import { EventBus } from './event-bus'

// Tampermonkey globals for storage
declare function GM_getValue(key: string): string | undefined
declare function GM_setValue(key: string, value: string): void

interface Plugin {
	name: string
	start?: () => void
	stop?: () => void
}

class MelitoolsClass {
	public plugins: Record<string, Plugin> = {}
	public events = new EventBus()
	public storage = {
		get: (k: string) => {
			const r = GM_getValue(k)
			return r ? JSON.parse(r) : undefined
		},
		set: (k: string, v: any) => {
			GM_setValue(k, JSON.stringify(v))
		}
	}
	public ui = {
		toast: (msg: string) => alert(msg)
	}

	registerPlugin(plugin: Plugin) {
		if (this.plugins[plugin.name]) return
		this.plugins[plugin.name] = plugin
	}

	init() {
		for (const p of Object.values(this.plugins)) {
			try {
				p.start?.()
			} catch (e) {
				console.error('plugin start', p.name, e)
			}
		}
		this.events.emit('framework:ready')
	}
}

declare global {
	interface Window {
		Melitools: any
	}
}

// instantiate global singleton
window.Melitools = window.Melitools || new MelitoolsClass()
export const Melitools = window.Melitools
