import type { LoggingService } from '../types'

export const createLoggingService = (): LoggingService => {
  return {
    log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [MeliTools] [${level.toUpperCase()}] ${message}`)
    },

    debug(message: string) {
      this.log(message, 'debug')
    },

    info(message: string) {
      this.log(message, 'info')
    },

    warn(message: string) {
      this.log(message, 'warn')
    },

    error(message: string) {
      this.log(message, 'error')
    }
  }
}
