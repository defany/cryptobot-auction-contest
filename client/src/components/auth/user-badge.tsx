import { Button } from '@/components/ui/button'
import { clearUserId, getUserId, subscribeUserId } from '@/shared/auth/user-id'
import { useSyncExternalStore } from 'react'

export function UserBadge() {
	const userId = useSyncExternalStore(
		subscribeUserId,
		() => getUserId(),
		() => getUserId(),
	)

	if (!userId) {
		return null
	}

	return (
		<div className='absolute right-4 top-4 flex items-center gap-3'>
			<span className='text-sm text-muted-foreground'>
				Logged in as <span className='font-medium text-foreground'>{userId}</span>
			</span>

			<Button variant='outline' size='sm' onClick={() => clearUserId()}>
				Log out
			</Button>
		</div>
	)
}