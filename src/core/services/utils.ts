import type { UtilsService } from '../types'

export const createUtilsService = (): UtilsService => {
  return {
    sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    onPageLoad(callback: () => void) {
      if (document.readyState === 'complete') {
        callback()
      } else {
        window.addEventListener('load', callback, { once: true })
      }
    },

    formatTime(ms: number): string {
      const horas = Math.floor(ms / 3600000)
      const minutos = Math.floor((ms % 3600000) / 60000)
      const segundos = Math.floor((ms % 60000) / 1000)
      const milissegundos = ms % 1000

      let tempo = ''
      if (horas > 0) tempo += `${horas}h `
      if (minutos > 0) tempo += `${minutos}m `
      if (segundos > 0) tempo += `${segundos}s `
      if (milissegundos > 0) tempo += `${milissegundos}ms `

      return tempo.trim() || '0ms'
    },

    log(message: string) {
      console.log(`[MeliTools] ${message}`)
    },

    matchUrl(pattern: string): boolean {
      // Converte o padrão do estilo @match para regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\//g, '\\/')

      const regex = new RegExp(`^${regexPattern}$`)
      return regex.test(window.location.href)
    },

    matchUrls(patterns: string[]): boolean {
      if (!Array.isArray(patterns)) {
        return false
      }
      return patterns.some(pattern => this.matchUrl(pattern))
    }
  }
}
