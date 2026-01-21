import type { AuctionRepo } from '.'

export async function startAuction(
	this: AuctionRepo,
	auctionId: string,
	roundExpiresAt: Date,
): Promise<void> {
	await this.db.auction.update({
		where: {
			id: auctionId,
			status: 'SCHEDULED',
		},
		data: {
			status: 'IN_PROGRESS',
			roundExpiresAt: roundExpiresAt,
		},
	})
}

export async function finishAuction(
	this: AuctionRepo,
	auctionId: string,
): Promise<void> {
	await this.db.auction.update({
		where: {
			id: auctionId,
		},
		data: {
			status: 'FINISHED',
		},
	})
}

export async function advanceRound(
	this: AuctionRepo,
	input: {
		auctionId: string
		nextRound: number
		nextExpiresAt: Date | null
		supplyLeft: number
	},
): Promise<void> {
	const res = await this.db.auction.updateMany({
		where: {
			id: input.auctionId,
			round: input.nextRound - 1,
		},
		data: {
			round: input.nextRound,
			roundExpiresAt: input.nextExpiresAt,
			supply: input.supplyLeft,
			status: input.nextExpiresAt === null ? 'SCHEDULED' : 'IN_PROGRESS'
		},
	})

	if (res.count !== 1) {
		throw new Error('failed to advance auction round')
	}

	// если настроек нет - просто в молоко запрос улетит и ошибки не увидим никакой
	await this.db.auctionAntiSniping.updateMany({
		where: {
			auctionId: input.auctionId,
		},
		data: {
			currentExtension: 1,
		},
	})
}

export async function extendRoundIfNeeded(
	this: AuctionRepo,
	input: {
		auctionId: string
		currentExpiresAt: Date | null
		thresholdSec: number
		extensionDurationSec: number
	},
): Promise<boolean> {
	if (!input.currentExpiresAt) {
		return false
	}

	const now = new Date()

	const leftMs = input.currentExpiresAt.getTime() - now.getTime()
	const thresholdMs = input.thresholdSec * 1000

	if (leftMs < 0) {
		throw new Error('auction round expired')
	}

	if (leftMs > thresholdMs) {
		return false
	}

	const extensionMs = input.extensionDurationSec * 1000
	const nextExpiresAt = new Date(input.currentExpiresAt.getTime() + extensionMs)

	const res = await this.db.auction.updateMany({
		where: {
			id: input.auctionId,
			roundExpiresAt: input.currentExpiresAt,
		},
		data: {
			roundExpiresAt: nextExpiresAt,
		},
	})

	if (res.count !== 1) {
		throw new Error('failed to extend round duration')
	}

	return true
}