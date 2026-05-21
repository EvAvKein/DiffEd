import multer from "multer";
import path from "path";
import fs from "fs";
import type {Express, Request, Response, NextFunction} from "express";
import {isDbError} from "#/src/utils.js";
import type {ApiResponse} from "#shared/src/types.js";
import {timestampedLog} from "#/src/logging.js";
import {requireAuthOrApiKey, userIdAfterAuth, type AuthRequest} from "#/src/middleware.js";
import userQueryService from "#/src/queries/users.js";

const MAX_IMGSIZE = 1024 * 1024; // 1 MiB
const AVATAR_DIR = path.resolve(process.cwd(), "src/private/avatars");
const DEFAULT_AVATAR = "default.jpg";

//all the users share the same storage, since there's only 1 image per user
const storage = multer.diskStorage({
	destination: `${AVATAR_DIR}`, // as this is string multer will make sure the directory exists

	filename: function (req: AuthRequest, file: Express.Multer.File, cb) {
		const uniqueName = userIdAfterAuth(req) + "-" + Date.now() + "-" + file.originalname;
		cb(null, uniqueName);
	},
});

const upload = multer({
	storage,
	limits: {
		fileSize: MAX_IMGSIZE,
		files: 1, // allow only one file to be sent
	},
	fileFilter: function (_req: Request, file: Express.Multer.File, cb) {
		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid filetype"));
		}
	},
});

function deleteAvatar(filename: string): void {
	try {
		const filepath = path.join(AVATAR_DIR, filename);
		if (fs.existsSync(filepath)) {
			fs.unlinkSync(filepath);
		}
	} catch (error: unknown) {
		timestampedLog(`ERROR <<< ${error}`);
	}
}

function multerUpload(req: Request, res: Response<ApiResponse<null>>, next: NextFunction) {
	upload.single("avatar")(req, res, (err) => {
		if (!err) return next();

		if (err instanceof multer.MulterError) {
			if (err.code === "LIMIT_FILE_SIZE") {
				return res.status(413).json({ok: false, error: "File too large"});
			}
			if (err.code === "LIMIT_UNEXPECTED_FILE") {
				return res.status(400).json({ok: false, error: "Too many files or wrong field name"});
			}
			return res.status(400).json({ok: false, error: err.message});
		}

		if (err instanceof Error) {
			return res.status(400).json({ok: false, error: err.message});
		}

		next();
	});
}

function updateUserAvatar(app: Express) {
	app.patch(
		"/api/user/avatar",
		requireAuthOrApiKey,
		multerUpload,
		async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
			timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

			const userId = userIdAfterAuth(req);
			const filename = req.file!.filename; // Same as with userId there is no case where we wouldn't have file in this row.
			try {
				const old_filename = await userQueryService.getAvatarFilenameById(userId);
				if ((await userQueryService.updateAvatar(filename, userId)) === false) {
					throw new Error(`Could not update user avatar with id: ${userId}`);
				}

				if (old_filename && old_filename !== DEFAULT_AVATAR) {
					deleteAvatar(old_filename);
				}
				res.status(200).json({ok: true, data: null});
			} catch (error: unknown) {
				deleteAvatar(filename);
				if (isDbError(error)) {
					timestampedLog(`DB ERROR <<< ${error.code}: ${error.detail}`);
				} else {
					timestampedLog(`ERROR <<< ${error}`);
				}
				return res.status(500).json({ok: false, error: "Internal server error"});
			}
		},
	);
}

function deleteUserAvatar(app: Express) {
	app.delete("/api/user/avatar", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const userId = userIdAfterAuth(req);
		try {
			const old_filename = await userQueryService.getAvatarFilenameById(userId);
			if (!old_filename || old_filename === DEFAULT_AVATAR) {
				return res.status(404).json({ok: false, error: "No file uploaded"});
			}

			if ((await userQueryService.updateAvatar(null, userId)) === false) {
				throw new Error(`Could not update user avatar with id: ${userId}`);
			}

			deleteAvatar(old_filename);

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

function getUserAvatar(app: Express) {
	app.get("/api/user/avatar", requireAuthOrApiKey, async (req: AuthRequest, res: Response) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const userId = userIdAfterAuth(req);
		try {
			const filename = await userQueryService.getAvatarFilenameById(userId);
			let filepath: string;
			if (!filename || filename === DEFAULT_AVATAR) {
				filepath = path.join(AVATAR_DIR, DEFAULT_AVATAR);
			} else {
				filepath = path.join(AVATAR_DIR, filename);
			}
			if (!fs.existsSync(filepath)) {
				throw new Error("Invalid filepath");
			}
			res.status(200).sendFile(filepath);
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

export default {updateUserAvatar, deleteUserAvatar, getUserAvatar};
