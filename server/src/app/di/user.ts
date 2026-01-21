import type { DI } from '.'
import { UserHandler } from '../../controller/handler/user'
import { AuthMiddleware } from '../../controller/middleware/auth'
import { UserRepo } from '../../repo/user'
import { UserService } from '../../service/user'


export async function authMiddleware(this: DI) {
	return new AuthMiddleware(await this.httpServer, await this.userService)
}

export async function userHandler(this: DI) {
	return new UserHandler(await this.httpServer, await this.userService)
}

export async function userService(this: DI) {
	return new UserService(await this.userRepo)
}

export async function userRepo(this: DI) {
	return new UserRepo(await this.database)
}