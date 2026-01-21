import { createContext } from 'react'
import { useSyncExternalStore } from "react"
import { getUserId, setUserId, clearUserId, subscribeUserId } from "@/shared/auth/user-id"

export type Ctx = {
	userId: number | null
	set: (userId: number) => void
	clear: () => void
	storageKey: string
}

export const UserIdContext = createContext<Ctx | null>(null)

export function useUserId() {
	const userId = useSyncExternalStore(subscribeUserId, getUserId, getUserId)

	return {
		userId,
		set: (id: number) => setUserId(id),
		clear: () => clearUserId(),
	}
}
