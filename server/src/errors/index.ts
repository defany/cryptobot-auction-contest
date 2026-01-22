export class BaseError extends Error {
	statusCode: number

	constructor(statusCode: number, message: string) {
		super(message)

		Object.setPrototypeOf(this, new.target.prototype)
		this.name = Error.name
		this.statusCode = statusCode
		Error.captureStackTrace(this)
	}
}

export class ErrAuctionNotFound extends BaseError {
	constructor(message = 'Auction not found') {
		super(404, message)
		this.name = ErrAuctionNotFound.name
	}
}

export class ErrUserNotFound extends BaseError {
	constructor(message = 'User not found') {
		super(404, message)
		this.name = ErrUserNotFound.name
	}
}

export class ErrInactiveAuction extends BaseError {
	constructor(message = 'Auction is not active') {
		super(409, message)
	}
}

export class ErrTooSmallBid extends BaseError {
	constructor(message = 'Bid is too small') {
		super(409, message)
	}
}

export class ErrInsufficientFunds extends BaseError {
	constructor(message = 'Insufficient funds') {
		super(409, message)
	}
}

export class ErrAnotherActiveAuction extends BaseError {
	constructor(message = 'Another auction is in action, please wait') {
		super(409, message)
	}
}