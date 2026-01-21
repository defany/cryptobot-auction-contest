const defaultKey = 'user_id'

const listeners = new Set<() => void>()

function emit() {
	for (const l of listeners) l()
}

export function subscribeUserId(cb: () => void) {
	listeners.add(cb)
	return () => listeners.delete(cb)
}

export function getUserId(storageKey: string = defaultKey): number | null {
	const v = sessionStorage.getItem(storageKey)
	if (!v) return null

	const n = Number(v)
	if (!Number.isInteger(n) || n <= 0) return null

	return n
}

export function setUserId(userId: number, storageKey: string = defaultKey): void {
	sessionStorage.setItem(storageKey, String(userId))
	emit()
}

export function clearUserId(storageKey: string = defaultKey): void {
	sessionStorage.removeItem(storageKey)
	emit()
}