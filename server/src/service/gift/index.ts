import type { GiftRepo } from '../../repo/gift'
import { fetch } from './fetch'


export class GiftService {
	// could be better abstracted with an interface of GiftRepo or abstract class for repository which GiftRepo implements 
	// but for this small project it's ok
	// applies to other services and repos as well
	protected giftRepo: GiftRepo 

	fetch = fetch

	constructor(giftRepo: GiftRepo) {
		this.giftRepo = giftRepo
	}
}