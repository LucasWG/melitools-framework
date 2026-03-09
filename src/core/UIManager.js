import { ToastManager } from './ToastManager.js'
import { DebugLogger } from './DebugLogger.js'

export class UIManager {
	constructor(pluginManager, licenseManager) {
		this.pluginManager = pluginManager
		this.licenseManager = licenseManager
		this.panel = null
		this._injectStyles()
	}

	_injectStyles() {
		if (typeof GM_addStyle === 'function') {
			GM_addStyle(`
			.melitools-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000000; }
			.melitools-modal { background:#fff; padding:20px; border-radius:8px; max-width:400px; box-shadow:0 2px 10px rgba(0,0,0,0.3); color:#000; font-family:Arial, sans-serif; font-size:14px; }
			.melitools-modal h2 { margin-top:0; }
			.melitools-input { width:100%; margin:10px 0; padding:8px; border:1px solid #ccc; border-radius:4px; font-size:14px; }
			.melitools-button { padding:8px 16px; cursor:pointer; background:#007bff; color:#fff; border:none; border-radius:4px; font-size:14px; }
			.melitools-button:disabled { opacity:0.6; cursor:not-allowed; }
			.melitools-panel { position: fixed; top:50px; right:20px; width:300px; max-height:70vh; overflow:auto; background:#fff; border:1px solid #ccc; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.2); z-index:999999; font-family:Arial, sans-serif; font-size:14px; color:#000; }
			.melitools-panel h3 { margin:8px; }
			.melitools-panel .plugin-row { padding:4px 8px; display:flex; justify-content:space-between; }
			.melitools-panel .plugin-row:hover { background:#f5f5f5; }
			.melitools-toast { color:#fff; padding:8px 12px; margin-top:6px; border-radius:4px; box-shadow:0 2px 6px rgba(0,0,0,0.3); }
			.melitools-toast.info { background:#333; }
			.melitools-toast.success { background:#2a2; }
			.melitools-toast.warning { background:#fa0; }
			.melitools-toast.error { background:#a22; }
			`)
		}
	}

	showLicenseModal() {
		DebugLogger.log('show license modal')
		const overlay = document.createElement('div')
		overlay.className = 'melitools-overlay'
		const box = document.createElement('div')
		box.className = 'melitools-modal'
		const title = document.createElement('h2')
		title.textContent = 'Autenticação de Licença'
		const input = document.createElement('input')
		input.type = 'text'
		input.placeholder = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX'
		input.className = 'melitools-input'
		const btn = document.createElement('button')
		btn.textContent = 'Validar Licença'
		btn.className = 'melitools-button'
		btn.onclick = async () => {
			btn.disabled = true
			btn.textContent = 'Validando...'
			await this.licenseManager.verify()
			overlay.remove()
			this.renderPanel()
		}
		box.appendChild(title)
		box.appendChild(input)
		box.appendChild(btn)
		overlay.appendChild(box)
		document.body.appendChild(overlay)
	}

	renderPanel() {
		if (this.panel) return
		const panel = document.createElement('div')
		panel.className = 'melitools-panel'
		panel.innerHTML = '<h3>Plugins</h3>'
		this.panel = panel
		document.body.appendChild(panel)
		this.updatePanel()
	}

	async updatePanel() {
		if (!this.panel) return
		this.panel.querySelectorAll('.plugin-row')?.forEach(n => n.remove())
		const state = (await this.pluginManager.storage.get('pluginState')) || {}
		for (const id in state) {
			const row = document.createElement('div')
			row.className = 'plugin-row'
			const label = document.createElement('span')
			label.textContent = id + ' v' + (state[id].version || '')
			const checkbox = document.createElement('input')
			checkbox.type = 'checkbox'
			checkbox.checked = state[id].enabled
			checkbox.onchange = () => {
				this.pluginManager.toggle(id, checkbox.checked)
			}
			row.appendChild(label)
			row.appendChild(checkbox)
			this.panel.appendChild(row)
		}
	}
}
