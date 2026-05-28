import {ChangeSet, Text} from "@codemirror/state";
import type {Update} from "@codemirror/collab";
import {io, type Socket} from "socket.io-client";
import type {
	CollabRequest,
	CollabRequestPayload,
	CollabResponse,
	DocumentResponse,
	EditorInvalidatedEvent,
	ErrorResponse,
	MembersChangedEvent,
	NameUpdateResponse,
	SerializedUpdate,
} from "#shared/src/types";

const CONNECT_TIMEOUT_MS = 5000;
const REQUEST_TIMEOUT_MS = 8000;
const COLLAB_URL = window.location.origin;

type PendingRequest = {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
	timeoutId: ReturnType<typeof setTimeout>;
};

export type MembersHandler = (event: MembersChangedEvent) => void;
export type EditorInvalidatedHandler = (event: EditorInvalidatedEvent) => void;

/** Wrapper for socket.io connection to communicate with our collab server */
export class CollabConnection {
	private socket: Socket | null = null;
	private workspaceId: string;
	private requestId = 0;
	private pendingRequests = new Map<number, PendingRequest>();
	private membersHandlers = new Set<MembersHandler>();
	private setConnected: (connected: boolean) => void;
	private editorInvalidatedHandlers = new Set<EditorInvalidatedHandler>();

	constructor(workspaceId: string, setConnected: (connected: boolean) => void) {
		this.workspaceId = workspaceId;
		this.setConnected = setConnected;
	}

	private getOrCreateSocket(): Socket {
		if (this.socket) {
			return this.socket;
		}

		this.socket = io(COLLAB_URL, {
			path: "/socket.io",
			autoConnect: false,
			forceNew: true,
			transports: ["websocket", "polling"],
		});

		this.socket.on("collabResponse", (data: CollabResponse) => {
			if ("error" in data) {
				this.rejectAllPending(new Error(`Collab server error: ${data.error}`));
				return;
			}

			const pending = this.pendingRequests.get(data.requestId);
			if (pending) {
				this.pendingRequests.delete(data.requestId);
				clearTimeout(pending.timeoutId);
				const {result} = data;
				if (typeof result === "object" && result !== null && "error" in result) {
					pending.reject(new Error((result as ErrorResponse).error));
				} else {
					pending.resolve(result);
				}
			}
		});

		this.socket.on("membersChanged", (event: MembersChangedEvent) => {
			if (event.workspaceId !== this.workspaceId) return;
			for (const handler of this.membersHandlers) {
				handler(event);
			}
		});

		this.socket.on("connect", () => {
			this.setConnected(true);
		});

		this.socket.on("editorInvalidated", (event: EditorInvalidatedEvent) => {
			for (const handler of this.editorInvalidatedHandlers) {
				handler(event);
			}
		});

		this.socket.on("connect_error", (error) => {
			this.rejectAllPending(error);
		});

		this.socket.on("disconnect", (reason) => {
			this.rejectAllPending(new Error(`Collab socket disconnected: ${reason}`));
			this.setConnected(false);
		});

		return this.socket;
	}

	private rejectAllPending(reason: unknown): void {
		for (const [, pending] of this.pendingRequests) {
			clearTimeout(pending.timeoutId);
			pending.reject(reason);
		}
		this.pendingRequests.clear();
	}

	private async ensureConnected(): Promise<void> {
		const socket = this.getOrCreateSocket();
		if (socket.connected) {
			return;
		}

		await new Promise<void>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				cleanup();
				reject(new Error("Timed out connecting to collaboration server"));
			}, CONNECT_TIMEOUT_MS);

			function onConnect() {
				cleanup();
				resolve();
			}

			function onError(error: Error) {
				cleanup();
				reject(error);
			}

			// Declared in arrow syntax to maintain class' `this` context
			const cleanup = () => {
				clearTimeout(timeoutId);
				socket.off("connect", onConnect);
				socket.off("connect_error", onError);
			};

			socket.on("connect", onConnect);
			socket.on("connect_error", onError);
			socket.connect();
		});
	}

	async request(payload: CollabRequestPayload): Promise<unknown> {
		await this.ensureConnected();
		const socket = this.getOrCreateSocket();

		const id = this.requestId++;
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				this.pendingRequests.delete(id);
				reject(new Error(`Timed out waiting for collab response: ${payload.type}`));
			}, REQUEST_TIMEOUT_MS);

			this.pendingRequests.set(id, {resolve, reject, timeoutId});
			const request: CollabRequest = {requestId: id, workspaceId: this.workspaceId, ...payload};
			socket.emit("collabRequest", request);
		});
	}

	subscribeMembers(handler: MembersHandler): () => void {
		this.getOrCreateSocket();
		this.membersHandlers.add(handler);
		return () => {
			this.membersHandlers.delete(handler);
		};
	}

	// Fire-and-forget message to the server that we're leaving.
	// Must run synchronously before disconnect() - request/response can't survive teardown.
	sendLeaveWorkspace(): void {
		if (!this.socket?.connected) return;
		this.socket.emit("collabRequest", {
			requestId: this.requestId++,
			workspaceId: this.workspaceId,
			type: "leaveWorkspace",
		});
	}

	subscribeEditorInvalidated(handler: EditorInvalidatedHandler): () => void {
		this.getOrCreateSocket();
		this.editorInvalidatedHandlers.add(handler);
		return () => {
			this.editorInvalidatedHandlers.delete(handler);
		};
	}

	disconnect(): void {
		this.rejectAllPending(new Error("Collab connection closed"));
		this.membersHandlers.clear();
		this.editorInvalidatedHandlers.clear();
		this.socket?.disconnect();
		this.socket = null;
	}
}

export async function getInitialDocument(
	connection: CollabConnection,
	ownerId: number,
): Promise<{version: number; doc: Text; fileName: string}> {
	const result = (await connection.request({type: "getInitialDocument", ownerId})) as DocumentResponse;
	return {version: result.version, doc: Text.of(result.doc.split("\n")), fileName: result.fileName};
}

export async function pullUpdates(
	connection: CollabConnection,
	ownerId: number,
	version: number,
): Promise<readonly Update[]> {
	const result = (await connection.request({type: "pullUpdates", ownerId, version})) as SerializedUpdate[];
	return result.map((record) => ({
		changes: ChangeSet.fromJSON(record.changes),
		clientID: record.clientID,
	}));
}

export async function pushUpdates(
	connection: CollabConnection,
	version: number,
	fullUpdates: readonly Update[],
): Promise<boolean> {
	const updates = fullUpdates.map((u) => ({
		clientID: u.clientID,
		changes: u.changes.toJSON() as string,
	}));
	const result = await connection.request({type: "pushUpdates", version, updates});
	return result === true;
}

export async function pushFileName(connection: CollabConnection, name: string): Promise<NameUpdateResponse> {
	return (await connection.request({type: "pushFileName", name})) as NameUpdateResponse;
}

export async function pullFileName(connection: CollabConnection): Promise<string> {
	const result = (await connection.request({type: "pullFileName"})) as NameUpdateResponse;
	return result.name;
}

export async function pickFile(connection: CollabConnection, fileId: string): Promise<void> {
	await connection.request({type: "pickFile", fileId});
}

export function leaveWorkspace(connection: CollabConnection): void {
	connection.sendLeaveWorkspace();
}
