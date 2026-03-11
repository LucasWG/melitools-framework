import type { MeliToolsAPI, PluginRegisterFn } from './types'
import { createUIService } from './services/ui'
import { createDOMService } from './services/dom'
import { createUtilsService } from './services/utils'
import { createNavigationService } from './services/navigation'
import { createStorageService } from './services/storage'
import { createLoggingService } from './services/logging'

/**
 * Factory para criar a API completa do MeliTools
 */
export const createMeliToolsAPI = (): MeliToolsAPI => {
  return {
    ui: createUIService(),
    dom: createDOMService(),
    utils: createUtilsService(),
    navigation: createNavigationService(),
    storage: createStorageService(),
    logging: createLoggingService()
  }
}

/**
 * Gerenciador de plugins
 */
class PluginManager {
  private plugins: Map<string, PluginRegisterFn> = new Map()
  private api: MeliToolsAPI

  constructor(api: MeliToolsAPI) {
    this.api = api
  }

  register(id: string, pluginFn: PluginRegisterFn) {
    if (this.plugins.has(id)) {
      console.warn(`[MeliTools] Plugin "${id}" already registered, skipping`)
      return
    }
    this.plugins.set(id, pluginFn)
  }

  registerMultiple(plugins: Array<[string, PluginRegisterFn]>) {
    plugins.forEach(([id, pluginFn]) => {
      this.register(id, pluginFn)
    })
  }

  async init() {
    this.api.logging.info(`Initializing ${this.plugins.size} plugins`)

    for (const [id, pluginFn] of this.plugins.entries()) {
      try {
        pluginFn(this.api)
        this.api.logging.debug(`Plugin "${id}" initialized`)
      } catch (error) {
        this.api.logging.error(`Failed to initialize plugin "${id}": ${error}`)
      }
    }
  }
}

export class MeliTools {
  private static instance: MeliTools
  private api: MeliToolsAPI
  private pluginManager: PluginManager

  private constructor() {
    this.api = createMeliToolsAPI()
    this.pluginManager = new PluginManager(this.api)
  }

  static getInstance(): MeliTools {
    if (!MeliTools.instance) {
      MeliTools.instance = new MeliTools()
    }
    return MeliTools.instance
  }

  getAPI(): MeliToolsAPI {
    return this.api
  }

  registerPlugin(id: string, pluginFn: PluginRegisterFn) {
    this.pluginManager.register(id, pluginFn)
  }

  registerPlugins(plugins: Array<[string, PluginRegisterFn]>) {
    this.pluginManager.registerMultiple(plugins)
  }

  async init() {
    this.api.logging.info('MeliTools starting')
    await this.pluginManager.init()
    this.api.logging.info('MeliTools ready')
  }
}

export type { MeliToolsAPI, PluginMetadata, Plugin, PluginRegisterFn } from './types'
