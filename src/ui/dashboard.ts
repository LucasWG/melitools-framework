import { theme } from './theme'

export function createDashboard() {
	const container = document.createElement('div')
	container.setAttribute('data-melitools-ui', '')
	container.style.position = 'fixed'
	container.style.top = '10px'
	container.style.right = '10px'
	container.style.background = theme.surface
	container.style.color = theme.text
	container.style.padding = '10px'
	container.style.borderRadius = '8px'
	container.innerText = 'Melitools running...'
	document.body.appendChild(container)
	return container
}
