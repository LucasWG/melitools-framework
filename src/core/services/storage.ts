import type { StorageService } from '../types'

export const createStorageService = (): StorageService => {
  return {
    set(key: string, value: any) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`[MeliTools] Failed to set storage key "${key}":`, error)
      }
    },

    get(key: string) {
      try {
        const item = sessionStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.error(`[MeliTools] Failed to get storage key "${key}":`, error)
        return null
      }
    },

    remove(key: string) {
      try {
        sessionStorage.removeItem(key)
      } catch (error) {
        console.error(`[MeliTools] Failed to remove storage key "${key}":`, error)
      }
    },

    clear() {
      try {
        sessionStorage.clear()
      } catch (error) {
        console.error('[MeliTools] Failed to clear storage:', error)
      }
    }
  }
}
