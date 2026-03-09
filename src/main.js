// main entrypoint for the framework
import { Storage } from './core/Storage.js'
import { DebugLogger } from './core/DebugLogger.js'
import { LicenseManager } from './core/LicenseManager.js'
import { PluginManager } from './core/PluginManager.js'
import { KillSwitchManager } from './core/KillSwitchManager.js'
import { UIManager } from './core/UIManager.js'
import { ShortcutManager } from './core/ShortcutManager.js'
import { UpdateManager } from './core/UpdateManager.js'
import { ToastManager } from './core/ToastManager.js'

;(async function () {
	DebugLogger.log('framework iniciado')
	const storage = new Storage()
	const license = new LicenseManager(storage)
	const kill = new KillSwitchManager('1.0.0')
	await kill.check()
	await license.init()
	if (!license.licenseKey) {
		const ui = new UIManager(null, license)
		ui.showLicenseModal()
		await new Promise(resolve => {
			const interval = setInterval(() => {
				if (license.licenseKey) {
					clearInterval(interval)
					resolve()
				}
			}, 500)
		})
	}
	const pluginManager = new PluginManager(storage, license)
	const ui = new UIManager(pluginManager, license)
	ShortcutManager.init()
	window.addEventListener('framework:togglePanel', () => ui.renderPanel())

	await pluginManager.init()
	const updater = new UpdateManager(pluginManager)
	updater.start()

	// expose for debugging
	window.MeliTools = { storage, license, pluginManager, ui, updater }
})()
