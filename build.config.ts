import esbuild from 'esbuild'
import fs from 'fs'
;(async () => {
	const args = process.argv.slice(2)
	const watch = args.includes('--watch')

	// esbuild options used for bundling the core logic
	const baseOpts: any = {
		entryPoints: ['src/index.ts'],
		bundle: true,
		format: 'iife',
		sourcemap: watch
	}

	if (watch) {
		// watch mode still writes core.js so esbuild's context can reuse it
		const ctx = await esbuild.context({ ...baseOpts, outfile: 'dist/core.js' })
		await ctx.watch()
		return
	}

	// production build: emit to memory and stitch with header
	const result = await esbuild.build({ ...baseOpts, write: false })
	const code = result.outputFiles?.[0]?.text ?? ''

	// read template header and insert plugin requires
	let header = fs.readFileSync('tampermonkey.user.js', 'utf8')
	const pluginsDir = 'src/plugins'
	const pluginFiles = fs.existsSync(pluginsDir)
		? fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
		: []
	const requireLines = pluginFiles
		.map(
			f =>
				`// @require https://raw.githubusercontent.com/LucasWG/melitools-framework/main/src/plugins/${f}`
		)
		.join('\n')
	if (header.includes('// @plugins')) {
		header = header.replace('// @plugins', requireLines)
	} else {
		header += '\n' + requireLines
	}

	fs.writeFileSync('dist/melitools.user.js', header + '\n' + code)
	console.log('output written to dist/melitools.user.js')
	// clean up leftover file if esbuild ever created it
	try {
		fs.unlinkSync('dist/core.js')
	} catch {}
})()
