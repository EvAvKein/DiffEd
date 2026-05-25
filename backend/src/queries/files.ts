import {timestampedLog} from "../logging.js";
import {postgres as db} from "../postgres.js";
import {UserFile, FileListItem} from "../types.js";

async function getFileInfoById(userId: number): Promise<FileListItem[]> {
	const query = "SELECT id, name FROM files WHERE owner_id = $1";
	timestampedLog(`DB QUERY >>> ${query}`);
	timestampedLog(`DB VALUES >>> ${userId}`);

	const result = await db.query(query, [userId]);

	return result.rows;
}

async function getFileById(userId: number, fileId: string): Promise<UserFile | null> {
	const query = "SELECT id, name, content FROM files WHERE id = $1 AND owner_id = $2";
	const values = [fileId, userId];
	timestampedLog(`DB QUERY >>> ${query}`);
	timestampedLog(`DB VALUES >>> ${values}`);

	const result = await db.query(query, values);

	if (!result.rowCount) return null;

	return result.rows[0];
}

async function uploadFile(userId: number, uuid: string, fileName: string, fileContent: string): Promise<string | null> {
	const query = "INSERT INTO files (id, name, content, owner_id) VALUES ($1, $2, $3, $4) RETURNING id";
	const values = [uuid, fileName, fileContent, userId];

	timestampedLog(`DB QUERY >>> ${query}`);
	timestampedLog(`DB VALUES >>> ${JSON.stringify(values)}`);

	const result = await db.query(query, values);
	if (result.rowCount !== 1 || !result.rows[0].id) return null;

	return result.rows[0].id;
}

async function deleteFileById(userId: number, fileId: string): Promise<boolean> {
	const query = "DELETE FROM files WHERE id = $1 AND owner_id = $2";
	const values = [fileId, userId];
	timestampedLog(`DB QUERY >>> ${query}`);
	timestampedLog(`DB VALUES >>> ${values}`);

	const result = await db.query(query, values);

	if (!result.rowCount) return false;

	return true;
}

export default {getFileInfoById, getFileById, uploadFile, deleteFileById};
