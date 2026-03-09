// generic fetch wrapper using GM_xmlhttpRequest when available

export async function gmFetch(url, options = {}) {
	if (typeof GM_xmlhttpRequest !== 'function') {
		return fetch(url, options)
	}
	return new Promise((resolve, reject) => {
		GM_xmlhttpRequest({
			method: options.method || 'GET',
			url,
			headers: options.headers,
			responseType: options.responseType || 'json',
			onload: res => {
				resolve({
					ok: res.status >= 200 && res.status < 300,
					status: res.status,
					json: () => Promise.resolve(res.response),
					text: () => Promise.resolve(res.responseText)
				})
			},
			onerror: reject
		})
	})
}
