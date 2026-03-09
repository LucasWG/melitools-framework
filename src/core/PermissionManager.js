export class PermissionManager {
	constructor(licenseManager) {
		this.licenseManager = licenseManager
	}

	isAllowed(pluginId) {
		return this.licenseManager.hasPermission(pluginId)
	}
}
