import {MAX_FILENAME_LEN} from "#shared/src/fileValidation.js";
import {passwordSchema, usernameSchema, emailSchema} from "#shared/src/schemas.js";
import {z} from "zod";

export {passwordSchema, usernameSchema, emailSchema};

export const SignupSchema = z.object({
	username: usernameSchema,
	email: emailSchema,
	password: passwordSchema,
});

export const UserFileSchema = z.object({
	id: z.uuidv4(),
	name: z
		.string()
		.max(MAX_FILENAME_LEN, `Filename length cannot exceed ${MAX_FILENAME_LEN} characters`)
		.regex(/\S/, "Filename can't be empty"),
	content: z.string(),
	owner_id: z.number(),
});
