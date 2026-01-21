import { useMemo, useState } from "react"
import { clearUserId, getUserId, setUserId } from "@/shared/auth/user-id"
import { UserIdContext, type Ctx } from './use-user-id'

export function UserIdProvider({
	children,
	storageKey = "user_id",
}: {
	children: React.ReactNode
	storageKey?: string
}) {
	const [userId, setUserIdState] = useState<number | null>(() =>
		getUserId(storageKey),
	)

	const value = useMemo<Ctx>(() => {
		return {
			userId: userId,
			storageKey: storageKey,
			set: (id: number) => {
				setUserId(id, storageKey)
				setUserIdState(id)
			},
			clear: () => {
				clearUserId(storageKey)
				setUserIdState(null)
			},
		}
	}, [userId, storageKey])

	return (
		<UserIdContext.Provider value={value}>
			{children}
		</UserIdContext.Provider>
	)
}