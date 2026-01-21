import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/common/user-avatar'
import { useCountdown } from '@/hooks/use-countdown'
import { callApi } from '@/lib/api/call-api'
import { useEffect, useMemo, useState } from 'react'

type AuctionDto = {
	id: string
	giftId: string
	round: number
	roundExpiresAt: string
	supply: number
	winnersPerRound: number
	status: 'IN_PROGRESS' | 'FINISHED' | string
	createdAt: string
}

type BidDto = {
	id: string
	auctionId: string
	bidderId: number
	amount: number
	status: 'PENDING' | string
	createdAt: string
}

type AuctionResponse = {
	auction: AuctionDto | null
	minimal_bid_to_beat: BidDto | null
}

type TopBidsResponse = {
	bids: BidDto[]
	user_bid: BidDto | null
	user_place: number | null
}

type Props = {
	open: boolean
	auctionId: string | null
	onOpenChange: (open: boolean) => void
}

function formatCompactNumber(n: number) {
	try {
		return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
	} catch {
		return String(n)
	}
}

function formatCountdown(sec: number) {
	const s = Math.max(0, sec)

	const days = Math.floor(s / 86400)
	const hours = Math.floor((s % 86400) / 3600)
	const minutes = Math.floor((s % 3600) / 60)
	const seconds = s % 60

	const parts: string[] = []
	if (days > 0) parts.push(`${days}d`)
	if (hours > 0 || days > 0) parts.push(`${hours}h`)
	if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`)
	parts.push(`${String(seconds).padStart(2, '0')}s`)

	return parts.join(' ')
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

function RankBadge({ rank }: { rank: number }) {
	const isTop = rank === 1
	return (
		<div
			className={[
				'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
				isTop ? 'bg-yellow-400/90 text-black' : 'bg-muted text-muted-foreground',
			].join(' ')}
		>
			{rank}
		</div>
	)
}

export function AuctionDetailsDialog({ open, auctionId, onOpenChange }: Props) {
	const [loading, setLoading] = useState(false)
	const [auctionRes, setAuctionRes] = useState<AuctionResponse | null>(null)
	const [topRes, setTopRes] = useState<TopBidsResponse | null>(null)

	const [bidValue, setBidValue] = useState(0)
	const [isSubmittingBid, setIsSubmittingBid] = useState(false)

	useEffect(() => {
		if (!open || !auctionId) {
			setAuctionRes(null)
			setTopRes(null)
			return
		}

		let cancelled = false

		async function load() {
			setLoading(true)
			try {
				const [a, t] = await Promise.all([
					callApi<{ response: AuctionResponse }>('GET', `/auctions/${auctionId}`),
					callApi<{ response: TopBidsResponse }>(
						'GET',
						`/auctions/${auctionId}/bids/top`,
					),
				])

				if (!cancelled) {
					setAuctionRes(a)
					setTopRes(t)
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		load()

		return () => {
			cancelled = true
		}
	}, [open, auctionId])

	const auction = auctionRes?.auction ?? null
	const minimalBidToBeat = auctionRes?.minimal_bid_to_beat ?? null

	const countdown = useCountdown(auction?.roundExpiresAt ?? null)

	const topBids = topRes?.bids ?? []
	const userBid = topRes?.user_bid ?? null
	const userPlace = topRes?.user_place ?? null

	const top1Amount = topBids[0]?.amount ?? 0

	const sliderMax = useMemo(() => Math.max(0, top1Amount * 2), [top1Amount])

	const minimalToWinAmount = minimalBidToBeat?.amount ?? 0

	const resultingBidAmount = useMemo(() => {
		const base = userBid?.amount ?? 0
		return base + bidValue
	}, [userBid, bidValue])

	const minimalDelta = useMemo(() => {
		if (!minimalBidToBeat) return null
		if (!userBid) return minimalBidToBeat.amount
		return Math.max(0, minimalBidToBeat.amount - userBid.amount)
	}, [minimalBidToBeat, userBid])

	const minimalDeltaText = useMemo(() => {
		if (minimalDelta === null) return '—'
		return `⭐ ${formatCompactNumber(minimalDelta)}`
	}, [minimalDelta])

	const untilNextRoundText = useMemo(() => {
		if (countdown.leftSec == null) return '—'
		return formatCountdown(countdown.leftSec)
	}, [countdown.leftSec])

	const statusBadge = useMemo(() => {
		if (!auction) return null
		if (auction.status === 'IN_PROGRESS') {
			return (
				<Badge className="bg-green-500/15 text-green-400 border border-green-500/20 rounded-full">
					IN PROGRESS
				</Badge>
			)
		}
		return (
			<Badge variant="secondary" className="rounded-full">
				{auction.status}
			</Badge>
		)
	}, [auction])

	const winnersPerRound = auction?.winnersPerRound ?? 0
	const supplyLeft = auction?.supply ?? 0

	useEffect(() => {
		if (!open) return
		setBidValue(0)
	}, [open])

	const thresholdPct = useMemo(() => {
		if (sliderMax <= 0) return null
		const base = userBid?.amount ?? 0
		const need = Math.max(0, minimalToWinAmount - base)
		return clamp((need / sliderMax) * 100, 0, 100)
	}, [sliderMax, userBid, minimalToWinAmount])

	const isAboveMinimal = useMemo(() => {
		if (!minimalBidToBeat) return true
		return resultingBidAmount >= minimalToWinAmount
	}, [resultingBidAmount, minimalToWinAmount, minimalBidToBeat])

	async function reloadAuctionData(): Promise<void> {
		if (!auctionId) return

		const [a, t] = await Promise.all([
			callApi<{ response: AuctionResponse }>('GET', `/auctions/${auctionId}`),
			callApi<{ response: TopBidsResponse }>(
				'GET',
				`/auctions/${auctionId}/bids/top`,
			),
		])

		setAuctionRes(a)
		setTopRes(t)
	}

	useEffect(() => {
		if (!open || !auctionId) return

		let cancelled = false
		let inFlight = false

		const id = setInterval(() => {
			if (cancelled || inFlight || isSubmittingBid) return
			inFlight = true
			reloadAuctionData()
				.catch(() => {})
				.finally(() => {
					inFlight = false
				})
		}, 2000)

		return () => {
			cancelled = true
			clearInterval(id)
		}
	}, [open, auctionId, isSubmittingBid])

	async function submitBid(): Promise<void> {
		if (!auctionId) return
		if (bidValue <= 0) return
		if (!isAboveMinimal) return

		setIsSubmittingBid(true)
		try {
			await callApi('POST', `/auctions/${auctionId}/bids`, {
				body: { amount: String(bidValue) },
			})

			setBidValue(0)
			await reloadAuctionData()
		} finally {
			setIsSubmittingBid(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Place a Bid</DialogTitle>
				</DialogHeader>

				{loading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : !auction ? (
					<div className="text-sm text-muted-foreground">Auction not found</div>
				) : (
					<div className="space-y-4">
						<div className="rounded-xl bg-muted/40 p-4">
							<div className="flex items-center justify-between gap-3">
								<div className="text-sm text-muted-foreground">Minimum bid</div>
								<div className="text-xl font-semibold">{minimalDeltaText}</div>
							</div>
						</div>

						<div className="space-y-3 rounded-xl bg-muted/25 p-4">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">⭐ {formatCompactNumber(bidValue)}</div>
								<div className="text-sm text-muted-foreground">
									Your total:{' '}
									<span className="text-foreground font-medium">
										⭐ {formatCompactNumber(resultingBidAmount)}
									</span>
								</div>
							</div>

							<div className="relative">
								{thresholdPct != null ? (
									<div
										className="pointer-events-none absolute -top-1 bottom-[-4px] w-[2px] rounded-full bg-yellow-400/70"
										style={{ left: `${thresholdPct}%` }}
									/>
								) : null}

								<input
									type="range"
									min={0}
									max={sliderMax}
									step={1}
									value={bidValue}
									onChange={e => setBidValue(Number(e.target.value) || 0)}
									className="w-full accent-yellow-400"
								/>
							</div>

							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>0</span>
								<span>max ⭐ {formatCompactNumber(sliderMax)}</span>
							</div>

							<div className="flex items-center gap-2">
								<div className="w-32">
									<Input
										inputMode="numeric"
										value={String(bidValue)}
										onChange={e => {
											const n = Number(e.target.value)
											if (!Number.isFinite(n)) {
												setBidValue(0)
												return
											}
											setBidValue(clamp(Math.floor(n), 0, sliderMax))
										}}
									/>
								</div>

								<div className="text-sm">
									{isAboveMinimal ? (
										<span className="text-green-400">✅ beats minimum</span>
									) : (
										<span className="text-yellow-400">
											needs ⭐ {formatCompactNumber(Math.max(0, minimalToWinAmount - resultingBidAmount))}
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-2">
							<div className="rounded-xl bg-muted/40 p-3 text-center">
								<div className="text-lg font-semibold">{minimalDeltaText}</div>
								<div className="text-xs text-muted-foreground">minimum bid</div>
							</div>

							<div className="rounded-xl bg-muted/40 p-3 text-center">
								<div className="text-lg font-semibold">{untilNextRoundText}</div>
								<div className="text-xs text-muted-foreground">until next round</div>
							</div>

							<div className="rounded-xl bg-muted/40 p-3 text-center">
								<div className="text-lg font-semibold">{formatCompactNumber(supplyLeft)}</div>
								<div className="text-xs text-muted-foreground">left</div>
							</div>
						</div>

						<div className="space-y-2">
							<div className="text-xs font-medium text-muted-foreground">YOUR BID WILL BE</div>

							<div className="rounded-xl bg-muted/20 p-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<UserAvatar id={userBid?.bidderId ?? 0} />
										<div className="leading-tight">
											<div className="text-sm font-medium">User {userBid?.bidderId ?? '—'}</div>
											<div className="text-xs text-muted-foreground">
												{userPlace ? `Place #${userPlace}` : 'No place yet'}
											</div>
										</div>
									</div>

									<div className="text-sm font-semibold">⭐ {formatCompactNumber(resultingBidAmount)}</div>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="text-xs font-medium text-muted-foreground">
									TOP {winnersPerRound} WINNERS
								</div>

								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="rounded-full">
										Round {auction.round}
									</Badge>
									{statusBadge}
								</div>
							</div>

							<div className="space-y-2">
								{topBids.length === 0 ? (
									<div className="text-sm text-muted-foreground">No bids yet</div>
								) : (
									topBids.map((b, idx) => (
										<div
											key={b.id}
											className="flex items-center justify-between rounded-xl bg-muted/20 p-3"
										>
											<div className="flex items-center gap-3">
												<RankBadge rank={idx + 1} />
												<UserAvatar id={b.bidderId} />
												<div className="text-sm font-medium">User {b.bidderId}</div>
											</div>

											<div className="text-sm font-semibold">⭐ {formatCompactNumber(b.amount)}</div>
										</div>
									))
								)}
							</div>
						</div>

						<Button
							className="w-full"
							disabled={!isAboveMinimal || bidValue <= 0 || isSubmittingBid}
							onClick={submitBid}
						>
							{isSubmittingBid ? 'Submitting…' : 'Place a Bid'}
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}