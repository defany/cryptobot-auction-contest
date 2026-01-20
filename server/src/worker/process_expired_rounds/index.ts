import { sleep } from 'bun'
import type { PrismaClient } from '../../../generated/prisma/client'
import type { AuctionRepo } from '../../repo/auction'
import type { BidRepo } from '../../repo/bid'
import type { GiftRepo } from '../../repo/gift'
import { finishAuction, processExpiredRound } from './process_expired_round'

export class ExpiredAuctionRoundsWorker {
	protected db: PrismaClient

	protected auctionRepo: AuctionRepo
	protected bidRepo: BidRepo
	protected giftRepo: GiftRepo

	protected processExpiredRound = processExpiredRound
	protected finishAuction = finishAuction

	protected isRunning = false
	protected closed = false

	constructor(
		db: PrismaClient,
		auctionRepo: AuctionRepo,
		bidRepo: BidRepo,
		giftRepo: GiftRepo,
	) {
		this.db = db
		this.auctionRepo = auctionRepo
		this.bidRepo = bidRepo
		this.giftRepo = giftRepo
	}

	start(): void {
		if (this.isRunning) {
			return
		}

		this.isRunning = true

		this.run().catch(err => {
			console.error('worker crashed', err)
		})
	}

	async close(): Promise<void> {
		this.closed = true
	}

	private async run(): Promise<void> {
		try {
			while (!this.closed) {
				const expiredAuctions = await this.auctionRepo.fetchExpiredAuctions()

				if (expiredAuctions.length > 0) {
					const results = await Promise.allSettled(
						expiredAuctions.map(auction => this.processExpiredRound(auction)),
					)

					for (const r of results) {
						if (r.status === 'rejected') {
							console.error(r.reason)
						}
					}
				}

				await sleep(500)
			}
		} finally {
			this.isRunning = false
		}
	}
}
