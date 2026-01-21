import { useUserId } from '@/app/providers/use-user-id'
import { UserBadge } from '@/components/auth/user-badge'
import { UserIdLogin } from '@/components/auth/user-id-login'
import { GiftList } from '@/components/gifts/gift-list'
import { MyGiftsList } from './components/gifts/my-gifts-list'
import { ThemeProvider } from './components/themes/theme-provider'
import { UserBalance } from '@/components/balance/user-balance'

function AppContent() {
	const { userId, set } = useUserId()

	if (!userId) {
		return (
			<div className="min-h-svh bg-background flex items-center justify-center">
				<UserIdLogin onLogin={set} />
			</div>
		)
	}

	return (
		<div className="min-h-svh bg-background p-6 space-y-6">
			<div className="flex items-center justify-between">
				<UserBalance />
				<UserBadge />
			</div>

			<GiftList />
			<MyGiftsList title="My gifts" />
		</div>
	)
}

export default function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<AppContent />
		</ThemeProvider>
	)
}