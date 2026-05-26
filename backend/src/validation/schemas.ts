import {type UserFile, type SigningUser} from "#shared/src/types.js";
import {MAX_FILENAME_LEN} from "#shared/src/fileValidation.js";
import {PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH} from "#shared/src/userValidation.js";
import {z, type ZodType} from "zod";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

export const passwordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
	.max(PASSWORD_MAX_LENGTH, `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters}`);

export const usernameSchema = z
	.string()
	.min(USERNAME_MIN_LENGTH, `Username has to be at least ${USERNAME_MIN_LENGTH} characters long`)
	.max(USERNAME_MAX_LENGTH, `Username can't be over ${USERNAME_MAX_LENGTH} characters long`)
	.regex(/^[a-zA-Z0-9_]+$/, "Username must contain only small/capital letter, numbers or underscore");

export const emailSchema = z.email();

export const SignupSchema = z.object({
	username: usernameSchema,
	email: z.email(),
	password: passwordSchema,
}) satisfies ZodType<SigningUser>;

export const UserFileSchema = z.object({
	id: z.uuidv4(),
	name: z
		.string()
		.max(MAX_FILENAME_LEN, `Filename length cannot exceed ${MAX_FILENAME_LEN} characters`)
		.regex(/\S/, "Filename can't be empty"),
	content: z.string(),
	owner_id: z.number(),
}) satisfies ZodType<UserFile>;
