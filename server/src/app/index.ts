import cors from "@fastify/cors"
import { config } from '../config'
import { DI } from './di'

export class App {
	protected di = new DI()

	async run(): Promise<void> {
		const httpServer = await this.di.httpServer

		await this.setupMiddlewares()
		await this.setupRoutes()
		await this.startWorkers()

		await httpServer.register(cors, {
			origin: "*",
		})

		await httpServer.listen({
			port: config.http_port,
		})
	}

	private async setupRoutes(): Promise<void> {
		const giftHandler = await this.di.giftHandler
		giftHandler.setup()

		const auctionHandler = await this.di.auctionHandler
		auctionHandler.setup()

		const userHandler = await this.di.userHandler
		userHandler.setup()
	}

	private async setupMiddlewares(): Promise<void> {
		const authMiddleware = await this.di.authMiddleware
		authMiddleware.setup()
	}

	private async startWorkers(): Promise<void> {
		const expiredAuctionRoundsWorker = await this.di.expiredAuctionRoundsWorker
		expiredAuctionRoundsWorker.start()
	}
}
