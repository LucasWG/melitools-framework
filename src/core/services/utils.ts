import type { UtilsService, KeyboardShortcutConfig } from '../types'

declare let MeliTools: any

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
    },

    async copyToClipboard(text: string, label: string = 'Copiado'): Promise<void> {
      try {
        await navigator.clipboard.writeText(text)
        // Acessa a API por window para evitar circular dependency
        if (typeof window !== 'undefined' && (window as any).MeliTools?.ui?.showToast) {
          (window as any).MeliTools.ui.showToast(`${label}!`, { type: 'success', duration: 2000 })
        }
      } catch (error) {
        if (typeof window !== 'undefined' && (window as any).MeliTools?.ui?.showToast) {
          (window as any).MeliTools.ui.showToast('Erro ao copiar', { type: 'error', duration: 2000 })
        }
      }
    },

    registerKeyboardShortcut(keys: KeyboardShortcutConfig[], callback: (event: KeyboardEvent) => void): void {
      const handleKeyDown = (event: KeyboardEvent) => {
        for (const keyConfig of keys) {
          const keyMatches = keyConfig.key.toLowerCase() === event.key.toLowerCase()
          const altMatches = keyConfig.altKey ? event.altKey : !event.altKey
          const ctrlMatches = keyConfig.ctrlKey ? event.ctrlKey : !event.ctrlKey
          const shiftMatches = keyConfig.shiftKey ? event.shiftKey : !event.shiftKey

          if (keyMatches && altMatches && ctrlMatches && shiftMatches) {
            callback(event)
            return
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)
    },

    playSound(frequency: number, duration: number, delayBetween: number = 0): void {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const playBip = (delay: number) => {
          setTimeout(() => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = frequency
            osc.type = 'sine'
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + duration / 1000)
          }, delay)
        }
        playBip(0)
        if (delayBetween > 0) {
          playBip(delayBetween)
        }
      } catch (error) {
        console.warn('[MeliTools] Áudio bloqueado pelo navegador')
      }
    },

    downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
      const blob = new Blob([content], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  }
}
