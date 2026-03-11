/**
 * MeliTools Boot
 * Arquivo de inicialização principal do MeliTools
 */

import { MeliTools } from './index'
import { plugins } from '../plugins/index'

// Inicializar MeliTools e registrar plugins
async function boot() {
  const meliTools = MeliTools.getInstance()

  // Registrar todos os plugins
  meliTools.registerPlugins(plugins)

  // Inicializar o MeliTools
  await meliTools.init()

  // Expor globalmente
  ;(window as any).MeliTools = {
    getAPI: () => meliTools.getAPI(),
    _instance: meliTools
  }
}

// Iniciar quando o documento estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
