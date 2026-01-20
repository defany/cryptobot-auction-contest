import type { DI } from '.'
import { AuctionHandler } from '../../controller/handler/auction'
import { AuctionRepo } from '../../repo/auction'
import { AuctionService } from '../../service/auction'
import { ExpiredAuctionRoundsWorker } from '../../worker/process_expired_rounds'

export async function expiredAuctionRoundsWorker(
	this: DI,
): Promise<ExpiredAuctionRoundsWorker> {
	const worker = new ExpiredAuctionRoundsWorker(
		await this.database,
		await this.auctionRepo,
		await this.bidRepo,
		await this.giftRepo,
	)

	this.onShutdown(async () => {
		return await worker.close()
	})

	return worker 
}

export async function auctionHandler(this: DI): Promise<AuctionHandler> {
	return new AuctionHandler(await this.httpServer, await this.auctionService)
}

export async function auctionService(this: DI): Promise<AuctionService> {
	return new AuctionService(
		await this.database,
		await this.auctionRepo,
		await this.bidRepo,
		await this.userRepo,
	)
}

export async function auctionRepo(this: DI): Promise<AuctionRepo> {
	return new AuctionRepo(await this.database)
}
