import type { AuctionRepo } from '.'
import type { AuctionAntiSniping } from '../../../generated/prisma/client'


export async function fetchAntisnipingSettings(
	this: AuctionRepo,
	auctionId: string,
): Promise<AuctionAntiSniping | null> {
	const settings = await this.db.auctionAntiSniping.findUnique({
		where: {
			auctionId: auctionId,
		},
	})

	return settings
}