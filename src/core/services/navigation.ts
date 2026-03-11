import type { NavigationService } from '../types'

export const createNavigationService = (): NavigationService => {
  return {
    redirectTo(url: string) {
      window.location.href = url
    },

    refresh() {
      window.location.reload()
    },

    goBack() {
      window.history.back()
    }
  }
}
