export class ShortcutManager {
	static init() {
		document.addEventListener('keydown', e => {
			if (e.altKey && e.key.toLowerCase() === 'q') {
				e.preventDefault()
				const event = new CustomEvent('framework:togglePanel')
				window.dispatchEvent(event)
			}
		})
	}
}
