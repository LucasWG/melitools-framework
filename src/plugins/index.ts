/**
 * Plugin Registry
 * Este arquivo é gerado automaticamente pelo build script.
 * Ele importa e registra todos os plugins do projeto.
 */

import type { PluginRegisterFn } from '../core/types'

// Importar todos os plugins
import registerPackageStatusChanger from './package-status-changer'
import registerQuickNavigator from './quick-navigator'

// Lista de plugins para registro
export const plugins: Array<[string, PluginRegisterFn]> = [
  ['package-status-changer', registerPackageStatusChanger],
  ['quick-navigator', registerQuickNavigator]
]
