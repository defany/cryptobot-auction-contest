import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuctionDetailsDialog } from '@/components/auction/auction-details-dialog'
import { callApi } from '@/lib/api/call-api'
import { useEffect, useState } from 'react'

type Auction = {
	id: string
}

type Gift = {
	id: string
	name: string
	auctions?: Auction[]
}

type ApiResponse = {
	gifts: Gift[]
}

type Props = {
	title?: string
}

export function GiftList({ title = 'Gifts' }: Props) {
	const [gifts, setGifts] = useState<Gift[]>([])
	const [loading, setLoading] = useState(true)

	const [detailsOpen, setDetailsOpen] = useState(false)
	const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false

		async function load() {
			try {
				const res = await callApi<{ response: ApiResponse }>('GET', '/gifts')
				const list = Array.isArray(res?.gifts) ? res.gifts : []

				if (!cancelled) {
					setGifts(list)
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		load()

		return () => {
			cancelled = true
		}
	}, [])

	if (loading) {
		return <div className="text-sm text-muted-foreground">Loading gifts…</div>
	}

	return (
		<div className="space-y-4">
			<h1 className="text-lg font-semibold">{title}</h1>

			<AuctionDetailsDialog
				open={detailsOpen}
				auctionId={selectedAuctionId}
				onOpenChange={open => {
					setDetailsOpen(open)
					if (!open) setSelectedAuctionId(null)
				}}
			/>

			{gifts.length === 0 ? (
				<div className="text-sm text-muted-foreground">No gifts</div>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{gifts.map(gift => {
						const auctions = gift.auctions ?? []
						const hasAuctions = auctions.length > 0
						const firstAuctionId = auctions[0]?.id ?? null

						return (
							<Card key={gift.id} className="flex flex-col">
								<CardHeader className="pb-2">
									<div className="flex items-start justify-between gap-2">
										<CardTitle className="text-base">{gift.name}</CardTitle>

										{hasAuctions ? (
											<Badge className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
												Auction is here
											</Badge>
										) : null}
									</div>
								</CardHeader>

								<CardContent className="mt-auto space-y-3">
									<div className="text-sm text-muted-foreground">
										{hasAuctions ? `${auctions.length} auction` : 'No auctions yet'}
									</div>

									{hasAuctions && firstAuctionId ? (
										<Button
											variant="secondary"
											className="w-full"
											onClick={() => {
												setSelectedAuctionId(firstAuctionId)
												setDetailsOpen(true)
											}}
										>
											Подробнее
										</Button>
									) : null}
								</CardContent>
							</Card>
						)
					})}
				</div>
			)}
		</div>
	)
}