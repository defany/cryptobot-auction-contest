import type { QueryExecutor } from '../../../types/prisma'
import { addUserGifts } from './add_user_gift'
import { fetchAll } from './fetch'
import { incrementLastIssuedNumber } from './update_last_issues_number'

export class GiftRepo {
	protected db: QueryExecutor

	fetchAll = fetchAll
	incrementLastIssuedNumber = incrementLastIssuedNumber
	addUserGifts = addUserGifts

	constructor(db: QueryExecutor) {
		this.db = db
	}

	withTx(tx: QueryExecutor): GiftRepo {
		return new GiftRepo(tx)
	}
}
