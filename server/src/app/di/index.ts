import { type FastifyInstance } from 'fastify'
import { PrismaClient } from '../../../generated/prisma/client'
import type { AuctionHandler } from '../../controller/handler/auction'
import type { GiftHandler } from '../../controller/handler/gift'
import type { UserHandler } from '../../controller/handler/user'
import type { AuthMiddleware } from '../../controller/middleware/auth'
import type { ErrorMiddleware } from '../../controller/middleware/error'
import type { AuctionRepo } from '../../repo/auction'
import type { BidRepo } from '../../repo/bid'
import type { GiftRepo } from '../../repo/gift'
import type { UserRepo } from '../../repo/user'
import type { AuctionService } from '../../service/auction'
import type { GiftService } from '../../service/gift'
import type { UserService } from '../../service/user'
import type { ExpiredAuctionRoundsWorker } from '../../worker/process_expired_rounds'
import {
	auctionHandler,
	auctionRepo,
	auctionService,
	expiredAuctionRoundsWorker,
} from './auction'
import { bidRepo } from './bid'
import { database } from './db'
import { giftHandler, giftRepo, giftService } from './gift'
import { errorMiddleware, httpServer } from './http'
import { authMiddleware, userHandler, userRepo, userService } from './user'

type Factory<T> = (this: DI) => T | Promise<T>
type ShutdownHook = () => void | Promise<void>

export class DI {
	readonly deps = new WeakMap<Function, Promise<unknown>>()

	private readonly shutdownHooks: ShutdownHook[] = []
	private shuttingDown = false

	constructor() {
		this.enableGracefulShutdown()
	}

	@Inject(database)
	database!: Promise<PrismaClient>

	@Inject(httpServer)
	httpServer!: Promise<FastifyInstance>
	@Inject(errorMiddleware)
	errorMiddleware!: Promise<ErrorMiddleware>

	@Inject(giftHandler)
	giftHandler!: Promise<GiftHandler>
	@Inject(giftService)
	giftService!: Promise<GiftService>
	@Inject(giftRepo)
	giftRepo!: Promise<GiftRepo>

	@Inject(auctionHandler)
	auctionHandler!: Promise<AuctionHandler>
	@Inject(auctionService)
	auctionService!: Promise<AuctionService>
	@Inject(auctionRepo)
	auctionRepo!: Promise<AuctionRepo>

	@Inject(authMiddleware)
	authMiddleware!: Promise<AuthMiddleware>
	@Inject(userHandler)
	userHandler!: Promise<UserHandler>
	@Inject(userService)
	userService!: Promise<UserService>
	@Inject(userRepo)
	userRepo!: Promise<UserRepo>

	@Inject(bidRepo)
	bidRepo!: Promise<BidRepo>

	@Inject(expiredAuctionRoundsWorker)
	expiredAuctionRoundsWorker!: Promise<ExpiredAuctionRoundsWorker>

	protected use<T>(factory: Factory<T>): Promise<T> {
		const cached = this.deps.get(factory)
		if (cached !== undefined) return cached as Promise<T>

		const promise = Promise.resolve(factory.call(this)).then(
			value => value,
			err => {
				this.deps.delete(factory)
				throw err
			},
		)

		this.deps.set(factory, promise)
		return promise
	}

	protected onShutdown(fn: ShutdownHook): void {
		this.shutdownHooks.push(fn)
	}

	private enableGracefulShutdown(): void {
		const handler = async () => {
			if (this.shuttingDown) return
			this.shuttingDown = true

			const hooks = [...this.shutdownHooks].reverse()

			try {
				for (const hook of hooks) {
					await hook()
				}
			} catch (err) {
				console.error('graceful shutdown failed', err)
				process.exitCode = 1
			} finally {
				process.exit()
			}
		}

		process.once('SIGINT', handler)
		process.once('SIGTERM', handler)
	}
}

function Inject<T>(factory: Factory<T>) {
	return function (target: any, propertyKey: string) {
		Object.defineProperty(target, propertyKey, {
			get: function (this: DI) {
				return this.use(factory)
			},
			enumerable: true,
			configurable: true,
		})
	}
}
