import { theme } from './theme'
import { Melitools } from '../core/framework'

// corner badge that shows framework status and toggles the menu
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
	container.style.cursor = 'pointer'
	container.innerText = 'Melitools'
	container.addEventListener('click', toggleMenu)
	document.body.appendChild(container)
	return container
}

// create the modal overlay menu
export function createMenu() {
	if (document.getElementById('melitools-menu')) return null
	const overlay = document.createElement('div')
	overlay.id = 'melitools-menu'
	overlay.style.position = 'fixed'
	overlay.style.top = '0'
	overlay.style.left = '0'
	overlay.style.width = '100vw'
	overlay.style.height = '100vh'
	overlay.style.background = 'rgba(0,0,0,0.5)'
	overlay.style.display = 'flex'
	overlay.style.alignItems = 'center'
	overlay.style.justifyContent = 'center'
	overlay.style.zIndex = '9999'

	const modal = document.createElement('div')
	modal.style.background = theme.surface
	modal.style.color = theme.text
	modal.style.padding = '20px'
	modal.style.borderRadius = '10px'
	modal.style.minWidth = '300px'
	modal.style.maxWidth = '90vw'
	modal.innerHTML = `
		<h2>Melitools Menu</h2>
		<div id="melitools-plugins-list">Loading plugins…</div>
		<button id="melitools-close">Close</button>
	`
	overlay.appendChild(modal)
	document.body.appendChild(overlay)

	// populate plugin list immediately
	updatePluginList(overlay)

	overlay.querySelector('#melitools-close')!.addEventListener('click', () => {
		overlay.remove()
	})

	return overlay
}

function updatePluginList(overlay: HTMLElement) {
	const listEl = overlay.querySelector('#melitools-plugins-list')
	if (!listEl) return
	const names = Object.keys(Melitools.plugins)
	if (names.length === 0) {
		listEl.textContent = 'no plugins registered'
	} else {
		listEl.innerHTML = names.map(n => `<div>${n}</div>`).join('')
	}
}

export function toggleMenu() {
	const existing = document.getElementById('melitools-menu')
	if (existing) existing.remove()
	else createMenu()
}
