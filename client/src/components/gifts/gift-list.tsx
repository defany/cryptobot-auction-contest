import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuctionDetailsDialog } from '@/components/auction/auction-details-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { callApi } from '@/lib/api/call-api'
import { useEffect, useMemo, useState } from 'react'

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

type CreateAuctionBody = {
	gift_id: string
	supply: number
	winners_per_round: number
	round_duration_sec: number
	antisniping_settings?: {
		extensionDurationSec: number
		thresholdSec: number
		maxExtensions: number
	}
}

type Props = {
	title?: string
}

function clampInt(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, Math.floor(n)))
}

function parsePositiveInt(raw: string, fallback: number) {
	const n = Number(raw)
	if (!Number.isFinite(n)) return fallback
	return clampInt(n, 0, Number.MAX_SAFE_INTEGER)
}

export function GiftList({ title = 'Gifts' }: Props) {
	const [gifts, setGifts] = useState<Gift[]>([])
	const [loading, setLoading] = useState(true)

	const [detailsOpen, setDetailsOpen] = useState(false)
	const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null)

	const [createOpen, setCreateOpen] = useState(false)
	const [createGiftId, setCreateGiftId] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)

	const [supply, setSupply] = useState('9000')
	const [winnersPerRound, setWinnersPerRound] = useState('100')
	const [roundDurationSec, setRoundDurationSec] = useState('60')

	const [antiEnabled, setAntiEnabled] = useState(true)
	const [extensionDurationSec, setExtensionDurationSec] = useState('10')
	const [thresholdSec, setThresholdSec] = useState('3')
	const [maxExtensions, setMaxExtensions] = useState('5')

	async function loadGifts(): Promise<void> {
		const res = await callApi<{ response: ApiResponse }>('GET', '/gifts')
		const list = Array.isArray(res?.gifts) ? res.gifts : []
		setGifts(list)
	}

	useEffect(() => {
		let cancelled = false

		async function load() {
			try {
				await loadGifts()
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		load()

		return () => {
			cancelled = true
		}
	}, [])

	const createPayload = useMemo<CreateAuctionBody | null>(() => {
		if (!createGiftId) return null

		const base: CreateAuctionBody = {
			gift_id: createGiftId,
			supply: clampInt(parsePositiveInt(supply, 9000), 1, 1_000_000_000),
			winners_per_round: clampInt(parsePositiveInt(winnersPerRound, 100), 1, 1_000_000_000),
			round_duration_sec: clampInt(parsePositiveInt(roundDurationSec, 60), 1, 86_400),
		}

		if (!antiEnabled) return base

		base.antisniping_settings = {
			extensionDurationSec: clampInt(parsePositiveInt(extensionDurationSec, 10), 1, 86_400),
			thresholdSec: clampInt(parsePositiveInt(thresholdSec, 3), 1, 86_400),
			maxExtensions: clampInt(parsePositiveInt(maxExtensions, 5), 1, 10_000),
		}

		return base
	}, [
		createGiftId,
		supply,
		winnersPerRound,
		roundDurationSec,
		antiEnabled,
		extensionDurationSec,
		thresholdSec,
		maxExtensions,
	])

	async function submitCreateAuction(): Promise<void> {
		if (!createPayload) return

		setIsCreating(true)
		try {
			await callApi('POST', '/auctions', { body: createPayload })
			await loadGifts()
			setCreateOpen(false)
			setCreateGiftId(null)
		} finally {
			setIsCreating(false)
		}
	}

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

			<Dialog
				open={createOpen}
				onOpenChange={open => {
					setCreateOpen(open)
					if (!open) setCreateGiftId(null)
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Create auction</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<div className="text-xs font-medium text-muted-foreground">Supply</div>
								<Input
									inputMode="numeric"
									value={supply}
									onChange={e => setSupply(e.target.value)}
									disabled={isCreating}
								/>
							</div>

							<div className="space-y-2">
								<div className="text-xs font-medium text-muted-foreground">Winners per round</div>
								<Input
									inputMode="numeric"
									value={winnersPerRound}
									onChange={e => setWinnersPerRound(e.target.value)}
									disabled={isCreating}
								/>
							</div>

							<div className="space-y-2 sm:col-span-2">
								<div className="text-xs font-medium text-muted-foreground">Round duration (sec)</div>
								<Input
									inputMode="numeric"
									value={roundDurationSec}
									onChange={e => setRoundDurationSec(e.target.value)}
									disabled={isCreating}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="text-xs font-medium text-muted-foreground">Anti-sniping</div>
							<div className="grid grid-cols-2 gap-2">
								<Button
									type="button"
									variant={antiEnabled ? 'secondary' : 'outline'}
									className="w-full"
									onClick={() => setAntiEnabled(true)}
									disabled={isCreating}
								>
									On
								</Button>
								<Button
									type="button"
									variant={!antiEnabled ? 'secondary' : 'outline'}
									className="w-full"
									onClick={() => setAntiEnabled(false)}
									disabled={isCreating}
								>
									Off
								</Button>
							</div>
						</div>

						{antiEnabled ? (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								<div className="space-y-2">
									<div className="text-xs font-medium text-muted-foreground">Extension (sec)</div>
									<Input
										inputMode="numeric"
										value={extensionDurationSec}
										onChange={e => setExtensionDurationSec(e.target.value)}
										disabled={isCreating}
									/>
								</div>

								<div className="space-y-2">
									<div className="text-xs font-medium text-muted-foreground">Threshold (sec)</div>
									<Input
										inputMode="numeric"
										value={thresholdSec}
										onChange={e => setThresholdSec(e.target.value)}
										disabled={isCreating}
									/>
								</div>

								<div className="space-y-2">
									<div className="text-xs font-medium text-muted-foreground">Max extensions</div>
									<Input
										inputMode="numeric"
										value={maxExtensions}
										onChange={e => setMaxExtensions(e.target.value)}
										disabled={isCreating}
									/>
								</div>
							</div>
						) : null}

						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => setCreateOpen(false)}
								disabled={isCreating}
							>
								Cancel
							</Button>
							<Button
								type="button"
								className="w-full"
								onClick={submitCreateAuction}
								disabled={!createPayload || isCreating}
							>
								{isCreating ? 'Creating…' : 'Create'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

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
										) : (
											<Badge variant="secondary">No auction</Badge>
										)}
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
									) : (
										<Button
											className="w-full"
											onClick={() => {
												setCreateGiftId(gift.id)
												setCreateOpen(true)
											}}
										>
											Create auction
										</Button>
									)}
								</CardContent>
							</Card>
						)
					})}
				</div>
			)}
		</div>
	)
}