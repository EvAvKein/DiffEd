const MAX_FILE_SIZE = 1000000; // 1meg
const TYPE_BLACK_LIST = ["image/", "video/", "audio/", "font/"];
const NAME_CHAR_BLACKLIST = ["\0"];
export const MAX_FILENAME_LEN = 100;

export function validateFileNameLen(fileName: string): string | null {
	if (fileName.trim().length === 0) {
		return "Filename can't be empty";
	}
	if (fileName.length > MAX_FILENAME_LEN) {
		return `Filename can't exceed ${MAX_FILENAME_LEN} characters`;
	}
	return null;
}

// return null on success otherwise returns reason for failure
export function validateFile(fileType: string, size?: number, buffer?: string, fileName?: string): string | null {
	if (fileName !== undefined) {
		if (NAME_CHAR_BLACKLIST.some((c) => fileName.includes(c))) {
			return "Filename contains unallowed characters";
		}
		const fileNameError = validateFileNameLen(fileName);
		if (fileNameError) return fileNameError;
	}

	if (size !== undefined && size > MAX_FILE_SIZE) {
		return `File too large at ${size} (max. ${MAX_FILE_SIZE})`;
	}

	if (fileType && TYPE_BLACK_LIST.some((prefix) => fileType.startsWith(prefix))) {
		return `Filetype '${fileType}' not allowed`;
	}

	if (buffer !== undefined) {
		const len = Math.min(100, buffer.length);
		for (let i = 0; i < len; i++) {
			const charCode = buffer.charCodeAt(i);
			if (charCode === 65533 || charCode <= 8) {
				return "Binary not allowed";
			}
		}
	}
	return null;
}
