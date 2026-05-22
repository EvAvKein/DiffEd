import type {Express, Response} from "express";
import z from "zod";
import {timestampedLog} from "#/src/logging.js";
import {requireAuthOrApiKey, userIdAfterAuth, type AuthRequest} from "#/src/middleware.js";
import {UserFileSchema} from "#/src/validation/schemas.js";
import {type CollabSocketApi} from "./collabSocket.js";
import type {ApiResponse, WorkspaceInfo} from "#shared/src/types.js";

function createWorkspace(app: Express, api: CollabSocketApi) {
	app.post(
		"/api/workspace",
		requireAuthOrApiKey,
		async (req: AuthRequest, res: Response<ApiResponse<{workspaceId: string}>>) => {
			const parsed = z.object({fileId: UserFileSchema.shape.id}).strict().safeParse(req.body);
			if (!parsed.success) {
				return res.status(400).json({ok: false, error: "Invalid file ID"});
			}

			try {
				const userId = userIdAfterAuth(req);
				const workspaceId = await api.createWorkspaceFromFile(userId, parsed.data.fileId);
				return res.status(201).json({ok: true, data: {workspaceId: workspaceId}});
			} catch (error) {
				timestampedLog(`Failed to create workspace: ${String(error)}`);
				return res.status(403).json({ok: false, error: "File not found or not owned by you"});
			}
		},
	);
}

function getWorkspace(app: Express, api: CollabSocketApi) {
	app.get(
		"/api/workspace/:workspaceId",
		requireAuthOrApiKey,
		async (req: AuthRequest, res: Response<ApiResponse<WorkspaceInfo>>) => {
			const parsed = z.uuidv4().safeParse(req.params.workspaceId);
			if (!parsed.success) {
				return res.status(400).json({ok: false, error: "Invalid workspace ID"});
			}

			const info = api.getWorkspaceInfo(parsed.data);
			if (!info) {
				return res.status(404).json({ok: false, error: "Workspace not found"});
			}
			return res.status(200).json({ok: true, data: info});
		},
	);
}

export default {createWorkspace, getWorkspace};
