import esbuild from 'esbuild'
import fs from 'fs'
;(async () => {
	const args = process.argv.slice(2)
	const watch = args.includes('--watch')

	// esbuild types are slightly different between versions; cast to any to avoid errors
	const buildOpts: any = {
		entryPoints: ['src/index.ts'],
		bundle: true,
		outfile: 'dist/core.js',
		format: 'iife',
		sourcemap: watch
	}

	if (watch) {
		// if watch requested, use context API
		const ctx = await esbuild.context(buildOpts)
		await ctx.watch()
	} else {
		await esbuild.build(buildOpts)
	}

	await esbuild.build(buildOpts)
	const header = fs.readFileSync('tampermonkey.user.js', 'utf8')
	const code = fs.readFileSync('dist/core.js', 'utf8')
	fs.writeFileSync('dist/melitools.user.js', header + '\n' + code)
	console.log('output written to dist/melitools.user.js')
})()
