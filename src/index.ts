import { Framework } from './core/framework'
import { createDashboard } from './ui/dashboard'

// bootstrap the framework when loaded by Tampermonkey
;(function () {
	const fw = new Framework()
	fw.start().catch(console.error)

	// create simple UI indicator
	createDashboard()

	// hotkey to toggle dashboard (ctrl+shift+m)
	document.addEventListener('keydown', e => {
		if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
			// toggle visibility
			const el = document.querySelector('div[data-melitools-ui]')
			if (el) {
				el.remove()
			} else {
				const dash = createDashboard()
				dash.setAttribute('data-melitools-ui', '')
			}
		}
	})
})()
