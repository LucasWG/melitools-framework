const DEBUG = true // set to false in production

export class DebugLogger {
	static log(...args) {
		if (DEBUG) {
			console.log('[Framework]', ...args)
		}
	}
	static info(...args) {
		if (DEBUG) {
			console.info('[Framework]', ...args)
		}
	}
	static warn(...args) {
		if (DEBUG) {
			console.warn('[Framework]', ...args)
		}
	}
	static error(...args) {
		if (DEBUG) {
			console.error('[Framework]', ...args)
		}
	}
}
