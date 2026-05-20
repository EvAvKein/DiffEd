import type {Express, Request, Response} from "express";
import {isDbError} from "#/src/utils.js";
import type {ApiResponse} from "#shared/src/types.js";
import {timestampedLog} from "#/src/logging.js";
import {requireAuth, requireAuthOrApiKey} from "#/src/middleware.js";
import {type AuthRequest} from "#/src/middleware.js";
import userQueryService from "#/src/queries/users.js";

function getUserApiKey(app: Express) {
	app.get("/api/user/api-key", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<string>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const id = req.session.userId ?? req.userId!;
		try {
			const key = await userQueryService.getApiKeyById(id);
			if (!key) {
				return res.status(404).json({ok: false, error: "NO_API_KEY"});
			}

			res.status(200).json({ok: true, data: key});
		} catch (error: unknown) {
			if (isDbError(error)) {
				timestampedLog(`DB ERROR <<< ${error.code}: ${error.detail}`);
			} else {
				timestampedLog(`ERROR <<< ${error}`);
			}
			return res.status(500).json({ok: false, error: "Internal server error"});
		}
	});
}

function updateUserApiKey(app: Express) {
	app.patch("/api/user/api-key", requireAuth, async (req: Request, res: Response<ApiResponse<string | null>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const id = req.session.userId!;
		try {
			const hash = crypto.randomUUID();
			const key = await userQueryService.updateApiKey(hash, id);

			res.status(200).json({ok: true, data: key});
		} catch (error: unknown) {
			if (isDbError(error)) {
				timestampedLog(`DB ERROR <<< ${error.code}: ${error.detail}`);
			} else {
				timestampedLog(`ERROR <<< ${error}`);
			}
			return res.status(500).json({ok: false, error: "Internal server error"});
		}
	});
}

function deleteUserApiKey(app: Express) {
	app.delete("/api/user/api-key", requireAuth, async (req: Request, res: Response<ApiResponse<null>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const id = req.session.userId!;
		try {
			await userQueryService.updateApiKey(null, id);

			res.status(200).json({ok: true, data: null});
		} catch (error: unknown) {
			if (isDbError(error)) {
				timestampedLog(`DB ERROR <<< ${error.code}: ${error.detail}`);
			} else {
				timestampedLog(`ERROR <<< ${error}`);
			}
			return res.status(500).json({ok: false, error: "Internal server error"});
		}
	});
}

export default {getUserApiKey, updateUserApiKey, deleteUserApiKey};
