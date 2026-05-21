import {Request, Response, NextFunction} from "express";
import type {ApiResponse} from "#shared/src/types.js";
import userQueryService from "#/src/queries/users.js";

export function requireAuth(req: Request, res: Response<ApiResponse<null>>, next: NextFunction) {
	if (req.session.userId) {
		next();
	} else {
		res.status(401).json({ok: false, error: "Unauthorized"});
	}
}

export type AuthRequest = Request & {
	userId?: number;
};

export async function requireAuthOrApiKey(req: AuthRequest, res: Response<ApiResponse<null>>, next: NextFunction) {
	if (req.session.userId) {
		return next();
	}

	const apiKey = req.headers["x-api-key"] as string | undefined;
	if (apiKey) {
		const user = await userQueryService.getUserByApiKey(apiKey);
		if (user) {
			req.userId = user.id;
			return next();
		}
	}
	res.status(401).json({ok: false, error: "Unauthorized"});
}

export function userIdAfterAuth(req: AuthRequest): number {
	const id = req.session.userId ?? req.userId;
	if (id === undefined) throw new Error("BUG: userIdAfterAuth called after request unauthenticated by middleware");
	return id;
}
