/**
 * Tipos e interfaces para a API do MeliTools
 */

export interface FloatingElementOptions {
  id?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  backgroundColor?: string
  textColor?: string
  padding?: string
  fontSize?: string
}

export interface ToastOptions {
  id?: string
  type?: 'info' | 'success' | 'error' | 'warning'
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export interface ModalButton {
  text: string
  type?: 'quiet' | 'loud'
  action: () => void
}

export interface ModalOptions {
  id?: string
  title: string
  content: string
  buttons?: ModalButton[]
  onClose?: () => void
  maxWidth?: string
  zIndex?: string
}

export interface WaitForElementOptions {
  timeout?: number
  maxAttempts?: number
}

export interface UIService {
  createFloatingElement(options?: FloatingElementOptions): HTMLElement
  showElement(element: HTMLElement, transform?: string): void
  hideElement(element: HTMLElement, transform?: string): void
  isElementVisible(element: HTMLElement): boolean
  removeElement(element: HTMLElement): void
  updateElementPositions(position: string): void
  showToast(message: string, options?: ToastOptions): void
  updateContent(element: HTMLElement, content: string): void
  createModal(options: ModalOptions): HTMLElement & { show(): void; hide(): void }
}

export interface DOMService {
  find(selector: string): HTMLElement | null
  findAll(selector: string): NodeListOf<HTMLElement>
  click(element: HTMLElement | string): void
  fill(element: HTMLElement | string, value: string): void
  waitForElement(selector: string, options?: WaitForElementOptions): Promise<HTMLElement>
  exists(selector: string): boolean
}

export interface KeyboardShortcutConfig {
  key: string
  altKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
}

export const MELITOOLS_THEME = {
  primaryColor: '#3483fa',
  secondaryColor: '#ffe600',
  successColor: '#00a650',
  errorColor: '#f23d4f',
  warningColor: '#fff5e6',
  fontFamily: "'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif",
  shadows: {
    small: '0 2px 8px rgba(0,0,0,0.10)',
    medium: '0 4px 15px rgba(0,0,0,0.2)',
    large: '0 6px 20px rgba(0,0,0,0.15)'
  },
  borderRadius: '6px'
}

export interface UtilsService {
  sleep(ms: number): Promise<void>
  onPageLoad(callback: () => void): void
  formatTime(ms: number): string
  log(message: string): void
  matchUrl(pattern: string): boolean
  matchUrls(patterns: string[]): boolean
  copyToClipboard(text: string, label?: string): Promise<void>
  registerKeyboardShortcut(keys: KeyboardShortcutConfig[], callback: (event: KeyboardEvent) => void): void
  playSound(frequency: number, duration: number, delayBetween?: number): void
  downloadFile(content: string, filename: string, mimeType?: string): void
}

export interface NavigationService {
  redirectTo(url: string): void
  refresh(): void
  goBack(): void
}

export interface StorageService {
  set(key: string, value: any): void
  get(key: string): any
  remove(key: string): void
  clear(): void
}

export interface LoggingService {
  log(message: string, level?: 'debug' | 'info' | 'warn' | 'error'): void
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

export interface MeliToolsAPI {
  ui: UIService
  dom: DOMService
  utils: UtilsService
  navigation: NavigationService
  storage: StorageService
  logging: LoggingService
}

export interface PluginMetadata {
  id: string
  name: string
  version?: string
  enabledByDefault?: boolean
}

export interface Plugin {
  metadata: PluginMetadata
  register(api: MeliToolsAPI): void
}

export type PluginRegisterFn = (api: MeliToolsAPI) => void
