import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getUserId, setUserId } from '@/shared/auth/user-id'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

type Props = {
	onLogin?: (userId: number) => void
}

export function UserIdLogin({ onLogin }: Props) {
	const [value, setValue] = useState(() => {
		const current = getUserId()
		return current ? String(current) : ''
	})
	const [error, setError] = useState<string | null>(null)

	function submit() {
		const n = Number(value.trim())
		if (!Number.isInteger(n) || n <= 0) {
			setError('Enter a valid user id')
			return
		}
		setUserId(n)
		setError(null)
		onLogin?.(n)
	}

	return (
		<div className='w-full max-w-sm space-y-2'>
			<Label htmlFor='user-id'>Login</Label>
			<div className='flex gap-2'>
				<Input
					id='user-id'
					placeholder='user id'
					inputMode='numeric'
					value={value}
					onChange={e => setValue(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter') submit()
					}}
				/>
				<Button type='button' size='icon' onClick={submit} aria-label='Login'>
					<ArrowRight className='h-4 w-4' />
				</Button>
			</div>
			{error ? <p className='text-sm text-destructive'>{error}</p> : null}
		</div>
	)
}
