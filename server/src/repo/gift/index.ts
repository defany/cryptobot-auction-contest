import type { QueryExecutor } from '../../../types/prisma'
import { addUserGifts } from './add_user_gift'
import { fetchAll } from './fetch'
import { fetchUserGifts } from './fetch_user_gifts'
import { incrementLastIssuedNumber } from './update_last_issues_number'

export class GiftRepo {
	protected db: QueryExecutor

	fetchAll = fetchAll
	incrementLastIssuedNumber = incrementLastIssuedNumber
	addUserGifts = addUserGifts
	fetchUserGifts = fetchUserGifts

	constructor(db: QueryExecutor) {
		this.db = db
	}

	withTx(tx: QueryExecutor): GiftRepo {
		return new GiftRepo(tx)
	}
}
