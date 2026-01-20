import type { DI } from '.'
import { BidRepo } from '../../repo/bid'


export async function bidRepo(this: DI): Promise<BidRepo> {
	return new BidRepo(await this.database)
}