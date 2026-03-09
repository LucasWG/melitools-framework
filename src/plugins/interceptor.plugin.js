;(function () {
	const plugin = {
		name: 'interceptor',

		start() {
			function sanitize(v) {
				return v.replace(/\D/g, '')
			}

			function detect(v) {
				if (v.length === 11) return 'package'

				if (v.length === 44) return 'tracking'
			}

			function handle(v) {
				const clean = sanitize(v)

				const type = detect(clean)

				if (type === 'package') {
					window.location.href = `https://envios.adminml.com/logistics/package-management/package/${clean}`
				}

				if (type === 'tracking') {
					const el = document.activeElement

					if (el && el.tagName === 'INPUT') {
						el.value = clean
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
	}

	window.Melitools.registerPlugin(plugin)
})()
