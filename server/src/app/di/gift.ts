import type { DI } from '.'
import { GiftHandler } from '../../controller/handler/gift'
import { GiftRepo } from '../../repo/gift'
import { GiftService } from '../../service/gift'

export async function giftHandler(this: DI) {
	return new GiftHandler(await this.httpServer, await this.giftService)
}

export async function giftService(this: DI) {
	return new GiftService(await this.giftRepo)
}

export async function giftRepo(this: DI) {
	return new GiftRepo(await this.database)
}
