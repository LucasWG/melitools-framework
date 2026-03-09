import fs from 'fs'
import path from 'path'

// read package.json to get version
const pkgData = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'))
// read header from template file, stopping at the placeholder comment
const templatePath = path.resolve('src/tampermonkey.user.js')
let banner = fs.readFileSync(templatePath, 'utf-8')
// remove everything after the placeholder line if present
banner = banner.replace(/\n\s*\/\/ the built bundle[\s\S]*$/m, '') + '\n'

// update version automatically
banner = banner.replace(/@version\s+.*$/m, `@version       ${pkgData.version}`)

function insertTemplatePlugin() {
	return {
		name: 'insert-template',
		generateBundle(options, bundle) {
			const outName = Object.keys(bundle)[0]
			let generated = bundle[outName].code
			// remove banner if present (metadata at top)
			generated = generated.replace(
				/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/,
				''
			)
			const template = fs.readFileSync(templatePath, 'utf-8')
			let final
			if (template.includes('// the built bundle will be injected here during build')) {
				final = template.replace(
					'// the built bundle will be injected here during build',
					generated
				)
			} else {
				// no placeholder: append after metadata closing
				const parts = template.split(/(\/\/ ==\/UserScript==\s*)/)
				if (parts.length >= 3) {
					final = parts[0] + parts[1] + '\n' + generated
				} else {
					final = template + '\n\n' + generated
				}
			}
			fs.writeFileSync(path.resolve('dist/melitools.user.js'), final, 'utf-8')
			bundle[outName].code = final
		}
	}
}

export default {
	input: 'src/main.js',
	output: {
		file: 'dist/melitools.user.js',
		format: 'iife',
		name: 'MeliTools',
		sourcemap: true,
		banner
	},
	plugins: [insertTemplatePlugin()]
}
