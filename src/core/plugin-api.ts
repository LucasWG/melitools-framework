export const PluginAPI = {
	log: (...args: any[]) => console.log('[plugin]', ...args),
	storage: {
		get(key: string) {
			const r = GM_getValue(key)
			return r ? JSON.parse(r) : undefined
		},
		set(key: string, value: any) {
			GM_setValue(key, JSON.stringify(value))
		}
	},
	events: null as any,
	ui: {
		toast(msg: string) {
			alert(msg)
		}
	}
}

declare function GM_getValue(key: string): string | undefined
declare function GM_setValue(key: string, value: string): void
