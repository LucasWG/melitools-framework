import { DebugLogger } from './DebugLogger.js'

export class SecurityManager {
	static async validate(meta, code) {
		DebugLogger.log('SecurityManager.validate', meta.id)
		// compute SHA256
		const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
		if (hashHex !== meta.sha256) {
			DebugLogger.error('hash mismatch', hashHex, meta.sha256)
			return false
		}
		// only hash verification is performed; signature field removed
		return true
	}
}
