import type { DOMService, WaitForElementOptions } from '../types'

export const createDOMService = (): DOMService => {
  return {
    find(selector: string): HTMLElement | null {
      return document.querySelector(selector)
    },

    findAll(selector: string): NodeListOf<HTMLElement> {
      return document.querySelectorAll(selector)
    },

    click(element: HTMLElement | string) {
      const el = typeof element === 'string' ? document.querySelector(element) : element
      if (el && el instanceof HTMLElement) {
        el.click()
      }
    },

    fill(element: HTMLElement | string, value: string) {
      const el = typeof element === 'string' ? document.querySelector(element) : element
      if (el && el instanceof HTMLElement) {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.value = value
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }
    },

    waitForElement(selector: string, options?: WaitForElementOptions): Promise<HTMLElement> {
      const { timeout = 5000, maxAttempts = 50 } = options || {}
      const interval = Math.floor(timeout / maxAttempts)

      return new Promise((resolve, reject) => {
        let attempts = 0

        const checkElement = setInterval(() => {
          attempts++
          const element = document.querySelector(selector) as HTMLElement | null

          if (element) {
            clearInterval(checkElement)
            resolve(element)
            return
          }

          if (attempts >= maxAttempts) {
            clearInterval(checkElement)
            reject(new Error(`Element "${selector}" not found after ${timeout}ms`))
          }
        }, interval)

        // Fallback com timeout absoluto
        setTimeout(() => {
          clearInterval(checkElement)
          const element = document.querySelector(selector) as HTMLElement | null
          if (element) {
            resolve(element)
          } else {
            reject(new Error(`Element "${selector}" not found after ${timeout}ms`))
          }
        }, timeout)
      })
    },

    exists(selector: string): boolean {
      return !!document.querySelector(selector)
    }
  }
}
