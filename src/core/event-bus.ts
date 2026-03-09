type Listener = (...args: any[]) => void

export class EventBus {
	private listeners: Map<string, Listener[]> = new Map()

	on(event: string, fn: Listener) {
		const arr = this.listeners.get(event) || []
		arr.push(fn)
		this.listeners.set(event, arr)
		return () => this.off(event, fn)
	}

	off(event: string, fn: Listener) {
		const arr = this.listeners.get(event)
		if (!arr) return
		this.listeners.set(
			event,
			arr.filter(l => l !== fn)
		)
	}

	emit(event: string, ...args: any[]) {
		const arr = this.listeners.get(event)
		if (!arr) return
		for (const fn of arr) {
			try {
				fn(...args)
			} catch (e) {
				console.error('event handler error', event, e)
			}
		}
	}
}
