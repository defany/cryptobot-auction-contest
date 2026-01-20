import type { PrismaClient } from '../../../generated/prisma/client'
import type { QueryExecutor } from '../../../types/prisma'
import { create } from './create'
import { fetchAntisnipingSettings } from './fetch_antisniping_settings'
import { fetchById } from './fetch_by_id'
import { fetchExpiredAuctions } from './fetch_expired_auctions'
import { incrementAntisnipingExtensionIfNeeded } from './increment_antisniping_extenstion'
import { advanceRound, extendRoundIfNeeded, finishAuction } from './update_auction'

export class AuctionRepo {
	protected db: QueryExecutor

	create = create
	fetchById = fetchById
	fetchAntisnipingSettings = fetchAntisnipingSettings
	incrementAntisnipingExtensionIfNeeded = incrementAntisnipingExtensionIfNeeded
	extendRoundIfNeeded = extendRoundIfNeeded
	fetchExpiredAuctions = fetchExpiredAuctions
	advanceRound = advanceRound
	finishAuction = finishAuction

	constructor(db: QueryExecutor) {
		this.db = db
	}

	withTx(tx: QueryExecutor): AuctionRepo {
		return new AuctionRepo(tx)
	}
}
