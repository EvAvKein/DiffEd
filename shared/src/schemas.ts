import { z } from "zod";
import {
	PASSWORD_MIN_LENGTH,
	PASSWORD_MAX_LENGTH,
	EMAIL_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_MAX_LENGTH,
} from "./userValidation.js";

export const passwordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
	.max(PASSWORD_MAX_LENGTH, `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`);

export const usernameSchema = z
	.string()
	.min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters long`)
	.max(USERNAME_MAX_LENGTH, `Username cannot exceed ${USERNAME_MAX_LENGTH} characters`)
	.regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, or underscores");

export const emailSchema = z.email("Email must be a valid email address").max(EMAIL_MAX_LENGTH, `Email cannot exceed ${EMAIL_MAX_LENGTH} characters`);
