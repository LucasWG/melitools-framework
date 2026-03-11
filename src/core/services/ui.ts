import type { UIService, FloatingElementOptions, ToastOptions, ModalOptions } from '../types'

interface ActiveElementsMap {
  'bottom-right': HTMLElement[]
  'bottom-left': HTMLElement[]
  'top-right': HTMLElement[]
  'top-left': HTMLElement[]
  center: HTMLElement[]
}

interface ActiveToastsMap {
  [id: string]: {
    element: HTMLElement
    timeoutId: number | null
  }
}

export const createUIService = (): UIService => {
  const activeElements: ActiveElementsMap = {
    'bottom-right': [],
    'bottom-left': [],
    'top-right': [],
    'top-left': [],
    center: []
  }

  const activeToasts: ActiveToastsMap = {}

  const positionTypes = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'] as const

  return {
    createFloatingElement(options: FloatingElementOptions = {}) {
      const {
        id,
        position = 'bottom-right',
        backgroundColor = '#333',
        textColor = '#FFF',
        padding = '15px 20px',
        fontSize = '16px'
      } = options

      const element = document.createElement('div')
      if (id) element.id = id

      // Registra o novo elemento
      if (positionTypes.includes(position as any)) {
        activeElements[position as keyof ActiveElementsMap].push(element)
      }

      const baseOffset = 20
      const positionStyles: Record<string, Record<string, string>> = {
        'bottom-right': {
          bottom: `${baseOffset + (activeElements['bottom-right'].length - 1) * 60}px`,
          right: `${baseOffset}px`
        },
        'bottom-left': {
          bottom: `${baseOffset + (activeElements['bottom-left'].length - 1) * 60}px`,
          left: `${baseOffset}px`
        },
        'top-right': {
          top: `${baseOffset + (activeElements['top-right'].length - 1) * 60}px`,
          right: `${baseOffset}px`
        },
        'top-left': {
          top: `${baseOffset + (activeElements['top-left'].length - 1) * 60}px`,
          left: `${baseOffset}px`
        },
        center: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, ${
            -50 + (activeElements.center.length - 1) * 70
          }px)`
        }
      }

      const baseStyles: Record<string, string> = {
        position: 'fixed',
        backgroundColor,
        color: textColor,
        padding,
        borderRadius: '8px',
        fontFamily:
          '"Proxima Nova", -apple-system, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
        fontSize,
        fontWeight: '600',
        zIndex: '99999999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
        textAlign: 'center',
        maxWidth: '90vw',
        whiteSpace: 'nowrap',
        ...positionStyles[position as keyof typeof positionStyles]
      }

      Object.assign(element.style, baseStyles)
      document.body.appendChild(element)
      return element
    },

    showElement(element: HTMLElement, transform = 'translateY(0)') {
      if (!element) return
      element.style.opacity = '1'
      element.style.transform = transform
      element.style.pointerEvents = 'auto'

      for (const position of positionTypes) {
        const idx = activeElements[position].indexOf(element)
        if (idx !== -1) {
          const baseOffset = 20
          const newPosition = baseOffset + idx * 60
          if (position === 'center') {
            element.style.transform = `translate(-50%, ${-50}px)`
          } else if (position.includes('bottom')) {
            element.style.bottom = `${newPosition}px`
          } else if (position.includes('top')) {
            element.style.top = `${newPosition}px`
          }
          break
        }
      }
    },

    hideElement(element: HTMLElement, transform = 'translateY(20px)') {
      if (!element) return
      element.style.opacity = '0'
      element.style.transform = transform
      element.style.pointerEvents = 'none'

      for (const position of positionTypes) {
        const idx = activeElements[position].indexOf(element)
        if (idx !== -1) {
          break
        }
      }
    },

    isElementVisible(element: HTMLElement): boolean {
      return element && element.style.opacity !== '0' && element.style.display !== 'none'
    },

    removeElement(element: HTMLElement) {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element)

        for (const position of positionTypes) {
          const idx = activeElements[position].indexOf(element)
          if (idx !== -1) {
            activeElements[position].splice(idx, 1)
            this.updateElementPositions(position as any)
            break
          }
        }
      }
    },

    updateElementPositions(position: string) {
      const baseOffset = 20
      let visibleIndex = 0

      const posKey = position as keyof ActiveElementsMap
      if (!activeElements[posKey]) return

      activeElements[posKey].forEach(element => {
        if (element.style.opacity !== '0') {
          if (position === 'center') {
            element.style.transform = `translate(-50%, ${-50 + visibleIndex * 70}px)`
          } else if (position.includes('bottom')) {
            element.style.bottom = `${baseOffset + visibleIndex * 60}px`
          } else if (position.includes('top')) {
            element.style.top = `${baseOffset + visibleIndex * 60}px`
          }
          visibleIndex++
        }
      })
    },

    showToast(message: string, options: ToastOptions = {}) {
      const { id = null, type = 'info', duration = 4000, position = 'top-right' } = options

      const typeStyles: Record<string, { backgroundColor: string; textColor: string }> = {
        info: { backgroundColor: '#3498db', textColor: '#fff' },
        success: { backgroundColor: '#2ecc71', textColor: '#fff' },
        error: { backgroundColor: '#e74c3c', textColor: '#fff' },
        warning: { backgroundColor: '#f1c40f', textColor: '#000' }
      }

      const style = typeStyles[type] || typeStyles.info

      // Se um ID for fornecido e o toast já existir, reutilize-o
      if (id && activeToasts[id]) {
        const existing = activeToasts[id]
        this.updateContent(existing.element, message)
        if (existing.timeoutId !== null) {
          clearTimeout(existing.timeoutId)
        }
        if (duration > 0) {
          existing.timeoutId = window.setTimeout(() => {
            this.removeElement(existing.element)
            delete activeToasts[id]
          }, duration)
        }
        return
      }

      const toastElement = this.createFloatingElement({
        position: position as any,
        backgroundColor: style.backgroundColor,
        textColor: style.textColor,
        padding: '12px 18px',
        fontSize: '14px'
      })

      this.updateContent(toastElement, message)
      this.showElement(toastElement, 'translateY(0)')

      let timeoutId: number | null = null
      if (duration > 0) {
        timeoutId = window.setTimeout(() => {
          this.removeElement(toastElement)
          if (id) {
            delete activeToasts[id]
          }
        }, duration)
      }

      if (id) {
        activeToasts[id] = { element: toastElement, timeoutId }
      }
    },

    updateContent(element: HTMLElement, content: string) {
      if (!element) return
      element.innerHTML = content
    },

    createModal(options: ModalOptions) {
      const { id, title, content, buttons = [], onClose = () => {}, maxWidth = '500px', zIndex = '100' } = options

      const modalId = id || `modal-${Date.now()}`
      if (document.getElementById(modalId)) {
        const existing = document.getElementById(modalId)
        if (existing) {
          existing.remove()
        }
      }

      const modalOverlay = document.createElement('div')
      modalOverlay.id = modalId
      Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: zIndex,
        opacity: '0',
        transition: 'opacity 0.3s ease'
      })

      const modalContent = document.createElement('div')
      Object.assign(modalContent.style, {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        width: '90%',
        maxWidth: maxWidth,
        color: '#333',
        transform: 'translateY(-20px)',
        transition: 'transform 0.3s ease'
      })

      modalContent.innerHTML = `
        <h2 style="margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 600; color: #333;">${title}</h2>
        <div>${content}</div>
        <div class="modal-buttons" style="margin-top: 25px; display: flex; justify-content: flex-end; gap: 10px;"></div>
      `

      const buttonsContainer = modalContent.querySelector('.modal-buttons')
      if (buttonsContainer) {
        buttons.forEach(({ text, type, action }) => {
          const btn = document.createElement('button')
          btn.textContent = text
          const isLoud = type === 'loud'
          Object.assign(btn.style, {
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isLoud ? '#3498db' : '#f0f0f0',
            color: isLoud ? '#fff' : '#333',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          })
          btn.addEventListener('click', action)
          btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = isLoud ? '#2980b9' : '#e0e0e0'
          })
          btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = isLoud ? '#3498db' : '#f0f0f0'
          })
          buttonsContainer.appendChild(btn)
        })
      }

      modalOverlay.appendChild(modalContent)
      document.body.appendChild(modalOverlay)

      const modalApi = modalOverlay as unknown as HTMLElement & { show(): void; hide(): void }

      modalApi.show = () => {
        modalOverlay.style.opacity = '1'
        modalContent.style.transform = 'translateY(0)'
        modalOverlay.style.pointerEvents = 'auto'
      }

      modalApi.hide = () => {
        modalOverlay.style.opacity = '0'
        modalContent.style.transform = 'translateY(-20px)'
        modalOverlay.style.pointerEvents = 'none'
        setTimeout(() => {
          if (modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay)
          }
          onClose()
        }, 300)
      }

      // Esconder ao clicar fora
      modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) {
          modalApi.hide()
        }
      })

      return modalApi
    }
  }
}
