export const PASSWORD_MIN_LENGTH = 14;
export const PASSWORD_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 120;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

export function validatePassword(password: string): string | null {
	if (password.length < PASSWORD_MIN_LENGTH) {
		return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
	}
	if (password.length > PASSWORD_MAX_LENGTH) {
		return `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`;
	}
	return null;
}
