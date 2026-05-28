import {useParams} from "react-router";
import type {WorkspaceInfo} from "#shared/src/types";
import {useEffect, useMemo, useRef, useState} from "react";
import {CollabConnection, leaveWorkspace} from "./collabClient";
import {apiFetch} from "../utils";
import FilePicker from "./FilePicker";
import Editor from "./Editor";
import {useCurrentUser} from "../stores/userStore";
import {useShowToast} from "../stores/toastStore";

export default function EditorPage() {
	const params = useParams();
	const workspaceId = params.workspaceId;
	const user = useCurrentUser()!;
	const showToast = useShowToast();

	const [sessionInfo, setSessionInfo] = useState<WorkspaceInfo | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [joining, setJoining] = useState(true);
	const [showFilePicker, setShowFilePicker] = useState(false);
	const [offline, setOffline] = useState(false);
	const [reloadSignal, setReloadSignal] = useState(0);

	const connection = useMemo(
		() => (workspaceId ? new CollabConnection(workspaceId, (c) => setOffline(!c)) : null),
		[workspaceId],
	);

	useEffect(() => {
		if (!workspaceId) return;
		let cancelled = false;
		apiFetch<WorkspaceInfo>(`/api/workspace/${workspaceId}`)
			.then((response) => {
				if (cancelled) return;
				if (!response.ok) {
					setErrorMessage(response.error);
					return;
				}
				setSessionInfo(response.data);
				setJoining(false);
			})
			.catch((err) => {
				if (!cancelled) setErrorMessage(err instanceof Error ? err.message : "Failed to load session");
			});
		return () => {
			cancelled = true;
		};
	}, [workspaceId]);

	// Lets the subscribeMembers callback below read the latest sessionInfo without re-subscribing
	// on every change (its closure would otherwise freeze on the value at subscription time).
	const sessionInfoRef = useRef(sessionInfo);
	useEffect(() => {
		sessionInfoRef.current = sessionInfo;
	}, [sessionInfo]);

	useEffect(() => {
		if (!connection) return;
		const unsubscribe = connection.subscribeMembers((event) => {
			const prev = sessionInfoRef.current;
			const wasMember = prev?.members.some((m) => m.id === user.id) ?? false;
			const nowMember = event.members.some((m) => m.id === user.id);
			if (!wasMember && nowMember) setShowFilePicker(false);
			setJoining(false);
			setSessionInfo({id: event.workspaceId, members: event.members});
		});
		return unsubscribe;
	}, [connection, user.id]);

	useEffect(() => {
		if (!connection) return;
		return connection.subscribeEditorInvalidated((event) => {
			if (event.reason === "fileDeleted") {
				showToast("error", "This file has been deleted.");
				// The accompanying membersChanged removes us from members,
				// and the !isMember render path routes to FilePicker.
				return;
			}
			showToast("info", "Another tab switched this session to a different file.");
			setReloadSignal((s) => s + 1);
		});
	}, [connection, showToast]);

	useEffect(() => {
		if (!connection) return;
		return function cleanup() {
			leaveWorkspace(connection);
			connection.disconnect();
		};
	}, [connection]);

	if (!workspaceId) return <div>Session ID is missing</div>;
	if (errorMessage) return <div className="p-4 text-red-500">{errorMessage}</div>;
	if (joining) return <div>Joining session...</div>;

	if (!connection || !sessionInfo) return <div>Failed to load session</div>;

	const isMember = sessionInfo.members.some((member) => member.id === user.id);

	return (
		<>
			{offline && (
				<div role="status" className="bg-error text-white text-sm text-center py-1">
					Disconnected. Trying to reconnect…
				</div>
			)}
			{!isMember || showFilePicker ? (
				<FilePicker connection={connection} onPicked={() => setShowFilePicker(false)} />
			) : (
				<Editor
					connection={connection}
					myOwnerId={user.id}
					initialMembers={sessionInfo.members}
					onRepickFile={() => setShowFilePicker(true)}
					reloadSignal={reloadSignal}
				/>
			)}
		</>
	);
}
