import { getUserId } from './user-id'

export function buildAuthHeaders(storageKey?: string): Record<string, string> {
	const userId = getUserId(storageKey)
	if (!userId) return {}
	return { authorization: `Bearer ${userId}` }
}
