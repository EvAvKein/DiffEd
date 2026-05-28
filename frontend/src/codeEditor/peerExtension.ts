import type {ChangeSet, Text} from "@codemirror/state";
import type {Update} from "@codemirror/collab";
import {EditorView, ViewUpdate, ViewPlugin, type PluginValue} from "@codemirror/view";
import {collab, getSyncedVersion, sendableUpdates, receiveUpdates} from "@codemirror/collab";
import {CollabConnection, CollabRejectedError, pushUpdates, pullUpdates} from "./collabClient";
import {MAX_FILE_SIZE} from "#shared/src/fileValidation";
import type {ShowToast} from "../stores/toastStore";
import {delay} from "../utils";

const utf8 = new TextEncoder();

const PUSH_MS_INTERVAL = 100;
const PULL_MS_INTERVAL = 1000;

// Runs `updates` backward against `currentDoc` and returns the ChangeSet that, when applied to `currentDoc`, undoes them all
export function invertUpdates(currentDoc: Text, updates: readonly Update[]): ChangeSet | null {
	let working = currentDoc;
	let inverted: ChangeSet | null = null;
	for (let i = updates.length - 1; i >= 0; i--) {
		const inv = updates[i].changes.invert(working);
		working = inv.apply(working);
		inverted = inverted ? inverted.compose(inv) : inv;
	}
	return inverted;
}

// True when changes leave the doc above MAX_FILE_SIZE *and* grow it, false when shrinking so users can repair oversized files
export function growsPastLimit(newDoc: Text, oldDoc: Text): boolean {
	const newBytes = utf8.encode(newDoc.toString()).length;
	if (newBytes <= MAX_FILE_SIZE) return false;
	const oldBytes = utf8.encode(oldDoc.toString()).length;
	return newBytes > oldBytes;
}

export function peerExtension(
	startVersion: number,
	connection: CollabConnection,
	ownerId: number,
	showToast: ShowToast,
) {
	class LocalPeerPlugin implements PluginValue {
		pushing = false;
		done = false;
		// Pauses the retry loop after a structured rejection until the next local change displaces the rejected sendable updates
		rejected = false;
		view: EditorView;

		constructor(v: EditorView) {
			this.view = v;
			void this.pull();
		}

		update(update: ViewUpdate): void {
			if (update.docChanged) {
				this.rejected = false;
				void this.push();
			}
		}

		async push(): Promise<void> {
			if (this.done) return;
			const updates = sendableUpdates(this.view.state);
			if (this.pushing || !updates.length) return;

			this.pushing = true;
			const version = getSyncedVersion(this.view.state);
			try {
				await pushUpdates(connection, version, updates);
			} catch (err) {
				if (this.done) return;
				if (err instanceof CollabRejectedError) {
					this.rejected = true;
					if (err.status === 413) {
						showToast("error", `${err.message}, reverting changes...`);
						const inverted = invertUpdates(this.view.state.doc, sendableUpdates(this.view.state));
						if (inverted) this.view.dispatch({changes: inverted});
					}
				} else {
					console.log("Failed to push updates. Try another!");
				}
			}
			this.pushing = false;

			if (!this.rejected && sendableUpdates(this.view.state).length) {
				setTimeout(() => void this.push(), PUSH_MS_INTERVAL);
			}
		}

		async pull(): Promise<void> {
			while (!this.done) {
				const version = getSyncedVersion(this.view.state);
				try {
					const updates = await pullUpdates(connection, ownerId, version);
					if (this.done) return;
					this.view.dispatch(receiveUpdates(this.view.state, updates));
				} catch {
					if (this.done) return;
					await delay(PULL_MS_INTERVAL);
				}
			}
		}

		destroy(): void {
			this.done = true;
		}
	}

	return [collab({startVersion}), ViewPlugin.fromClass(LocalPeerPlugin)];
}
