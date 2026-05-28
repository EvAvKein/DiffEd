import type {Express, Response} from "express";
import {timestampedLog} from "#/src/logging.js";
import {UserFileSchema} from "#/src/validation/schemas.js";
import {requireAuthOrApiKey, userIdAfterAuth, type AuthRequest} from "#/src/middleware.js";
import type {UserFile, ApiResponse, FileListItem} from "#shared/src/types.js";
import {isDbError, isInvalidByteSequence, isUniqueViolation} from "#/src/utils.js";
import {validateFile} from "#shared/src/fileValidation.js";
import multer from "multer";
import fileQueryService from "#/src/queries/files.js";
import type {CollabSocketApi} from "./collabSocket.js";

function getFiles(app: Express) {
	app.get("/api/files", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<FileListItem[]>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const userId = userIdAfterAuth(req);

		try {
			const result = await fileQueryService.getFileInfoById(userId);

			return res.status(200).json({ok: true, data: result});
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

function getFileById(app: Express) {
	app.get("/api/files/:fileId", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<UserFile>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const fileId = UserFileSchema.shape.id.safeParse(req.params.fileId);
		if (fileId.error) {
			return res.status(400).json({ok: false, error: "Invalid file id"});
		}
		const userId = userIdAfterAuth(req);

		try {
			const result = await fileQueryService.getFileById(userId, fileId.data);
			if (!result) {
				return res.status(403).json({ok: false, error: "Forbidden"});
			}

			return res.status(200).json({ok: true, data: result});
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

const upload = multer({
	storage: multer.memoryStorage(),
});

function uploadFile(app: Express) {
	app.post(
		"/api/files",
		requireAuthOrApiKey,
		upload.single("file"),
		async (req: AuthRequest, res: Response<ApiResponse<string>>) => {
			timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

			if (!req.file) {
				return res.status(400).json({ok: false, error: "No files provided"});
			}

			const f = req.file;
			const fileName = f.originalname;
			const fileContent = f.buffer.toString("utf8");

			const err: string | null = validateFile(f.mimetype, f.size, fileContent, fileName);
			if (err) {
				return res.status(415).json({ok: false, error: err});
			}

			try {
				const userId = userIdAfterAuth(req);
				const uuid = crypto.randomUUID();

				const fileId = await fileQueryService.uploadFile(userId, uuid, fileName, fileContent);
				if (!fileId) throw null;

				return res.status(201).json({ok: true, data: fileId});
			} catch (error: unknown) {
				if (isDbError(error)) {
					timestampedLog(`DB ERROR <<< ${error.code}: ${error.detail}`);

					// this binary file handling happens if the checks before db fail
					// @NOTE the messaging is different from normal checks
					if (isInvalidByteSequence(error)) {
						return res.status(415).json({ok: false, error: `File '${fileName}' has binary encoding`});
					}
					if (isUniqueViolation(error)) {
						return res.status(409).json({ok: false, error: `A file with name '${fileName}' already exists`});
					}
				} else {
					timestampedLog(`ERROR <<< ${error}`);
				}

				return res.status(500).json({ok: false, error: "Internal server error"});
			}
		},
	);
}

function deleteFile(app: Express, collabApi: CollabSocketApi) {
	app.delete("/api/files/:fileId", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const fileId = UserFileSchema.shape.id.safeParse(req.params.fileId);
		if (fileId.error) {
			return res.status(400).json({ok: false, error: "Invalid file id"});
		}

		const userId = userIdAfterAuth(req);

		try {
			const result = await fileQueryService.deleteFileById(userId, fileId.data);
			if (!result) {
				return res.status(403).json({ok: false, error: "Forbidden"});
			}

			await collabApi.evictDeletedFile(userId, fileId.data);

			return res.status(200).json({ok: true, data: null});
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

export default {getFiles, getFileById, uploadFile, deleteFile};
