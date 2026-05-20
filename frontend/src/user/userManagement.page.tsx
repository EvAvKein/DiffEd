import {useState, useEffect, useRef} from "react";
import {useNavigate} from "react-router";
import Footer from "#/src/layout/Footer";
import {z} from "zod";
import Button from "#/src/components/Button";
import Input from "#/src/components/Input";
import AcceptCancelDialog from "#/src/components/AcceptCancelDialog";
import PasswordConfirmDialog from "#/src/components/PasswordConfirmDialog";
import {useShowToast} from "#/src/stores/toastStore";
import {useCurrentUser, useSetUser, useUpdateUser} from "#/src/stores/userStore";
import {apiFetch} from "#/src/utils.js";
import type {ApiResponse, User} from "#shared/src/types.js";

const emailSchema = z.email();

type UserSettingProps = {
	user: User;
	onUpdate: (username?: string, email?: string) => void;
};

function UserSettings({user, onUpdate}: UserSettingProps) {
	const [currentUsername, setCurrentUsername] = useState(user.username);
	const [currentEmail, setCurrentEmail] = useState(user.email);
	const [newUsername, setNewUsername] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState(false);
	const showToast = useShowToast();

	useEffect(() => {
		if (!newUsername && !newEmail) setPasswordConfirm(false);
		else setPasswordConfirm(true);
	}, [newUsername, newEmail]);

	async function resetState() {
		setNewUsername("");
		setNewEmail("");
		setPasswordConfirm(false);
	}

	function isValidInput() {
		const errors: string[] = [];

		if (newUsername) {
			if (newUsername.length < 3) errors.push("Username has to be at least 3 characters long");
			if (newUsername === currentUsername) errors.push("New Username same as current username");
		}
		if (newEmail) {
			if (!emailSchema.safeParse(newEmail).success) errors.push("Invalid email");
			if (newEmail == currentEmail) errors.push("error", "New email same as current email");
		}

		if (errors.length > 0) {
			errors.forEach((error) => showToast("error", error));
			return false;
		}
		return true;
	}

	async function handleConfirmClick(password: string) {
		if (!isValidInput()) return;

		try {
			if (newUsername) {
				const response: ApiResponse<null> = await apiFetch("/api/user", {
					method: "PATCH",
					headers: {"Content-Type": "application/json"},
					credentials: "include",
					body: JSON.stringify({username: newUsername, password: password}),
				});

				if (!response.ok) {
					if (response.error.includes("password")) throw new Error(response.error);
					showToast("error", response.error);
				} else {
					setCurrentUsername(newUsername);
					showToast("success", "Successfully updated username");
				}
			}

			if (newEmail) {
				const response: ApiResponse<null> = await apiFetch("/api/user", {
					method: "PATCH",
					headers: {"Content-Type": "application/json"},
					credentials: "include",
					body: JSON.stringify({email: newEmail, password: password}),
				});

				if (!response.ok) {
					if (response.error.includes("password")) throw new Error(response.error);
					showToast("error", response.error);
				} else {
					setCurrentEmail(newEmail);
					showToast("success", "Successfully updated email");
				}
			}

			onUpdate(currentUsername, currentEmail);
			resetState();
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		}
	}

	return (
		<>
			<div>
				<h2>Username</h2>
				<div>
					<Input
						type="text"
						placeholder={currentUsername}
						value={newUsername}
						onChange={(e) => setNewUsername(e.target.value)}
					/>
				</div>
				<h2>Email</h2>
				<div>
					<Input
						type="email"
						placeholder={currentEmail}
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
					/>
				</div>
			</div>
			<div>
				{passwordConfirm ? (
					<div>
						<PasswordConfirmDialog
							onConfirm={handleConfirmClick}
							onCancel={() => {
								setPasswordConfirm(false);
								resetState();
							}}
						/>
					</div>
				) : (
					<div></div>
				)}
			</div>
		</>
	);
}

function Password() {
	const [passwordConfirm, setPasswordConfirm] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [newPassword2, setNewPassword2] = useState("");
	const showToast = useShowToast();

	useEffect(() => {
		if (!newPassword && !newPassword2) setPasswordConfirm(false);
		else setPasswordConfirm(true);
	}, [newPassword, newPassword2]);

	function resetState() {
		setIsEditing(false);
		setPasswordConfirm(false);
		setNewPassword("");
		setNewPassword2("");
	}

	async function handleConfirmClick(password: string) {
		if (!newPassword || !newPassword2) {
			return showToast("error", "Please fill all the fields!");
		}

		if (newPassword !== newPassword2) {
			return showToast("error", "The passwords do not match!");
		}

		try {
			const response: ApiResponse<null> = await apiFetch("/api/user", {
				method: "PATCH",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({password, newPassword, newPassword2}),
			});

			if (!response.ok) {
				throw new Error(response.error);
			}

			showToast("success", "Successfully changed password");
			resetState();
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		}
	}

	return (
		<div>
			{isEditing ? (
				<>
					<div>
						<Input
							placeholder="new password"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</div>
					<div>
						<Input
							placeholder="new password, again"
							type="password"
							value={newPassword2}
							onChange={(e) => setNewPassword2(e.target.value)}
						/>
					</div>
					<div>
						{passwordConfirm ? (
							<div>
								<PasswordConfirmDialog
									onConfirm={handleConfirmClick}
									onCancel={() => {
										setPasswordConfirm(false);
										resetState();
									}}
								/>
							</div>
						) : (
							<div></div>
						)}
					</div>
				</>
			) : (
				<div>
					<Button onClick={() => setIsEditing(true)} aria-label="Change password">
						Change Password
					</Button>
				</div>
			)}
		</div>
	);
}

function GithubLink({githubLinked}: {githubLinked: boolean}) {
	const [isLoading, setIsLoading] = useState(false);
	const updateUser = useUpdateUser();
	const showToast = useShowToast();

	async function handleUnlink() {
		setIsLoading(true);
		try {
			const response: ApiResponse<null> = await apiFetch("/api/auth/github/link", {
				method: "DELETE",
				credentials: "include",
			});
			if (!response.ok) throw new Error(response.error);
			updateUser({github_linked: false});
			showToast("success", "GitHub account unlinked");
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	if (githubLinked) {
		return (
			<div>
				<span>GitHub: Linked</span>
				&nbsp;
				<Button onClick={handleUnlink} disabled={isLoading} aria-label="Unlink GitHub account">
					{isLoading ? "Unlinking..." : "Unlink"}
				</Button>
			</div>
		);
	}

	return (
		<div>
			<a href="/api/auth/github?action=link_account">
				<Button type="button" aria-label="Link GitHub account">
					Link GitHub
				</Button>
			</a>
		</div>
	);
}

function VimBindings({enabled}: {enabled: boolean}) {
	const [isLoading, setIsLoading] = useState(false);
	const updateUser = useUpdateUser();
	const showToast = useShowToast();

	async function handleToggle() {
		setIsLoading(true);
		try {
			const response: ApiResponse<null> = await apiFetch("/api/user", {
				method: "PATCH",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({vim_bindings: !enabled}),
			});
			if (!response.ok) throw new Error(response.error);
			updateUser({vim_bindings: !enabled});
			showToast("success", `Vim bindings ${!enabled ? "enabled" : "disabled"}`);
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		}
		setIsLoading(false);
	}

	return (
		<div>
			<span>VIM BY DEFAULT:</span>
			<Button onClick={handleToggle} disabled={isLoading} aria-label="Toggle vim bindings">
				{enabled ? "On" : "Off"}
			</Button>
		</div>
	);
}

function Delete() {
	const [passwordConfirm, setPasswordConfirm] = useState(false);
	const navigate = useNavigate();
	const showToast = useShowToast();

	async function deleteAccount(password: string) {
		if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
			return;
		}

		try {
			const response: ApiResponse<null> = await apiFetch("/api/user", {
				method: "DELETE",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({password: password}),
			});

			if (!response.ok) {
				throw new Error(response.error);
			}

			showToast("success", "Successfully deleted user");
			navigate("/login");
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		}
	}

	return !passwordConfirm ? (
		<div>
			<Button onClick={() => setPasswordConfirm(true)} aria-label="Delete account">
				Delete Account
			</Button>
		</div>
	) : (
		<div>
			<h2>You are deleting your account!</h2>
			<PasswordConfirmDialog onConfirm={deleteAccount} onCancel={() => setPasswordConfirm(false)} />
		</div>
	);
}

function ApiKey({hasApiKey}: {hasApiKey: boolean}) {
	const [isLoading, setIsLoading] = useState(false);
	const [showDeleteConfirm, setAcceptDelete] = useState(false);
	const updateUser = useUpdateUser();
	const showToast = useShowToast();

	async function createNewApiKey() {
		try {
			setIsLoading(true);

			const response: ApiResponse<string> = await apiFetch("/api/user/api-key", {
				method: "PATCH",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(response.error);
			}

			updateUser({has_apikey: true});
			await navigator.clipboard.writeText(response.data);
			showToast("success", "Api key created and copied to clipboard");
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	async function copyApiKey() {
		try {
			setIsLoading(true);
			const response: ApiResponse<string> = await apiFetch("/api/user/api-key", {
				method: "GET",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(response.error);
			}

			await navigator.clipboard.writeText(response.data);
			showToast("success", "Api key copied to clipboard");
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	async function deleteApiKey() {
		try {
			setIsLoading(true);

			const response: ApiResponse<null> = await apiFetch("/api/user/api-key", {
				method: "DELETE",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({hash: null}),
			});

			if (!response.ok) {
				throw new Error(response.error);
			}

			setAcceptDelete(false);
			updateUser({has_apikey: false});
			showToast("success", "Successfully deleted Api key");
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<div>
				<Button onClick={createNewApiKey} disabled={isLoading} aria-label="Create new Api key">
					Create new Api key
				</Button>
				{hasApiKey && (
					<Button onClick={copyApiKey} disabled={isLoading} aria-label="Get current Api key">
						Copy current Api key
					</Button>
				)}
			</div>
			{hasApiKey && (
				<div>
					{showDeleteConfirm ? (
						<AcceptCancelDialog
							textToShow="Are you sure you want to delete the current key?"
							onAccept={deleteApiKey}
							onCancel={() => setAcceptDelete(false)}
						/>
					) : (
						<Button onClick={() => setAcceptDelete(true)} disabled={isLoading} aria-label="Delete Api key">
							Delete Api key
						</Button>
					)}
				</div>
			)}
		</>
	);
}

function Avatar({hasAvatar}: {hasAvatar: boolean}) {
	const [avatarURL, setAvatarURL] = useState(`/api/user/avatar?t=${Date.now()}`);
	const [isLoading, setIsLoading] = useState(false);
	const [acceptDelete, setAcceptDelete] = useState(false);
	const updateUser = useUpdateUser();
	const showToast = useShowToast();
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("avatar", file);

		try {
			setIsLoading(true);

			const response: ApiResponse<null> = await apiFetch("/api/user/avatar", {
				method: "PATCH",
				credentials: "include",
				body: formData,
			});

			if (!response.ok) {
				throw new Error(response.error);
			}

			setAvatarURL(`/api/user/avatar?t=${Date.now()}`);

			updateUser({has_avatar: true});
			showToast("success", "Successfully uploaded the avatar");

			// Reset fileInputRef removes file selection from browser cache
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleDelete() {
		try {
			setIsLoading(true);

			const response: ApiResponse<null> = await apiFetch("api/user/avatar", {method: "DELETE", credentials: "include"});

			if (!response.ok) {
				throw new Error(response.error);
			}

			setAvatarURL(`/api/user/avatar?t=${Date.now()}`);
			setAcceptDelete(false);

			updateUser({has_avatar: false});
			showToast("success", "Successfully deleted the avatar");
		} catch (e: unknown) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<div className="w-32 h-32 rounded-full overflow-hidden">
				<img src={avatarURL} alt="avatar" className="w-full h-full object-cover" />
			</div>
			<input type="file" accept="image/*" onChange={handleUpload} ref={fileInputRef} style={{display: "none"}} />
			<Button disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
				Upload avatar
			</Button>
			<span>max. 1 MB (.png .webp .jpg .jpeg)</span>

			{hasAvatar && !acceptDelete ? (
				<div>
					<Button disabled={isLoading} onClick={() => setAcceptDelete(true)}>
						Delete avatar
					</Button>
				</div>
			) : hasAvatar ? (
				<AcceptCancelDialog
					textToShow="Are you sure you want to delete the avatar?"
					onAccept={handleDelete}
					onCancel={() => setAcceptDelete(false)}
				/>
			) : null}
		</>
	);
}

export default function UserManagementPage() {
	const currentUser = useCurrentUser();
	const setUser = useSetUser();
	const updateUser = useUpdateUser();
	const [isLoading, setIsLoading] = useState(!currentUser);
	const showToast = useShowToast();
	const navigate = useNavigate();

	useEffect(() => {
		if (currentUser) return;

		apiFetch<User>("/api/user", {method: "GET", credentials: "include"}).then((response) => {
			if (!response.ok) {
				showToast("error", `Error fetching user data: ${response.error}`);
				return;
			}
			setUser(response.data);
			setIsLoading(false);
		});
	}, [navigate]);

	return isLoading || !currentUser ? (
		<div>Loading...</div>
	) : (
		<div>
			<h1>Account Settings</h1>
			<div>
				<UserSettings user={currentUser} onUpdate={(username, email) => updateUser({username, email})} />
			</div>
			<div>
				<Password />
			</div>
			<div>
				<GithubLink githubLinked={!!currentUser.github_linked} />
			</div>
			<div>
				<ApiKey hasApiKey={!!currentUser.has_apikey} />
			</div>
			<div>
				<VimBindings enabled={currentUser.vim_bindings} />
			</div>
			<div>
				DANGER ZONE!!!
				<Delete />
			</div>
			<div>
				<Avatar hasAvatar={!!currentUser.has_avatar} />
			</div>
			<div className="mt-12">
				<Footer />
			</div>
		</div>
	);
}
