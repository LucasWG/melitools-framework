import type { MeliToolsAPI } from '../core/types'

interface QuickNavigatorConfig {
  ID_LENGTH: number
  TIMEOUT_SECONDS: number
  ENABLED_URLS: string[]
  REDIRECT_URL_BASE: string
}

interface QuickNavigatorState {
  typedId: string
  mainTimeout: number | null
  countdownInterval: number | null
  displayElement: HTMLElement | null
  isRedirecting: boolean
}

export default function registerQuickNavigator(api: MeliToolsAPI) {
  const config: QuickNavigatorConfig = {
    ID_LENGTH: 11,
    TIMEOUT_SECONDS: 10,
    ENABLED_URLS: [
      '*://127.0.0.1:5500/src/mock/gestao*',
      'https://envios.adminml.com/logistics/package-management*',
      'https://shipping-bo.adminml.com/sauron/shipments/shipment/*',
      'https://envios.adminml.com/logistics/monitoring-distribution/detail/*'
    ],
    REDIRECT_URL_BASE: 'https://envios.adminml.com/logistics/package-management/package/'
  }

  const state: QuickNavigatorState = {
    typedId: '',
    mainTimeout: null,
    countdownInterval: null,
    displayElement: null,
    isRedirecting: false
  }

  // Verifica se deve ser ativado na página atual
  if (!api.utils.matchUrls(config.ENABLED_URLS)) return

  const createDisplayElement = () => {
    if (state.displayElement) return

    state.displayElement = api.ui.createFloatingElement({
      id: 'id-navigator-display',
      position: 'bottom-right',
      backgroundColor: '#333',
      textColor: '#FFF159'
    })
  }

  const updateDisplay = (id: string, time: number) => {
    if (!state.displayElement) return
    const placeholders = '_'.repeat(config.ID_LENGTH - id.length)
    const content = `ID: <span style="color: white;">${id}${placeholders}</span> | Tempo: <span style="color: white;">${time}s</span>`
    api.ui.updateContent(state.displayElement, content)
  }

  const showDisplay = () => {
    api.ui.showElement(state.displayElement!)
  }

  const resetState = () => {
    state.typedId = ''
    state.isRedirecting = false

    if (state.mainTimeout !== null) {
      clearTimeout(state.mainTimeout)
    }
    if (state.countdownInterval !== null) {
      clearInterval(state.countdownInterval)
    }
    state.mainTimeout = null
    state.countdownInterval = null

    api.ui.hideElement(state.displayElement!)
  }

  const redirectToUrl = (id: string) => {
    const url = `${config.REDIRECT_URL_BASE}${id}`

    // Copiar ID para clipboard usando a função do core
    api.utils.copyToClipboard(id, 'ID copiado').then(() => {
      api.logging.info(`Redirecionando para: ${url}`)
      api.navigation.redirectTo(url)
    }).catch(() => {
      api.logging.info(`Redirecionando para: ${url}`)
      api.navigation.redirectTo(url)
    })
  }

  const handlePaste = (event: ClipboardEvent) => {
    if (state.isRedirecting) return

    const pastedText = (event.clipboardData || (window as any).clipboardData)
      ?.getData('text')
      ?.trim()

    if (pastedText && /^\d+$/.test(pastedText) && pastedText.length === config.ID_LENGTH) {
      event.preventDefault()
      state.isRedirecting = true
      redirectToUrl(pastedText)
      resetState()
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (state.isRedirecting) return

    const targetElement = (event.target as HTMLElement).tagName.toLowerCase()
    if (
      ['input', 'textarea', 'select'].includes(targetElement) ||
      ((event.target as HTMLElement).isContentEditable === true)
    ) {
      return
    }

    if (!/^\d$/.test(event.key)) {
      if (state.typedId.length > 0) {
        resetState()
      }
      return
    }

    if (state.mainTimeout !== null) clearTimeout(state.mainTimeout)
    if (state.countdownInterval !== null) clearInterval(state.countdownInterval)

    if (state.typedId.length === 0) {
      showDisplay()
    }

    state.typedId += event.key

    let timeLeft = config.TIMEOUT_SECONDS
    updateDisplay(state.typedId, timeLeft)

    state.mainTimeout = window.setTimeout(() => resetState(), config.TIMEOUT_SECONDS * 1000)

    state.countdownInterval = window.setInterval(() => {
      timeLeft--
      updateDisplay(state.typedId, timeLeft)
      if (timeLeft <= 0) {
        if (state.countdownInterval !== null) clearInterval(state.countdownInterval)
      }
    }, 1000)

    if (state.typedId.length === config.ID_LENGTH) {
      state.isRedirecting = true
      redirectToUrl(state.typedId)
      resetState()
    }
  }

  createDisplayElement()
  document.addEventListener('paste', handlePaste)
  document.addEventListener('keydown', handleKeyDown)

  api.logging.info('Quick Navigator initialized')
}
