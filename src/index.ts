import { Melitools } from './core/framework'
import { createDashboard, toggleMenu } from './ui/dashboard'

// bootstrap when loaded by Tampermonkey
;(function () {
	// create UI badge and menu hotkey
	createDashboard()
	document.addEventListener('keydown', e => {
		if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
			toggleMenu()
		}
	})

	// start all registered plugins
	Melitools.init()
})()
