import { useUserId } from '@/app/providers/use-user-id'
import { UserBadge } from '@/components/auth/user-badge'
import { UserIdLogin } from '@/components/auth/user-id-login'
import { ThemeProvider } from './components/themes/theme-provider'
import { GiftList } from "@/components/gifts/gift-list"

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
		<div className="min-h-svh bg-background p-6">
			<UserBadge />
			<GiftList/>
		</div>
	)
}

export default function App() {
	return (
		<ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
			<AppContent />
		</ThemeProvider>
	)
}
