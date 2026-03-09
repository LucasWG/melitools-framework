// plugin code for inputInterceptor

;(function () {
	const DEBUG = false

	function sanitize(text) {
		return text.replace(/\D/g, '')
	}

	function handleInput(value) {
		const digits = sanitize(value)
		if (digits.length === 11) {
			// id
			const url1 = `https://envios.adminml.com/logistics/package-management/package/${digits}`
			const url2 = `https://shipping-bo.adminml.com/sauron/shipments/shipment/${digits}`
			// navigate to first domain matching in current location
			if (window.location.hostname.includes('adminml.com')) {
				API.navigation.redirect(url1)
			} else {
				API.navigation.redirect(url2)
			}
		} else if (digits.length === 44) {
			// chave
			const active = document.activeElement
			if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
				active.value = digits
			}
		}
	}

	// listen for paste events globally
	document.addEventListener('paste', e => {
		const text = (e.clipboardData || window.clipboardData).getData('text')
		if (text) handleInput(text)
	})

	// also listen to custom events from barcode readers: they typically fire as keyboard
	document.addEventListener('keydown', e => {
		// nothing for now; barcode readers often emulate paste or key events
	})

	// expose destroy method if plugin reloaded
	window.plugin_destroy = function () {
		// remove listeners if necessary
	}
})()
