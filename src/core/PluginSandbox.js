import { DebugLogger } from './DebugLogger.js'

export class PluginSandbox {
	constructor(api) {
		this.api = api
	}

	run(code, meta) {
		DebugLogger.log('PluginSandbox run', meta.id)
		const sandbox = {
			API: this.api,
			console
		}
		const keys = Object.keys(sandbox)
		const values = Object.values(sandbox)
		const wrapped = `
            (function(${keys.join(',')}){
                try {
                    ${code}
                } catch(e){
                    console.error('[Plugin ${meta.id}]', e);
                }
            });
        `
		const fn = new Function(...keys, wrapped)
		fn(...values)
	}
}
