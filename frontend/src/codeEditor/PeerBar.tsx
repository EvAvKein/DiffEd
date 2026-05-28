import type {JSX} from "react";
import type {WorkspaceMember} from "#shared/src/types";
import {IconLink} from "@tabler/icons-react";
import type {ToastVariant} from "#/src/stores/toastStore";
import Button from "../components/Button";

type PeerBarProps = {
	peers: WorkspaceMember[];
	readyPeerIds: ReadonlySet<number>;
	selectedPeerId: number | null;
	onSelect: (ownerId: number | null) => void;
	showToast: (type: ToastVariant, message: string) => void;
};

function copyUrlToClipboard(showToast: (type: ToastVariant, message: string) => void): void {
	navigator.clipboard
		.writeText(window.location.href)
		.then(() => showToast("success", "URL copied to clipboard!"))
		.catch(() => showToast("error", "Failed to copy URL. Please try copying manually."));
}

export default function PeerBar({peers, readyPeerIds, selectedPeerId, onSelect, showToast}: PeerBarProps): JSX.Element {
	return (
		<div className="flex flex-row items-center gap-2 p-2 bg-surface-dark">
			<Button aria-label="Copy invite URL" onClick={() => copyUrlToClipboard(showToast)}>
				<IconLink className="text-foreground-light" />
			</Button>
			{peers.length === 0 ? (
				<span>Solo mode - share this URL to collaborate!</span>
			) : (
				<div role="tablist" aria-label="Peers" className="flex flex-row items-center gap-2">
					<button
						type="button"
						role="tab"
						aria-selected={selectedPeerId === null}
						onClick={() => onSelect(null)}
						className={`text-foreground-light px-2 py-1 border ${selectedPeerId === null ? "border-accent" : "border-transparent"} cursor-pointer`}
					>
						Solo
					</button>
					{peers.map((peer) => {
						const ready = readyPeerIds.has(peer.id);
						const selected = peer.id === selectedPeerId;
						const borderClass = selected ? "border-accent" : "border-transparent";
						const stateClass = ready ? "cursor-pointer" : "opacity-50 cursor-wait";
						return (
							<button
								key={peer.id}
								type="button"
								role="tab"
								aria-selected={selected}
								disabled={!ready}
								onClick={() => onSelect(peer.id)}
								className={`flex items-center gap-2 text-foreground-light px-2 py-1 border max-w-32 ${borderClass} ${stateClass}`}
							>
								<img src={`/api/user/${peer.id}/avatar`} alt={`${peer.username}'s profile picture`} className="w-5 h-5 rounded-full object-cover" />
								<span className="truncate">{peer.username}</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
