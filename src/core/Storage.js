// simple storage abstraction with IndexedDB fallback to localStorage

export class Storage {
	constructor(dbName = 'melitools', storeName = 'keyval') {
		this.dbName = dbName
		this.storeName = storeName
		this.db = null
	}

	async _initDB() {
		if (this.db) return
		return new Promise((resolve, reject) => {
			const open = indexedDB.open(this.dbName, 1)
			open.onupgradeneeded = () => {
				const db = open.result
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName)
				}
			}
			open.onsuccess = () => {
				this.db = open.result
				resolve()
			}
			open.onerror = () => reject(open.error)
		})
	}

	async get(key) {
		try {
			await this._initDB()
			return new Promise((resolve, reject) => {
				const tx = this.db.transaction(this.storeName, 'readonly')
				const store = tx.objectStore(this.storeName)
				const req = store.get(key)
				req.onsuccess = () => resolve(req.result)
				req.onerror = () => reject(req.error)
			})
		} catch (e) {
			DebugLogger.warn('IDB failed, fallback to localStorage', e)
			return JSON.parse(localStorage.getItem(key))
		}
	}

	async set(key, value) {
		try {
			await this._initDB()
			return new Promise((resolve, reject) => {
				const tx = this.db.transaction(this.storeName, 'readwrite')
				const store = tx.objectStore(this.storeName)
				const req = store.put(value, key)
				req.onsuccess = () => resolve()
				req.onerror = () => reject(req.error)
			})
		} catch (e) {
			DebugLogger.warn('IDB failed set, fallback to localStorage', e)
			localStorage.setItem(key, JSON.stringify(value))
		}
	}

	async remove(key) {
		try {
			await this._initDB()
			return new Promise((resolve, reject) => {
				const tx = this.db.transaction(this.storeName, 'readwrite')
				const store = tx.objectStore(this.storeName)
				const req = store.delete(key)
				req.onsuccess = () => resolve()
				req.onerror = () => reject(req.error)
			})
		} catch (e) {
			DebugLogger.warn('IDB failed remove, fallback to localStorage', e)
			localStorage.removeItem(key)
		}
	}
}
