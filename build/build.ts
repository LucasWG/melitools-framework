/**
 * Build Script para MeliTools
 * Orquestra a compilação de TypeScript, descoberta de plugins e bundling com esbuild
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { build } from 'esbuild'

const PROJECT_ROOT = resolve(import.meta.url.replace('file://', ''), '../..')
const SRC_DIR = join(PROJECT_ROOT, 'src')
const DIST_DIR = join(PROJECT_ROOT, 'dist')
const BUILD_DIR = join(PROJECT_ROOT, 'build')
const PLUGINS_DIR = join(SRC_DIR, 'plugins')
const HEADER_TEMPLATE = join(BUILD_DIR, 'header.template.js')
const BOOT_ENTRY = join(SRC_DIR, 'core', 'boot.ts')
const OUTPUT_FILE = join(DIST_DIR, 'melitools.user.js')

/**
 * Detecta todos os plugins no diretório plugins/
 */
function discoverPlugins(): Array<{ name: string; path: string }> {
  const pluginFiles = readdirSync(PLUGINS_DIR)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .map(file => ({
      name: file.replace('.ts', ''),
      path: file
    }))

  console.log(`[Build] Discovered ${pluginFiles.length} plugin(s):`)
  pluginFiles.forEach(p => console.log(`  - ${p.name}`))

  return pluginFiles
}

/**
 * Gera o arquivo plugins/index.ts com base nos plugins descobertos
 */
function generatePluginIndex(plugins: Array<{ name: string; path: string }>) {
  const imports = plugins
    .map((p, i) => {
      const importName = `register${p.name
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')}`
      return `import ${importName} from './${p.name}'`
    })
    .join('\n')

  const pluginsList = plugins
    .map((p, i) => {
      const importName = `register${p.name
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')}`
      return `  ['${p.name}', ${importName}]`
    })
    .join(',\n')

  const content = `/**
 * Plugin Registry
 * Este arquivo é gerado automaticamente pelo build script.
 * Ele importa e registra todos os plugins do projeto.
 */

import type { PluginRegisterFn } from '../core/types'

// Importar todos os plugins
${imports}

// Lista de plugins para registro
export const plugins: Array<[string, PluginRegisterFn]> = [
${pluginsList}
]
`

  const pluginIndexPath = join(PLUGINS_DIR, 'index.ts')
  writeFileSync(pluginIndexPath, content)
  console.log(`[Build] Generated plugin index at ${pluginIndexPath}`)
}

/**
 * Realiza o bundling com esbuild
 */
async function bundleWithEsbuild() {
  console.log('[Build] Starting esbuild bundling...')

  try {
    const result = await build({
      entryPoints: [BOOT_ENTRY],
      bundle: true,
      format: 'iife',
      target: 'es2020',
      outfile: OUTPUT_FILE,
      splitting: false,
      sourcemap: false,
      minify: false,
      platform: 'browser',
      loader: {
        '.ts': 'ts'
      }
    })

    console.log('[Build] esbuild completed successfully')
    return true
  } catch (error) {
    console.error('[Build] esbuild failed:', error)
    return false
  }
}

/**
 * Lê o header template e o prefixo ao arquivo final
 */
function prefixHeader() {
  try {
    const header = readFileSync(HEADER_TEMPLATE, 'utf-8')
    const bundleContent = readFileSync(OUTPUT_FILE, 'utf-8')

    // Remove o primeiro IIFE wrapper se existir e que será gerado novamente
    let cleanBundle = bundleContent

    // Cria o arquivo final com header + bundle
    const finalContent = `${header}\n\n${cleanBundle}`

    writeFileSync(OUTPUT_FILE, finalContent)
    console.log(`[Build] Added header from ${HEADER_TEMPLATE}`)
    console.log(`[Build] Output written to ${OUTPUT_FILE}`)
    console.log(`[Build] Final bundle size: ${(finalContent.length / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('[Build] Failed to add header:', error)
    throw error
  }
}

/**
 * Função principal de build
 */
async function main() {
  console.log('🚀 MeliTools Build Process Started')
  console.log(`   Project Root: ${PROJECT_ROOT}`)
  console.log(`   Dist Dir: ${DIST_DIR}`)

  try {
    // 1. Descobrir plugins
    const plugins = discoverPlugins()

    // 2. Gerar plugins/index.ts
    generatePluginIndex(plugins)

    // 3. Fazer bundling
    const bundleSuccess = await bundleWithEsbuild()
    if (!bundleSuccess) {
      process.exit(1)
    }

    // 4. Prefixar header
    prefixHeader()

    console.log('✅ Build completed successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

// Executar
main()
