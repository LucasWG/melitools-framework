// simple cache helpers
export function getCache(): any {
	const raw = GM_getValue('plugin_cache')
	return raw ? JSON.parse(raw) : {}
}
export function setCache(val: any) {
	GM_setValue('plugin_cache', JSON.stringify(val))
}

declare function GM_getValue(key: string): string | undefined
declare function GM_setValue(key: string, value: string): void
