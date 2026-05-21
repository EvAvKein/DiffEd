import type {Express, Request, Response} from "express";
import path from "path";
import fs from "fs";
import argon2 from "argon2";
import {SignupSchema, usernameSchema, emailSchema, passwordSchema} from "#/src/validation/schemas.js";
import {isDbError, isUniqueViolation} from "#/src/utils.js";
import type {ApiResponse, User} from "#shared/src/types.js";
import {timestampedLog} from "#/src/logging.js";
import {requireAuthOrApiKey, userIdAfterAuth, type AuthRequest} from "#/src/middleware.js";
import userQueryService from "#/src/queries/users.js";

function signupUser(app: Express) {
	app.post("/api/user", async (req: Request, res: Response<ApiResponse<null>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const {username, email, password} = req.body;
		try {
			const parsedSchema = SignupSchema.safeParse(req.body);
			if (!parsedSchema.success) {
				return res.status(400).json({ok: false, error: parsedSchema.error.issues[0].message});
			}

			const hash = await argon2.hash(password, {
				type: argon2.argon2id,
			});

			const id = await userQueryService.createUser(username, email, hash);
			if (!id) throw new Error("User creation failed");
			res.status(201).json({ok: true, data: null});
		} catch (error: unknown) {
			if (isDbError(error) && isUniqueViolation(error)) {
				res.status(409).json({ok: false, error: "Username or email already in use"});
			}
			if (isDbError(error)) {
				timestampedLog(`DB ERROR <<< ${error.code}: ${error.detail}`);
			} else {
				timestampedLog(`ERROR <<< ${error}`);
			}
			return res.status(500).json({ok: false, error: "Internal server error"});
		}
	});
}

function modifyUser(app: Express) {
	app.patch("/api/user", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);
		const {username, email, password, newPassword, newPassword2, vim_bindings} = req.body;
		const userId = userIdAfterAuth(req);

		if (!username && !email && !newPassword && vim_bindings === undefined) {
			return res.status(400).json({ok: false, error: "Nothing to update"});
		}

		try {
			const user = await userQueryService.getUserWithPasswordById(userId);
			if (!user) {
				throw new Error(`User with id: ${userId} not found in database`);
			}

			// GitHub-only accounts have no password to confirm with, so for them an authenticated request is enough.
			const requiresPassword = Boolean(username || email || newPassword);
			if (requiresPassword && user.hashed_password) {
				if (typeof password !== "string" || !password) {
					return res.status(400).json({ok: false, error: "Current password required"});
				}
				if (!(await argon2.verify(user.hashed_password, password))) {
					return res.status(400).json({ok: false, error: "Incorrect password"});
				}
			}

			if (username) {
				const parsedUsername = usernameSchema.safeParse(username);
				if (!parsedUsername.success) {
					return res.status(400).json({ok: false, error: parsedUsername.error.issues[0].message});
				}

				if (user!.username === parsedUsername.data) {
					return res.status(400).json({ok: false, error: "New username same as current username"});
				}

				const usernameExists = await userQueryService.getUserByUsername(username);
				if (usernameExists) {
					return res.status(409).json({ok: false, error: "Username already taken"});
				}

				if ((await userQueryService.updateUsername(username, userId)) === false)
					throw new Error(`Could not update username for id: ${userId}`);
			}

			if (email) {
				const parsedEmail = emailSchema.safeParse(email);
				if (!parsedEmail.success) {
					return res.status(400).json({ok: false, error: parsedEmail.error.issues[0].message});
				}

				if (user!.email === email) {
					return res.status(400).json({ok: false, error: "New email same as old email"});
				}

				const emailExists = await userQueryService.getUserByEmail(email);
				if (emailExists) {
					return res.status(409).json({ok: false, error: "Email already taken"});
				}

				if ((await userQueryService.updateEmail(email, userId)) === false)
					throw new Error(`Could not update email for id: ${userId}`);
			}

			if (newPassword) {
				const parsedPassword = passwordSchema.safeParse(newPassword);
				if (!parsedPassword.success) {
					return res.status(400).json({ok: false, error: parsedPassword.error.issues[0].message});
				}

				if (newPassword !== newPassword2)
					return res.status(400).json({ok: false, error: "The passwords do not match!"});

				if (user.hashed_password && (await argon2.verify(user.hashed_password, newPassword))) {
					return res.status(400).json({ok: false, error: "New Password can not be the same as old password!"});
				}

				const hash = await argon2.hash(newPassword, {
					type: argon2.argon2id,
				});

				if ((await userQueryService.updatePassword(hash, userId)) === false)
					throw new Error(`Could not update password for id :${userId}`);
			}

			if (vim_bindings !== undefined) {
				if (typeof vim_bindings !== "boolean") {
					return res.status(400).json({ok: false, error: "Vim bindings must be a boolean"});
				}

				if ((await userQueryService.updateVimBindings(vim_bindings, userId)) === false)
					throw new Error(`Could not update vim_bindings for id: ${userId}`);
			}

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

function deleteUser(app: Express) {
	app.delete("/api/user", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);
		const {password} = req.body;
		const userId = userIdAfterAuth(req);

		try {
			const user = await userQueryService.getUserWithPasswordById(userId);
			if (!user) {
				throw new Error(`User with id: ${userId} not found in database`);
			}

			// GitHub-only accounts don't have a password, so an authenticated request is enough.
			if (user.hashed_password) {
				if (typeof password !== "string" || !password) {
					return res.status(400).json({ok: false, error: "Current password required"});
				}
				if (!(await argon2.verify(user.hashed_password, password))) {
					return res.status(400).json({ok: false, error: "Incorrect password"});
				}
			}

			const filename = await userQueryService.getAvatarFilenameById(userId);
			if (filename && filename !== "default.jpg") {
				const filepath = path.resolve(process.cwd(), "src/private/avatars", filename);
				if (fs.existsSync(filepath)) {
					fs.unlinkSync(filepath);
				}
			}
			if ((await userQueryService.deleteUserById(userId)) === false) {
				throw new Error(`Could not delete user with id: ${userId}`);
			}

			req.session.destroy((sessionError) => {
				if (sessionError) {
					timestampedLog(`ERROR <<< failed to destroy session after account deletion: ${sessionError}`);
				}
				res.clearCookie("connect.sid");
				res.status(200).json({ok: true, data: null});
			});
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

function getUser(app: Express) {
	app.get("/api/user", requireAuthOrApiKey, async (req: AuthRequest, res: Response<ApiResponse<User>>) => {
		timestampedLog(`REQUEST >>> ${req.method} ${req.url}`);

		const userId = userIdAfterAuth(req);
		try {
			const user = await userQueryService.getUserById(userId);
			if (!user) {
				throw new Error("No query result");
			}

			res.status(200).json({ok: true, data: user});
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

export default {signupUser, deleteUser, getUser, modifyUser};
