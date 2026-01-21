// src/components/gifts/my-gifts-list.tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { callApi } from '@/lib/api/call-api'
import { useEffect, useState } from 'react'

type GiftDto = {
	id: string
	name: string
	lastIssuedNumber: number
}

type UserGiftDto = {
	id: string
	number: number
	gift: GiftDto
}

type ApiResponse = {
	gifts: UserGiftDto[]
}

type Props = {
	title?: string
}

function formatNumber(n: number) {
	if (!Number.isFinite(n)) return '—'
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

export function MyGiftsList({ title = 'My gifts' }: Props) {
	const [items, setItems] = useState<UserGiftDto[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false

		async function load() {
			setLoading(true)
			try {
				const res = await callApi<{ response: ApiResponse }>('GET', '/gifts/my')
				const list = Array.isArray(res?.gifts) ? res.gifts : []

				if (!cancelled) {
					setItems(list)
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		load()

		return () => {
			cancelled = true
		}
	}, [])

	if (loading) {
		return <div className="text-sm text-muted-foreground">Loading my gifts…</div>
	}

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">{title}</h2>

			{items.length === 0 ? (
				<div className="text-sm text-muted-foreground">No gifts yet</div>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{items.map(item => (
						<Card key={item.id}>
							<CardHeader className="pb-2">
								<div className="flex items-start justify-between gap-2">
									<CardTitle className="text-base">{item.gift.name}</CardTitle>

									<Badge className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
										№ {formatNumber(item.number)}
									</Badge>
								</div>
							</CardHeader>

							<CardContent>
								<div className="text-sm text-muted-foreground">
									Last issued: <span className="text-foreground">{formatNumber(item.gift.lastIssuedNumber)}</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}