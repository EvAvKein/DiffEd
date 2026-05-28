import {ChangeSet, Text} from "@codemirror/state";
import type {WorkspaceMember} from "#shared/src/types";
import {CollabConnection, getInitialDocument, pullUpdates} from "./collabClient";
import {useShowToast} from "#/src/stores/toastStore";
import {delay} from "../utils";

export type PeerDoc = {
	doc: Text;
	version: number;
};

type PeerState = {
	member: WorkspaceMember;
	doc?: PeerDoc;
	aborted: boolean;
};

const INITIAL_MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 250;
const ERROR_RETRY_DELAY_MS = 1000;

export class CollabPeersPool {
	private connection: CollabConnection;
	private myOwnerId: number;
	private peers = new Map<number, PeerState>();
	private showToast: ReturnType<typeof useShowToast>;
	private onMembersChange: (members: WorkspaceMember[]) => void;
	private onPeerReady: (ownerId: number, doc: PeerDoc) => void;
	private peerUpdateListener: ((ownerId: number, doc: PeerDoc, changes: ChangeSet) => void) | null = null;
	private unsubscribeMembers: () => void;

	constructor(
		connection: CollabConnection,
		myOwnerId: number,
		initialMembers: WorkspaceMember[],
		showToast: ReturnType<typeof useShowToast>,
		onMembersChange: (members: WorkspaceMember[]) => void,
		onPeerReady: (ownerId: number, doc: PeerDoc) => void,
	) {
		this.connection = connection;
		this.myOwnerId = myOwnerId;
		this.showToast = showToast;
		this.onMembersChange = onMembersChange;
		this.onPeerReady = onPeerReady;
		this.updatePeersList(
			initialMembers.filter((m) => m.id !== myOwnerId),
			false,
		);
		this.unsubscribeMembers = connection.subscribeMembers((event) => {
			const members = event.members.filter((m) => m.id !== this.myOwnerId);
			this.updatePeersList(members, true);
			this.onMembersChange(members);
		});
	}

	onPeerUpdate(fn: (ownerId: number, doc: PeerDoc, changes: ChangeSet) => void): () => void {
		this.peerUpdateListener = fn;
		return () => {
			this.peerUpdateListener = null;
		};
	}

	private updatePeersList(peers: WorkspaceMember[], notify: boolean): void {
		const peerIds = new Set(peers.map((peer) => peer.id));
		for (const id of [...this.peers.keys()]) {
			if (!peerIds.has(id)) this.removePeer(id, notify);
		}
		for (const peer of peers) {
			if (!this.peers.has(peer.id)) this.addPeer(peer, notify);
		}
	}

	private addPeer(peer: WorkspaceMember, notify: boolean): void {
		if (this.peers.has(peer.id)) return;
		const state: PeerState = {member: peer, doc: undefined, aborted: false};
		this.peers.set(peer.id, state);
		if (notify) this.showToast("info", `${peer.username} has joined`);
		this.runPeer(peer.id, state);
	}

	private removePeer(id: number, notify: boolean): void {
		const state = this.peers.get(id);
		if (!state) return;
		state.aborted = true;
		if (notify) this.showToast("info", `${state.member.username} has left`);
		this.peers.delete(id);
	}

	getPeerDoc(ownerId: number): PeerDoc | null {
		return this.peers.get(ownerId)?.doc ?? null;
	}

	dispose(): void {
		this.unsubscribeMembers();
		for (const state of this.peers.values()) {
			state.aborted = true;
		}
		this.peers.clear();
		this.peerUpdateListener = null;
	}

	private async fetchInitialDoc(ownerId: number, state: PeerState): Promise<boolean> {
		let attempt = 0;
		// Will retry infinitely to account for collab users in file picker
		while (!state.aborted) {
			try {
				const {doc, version} = await getInitialDocument(this.connection, ownerId);
				state.doc = {doc, version};
				this.onPeerReady(ownerId, state.doc);
				return true;
			} catch {
				if (state.aborted) return false;
				attempt++;
				await delay(attempt < INITIAL_MAX_ATTEMPTS ? INITIAL_RETRY_DELAY_MS : ERROR_RETRY_DELAY_MS);
			}
		}
		return false;
	}

	private async runPeer(ownerId: number, state: PeerState): Promise<void> {
		if (!(await this.fetchInitialDoc(ownerId, state))) return;

		while (!state.aborted && state.doc) {
			try {
				const updates = await pullUpdates(this.connection, ownerId, state.doc.version);
				if (state.aborted || !state.doc) return;
				if (updates.length === 0) continue;

				let doc = state.doc.doc;
				let composed: ChangeSet | null = null;
				for (const update of updates) {
					composed = composed ? composed.compose(update.changes) : update.changes;
					doc = update.changes.apply(doc);
				}
				state.doc = {
					doc,
					version: state.doc.version + updates.length,
				};
				this.peerUpdateListener?.(ownerId, state.doc, composed!);
			} catch {
				if (state.aborted) return;
				await delay(ERROR_RETRY_DELAY_MS);
			}
		}
	}
}
