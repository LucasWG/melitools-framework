export class ToastManager {
	static _container = null

	static _ensure() {
		if (this._container) return
		const div = document.createElement('div')
		div.style.position = 'fixed'
		div.style.bottom = '20px'
		div.style.right = '20px'
		div.style.zIndex = '999999'
		this._container = div
		document.body.appendChild(div)
	}

	static _create(message, type = 'info') {
		this._ensure()
		const t = document.createElement('div')
		t.className = `melitools-toast ${type}`
		t.textContent = message
		this._container.appendChild(t)
		setTimeout(() => {
			t.remove()
		}, 4000)
	}

	static info(msg) {
		this._create(msg, 'info')
	}
	static success(msg) {
		this._create(msg, 'success')
	}
	static warning(msg) {
		this._create(msg, 'warning')
	}
	static error(msg) {
		this._create(msg, 'error')
	}
}
