export default function (api) {
	function sanitize(value) {
		return value.replace(/\D/g, '')
	}

	function detect(value) {
		if (value.length === 11) return 'package'

		if (value.length === 44) return 'tracking'

		return null
	}

	function handle(value) {
		const clean = sanitize(value)

		const type = detect(clean)

		if (!type) return

		if (type === 'package') {
			const url = `https://envios.adminml.com/logistics/package-management/package/${clean}`

			window.location.href = url

			return
		}

		if (type === 'tracking') {
			const el = document.activeElement

			if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
				el.value = clean

				el.dispatchEvent(new Event('input', { bubbles: true }))
			}
		}
	}

	document.addEventListener('paste', e => {
		const text = e.clipboardData?.getData('text')

		if (text) handle(text)
	})

	let buffer = ''
	let last = 0

	document.addEventListener('keydown', e => {
		const now = Date.now()

		if (now - last > 50) buffer = ''

		last = now

		if (e.key === 'Enter') {
			handle(buffer)
			buffer = ''
			return
		}

		buffer += e.key
	})
}
