import {useState, useEffect, useRef} from "react";
import {useNavigate} from "react-router";
import Footer from "#/src/layout/Footer";
import {z} from "zod";
import Button from "#/src/components/Button";
import Input from "#/src/components/Input";
import Subheading from "../components/Subheading";
import OutlineDiv from "#/src/components/OutlineDiv";
import ConfirmCancelDialog from "#/src/components/ConfirmCancelDialog";
import PasswordConfirmDialog from "#/src/components/PasswordConfirmDialog";
import {useShowToast} from "#/src/stores/toastStore";
import {useCurrentUser, useSetUser, useUpdateUser} from "#/src/stores/userStore";
import {apiFetch} from "#/src/utils.js";
import type {ApiResponse, User} from "#shared/src/types.js";
import {MAX_AVATAR_SIZE, EMAIL_MAX_LENGTH, validatePassword} from "#shared/src/userValidation.js";
import Hints from "../components/Hints";
import PasswordInput from "../components/PasswordInput";

const emailSchema = z.email();

type UserSettingProps = {
	user: User;
	onUpdate: (username?: string, email?: string) => void;
};

function UserSettings({user, onUpdate}: UserSettingProps) {
	const [newUsername, setNewUsername] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const showToast = useShowToast();

	async function resetState() {
		setNewUsername("");
		setNewEmail("");
	}

	function isValidInput() {
		const errors: string[] = [];

		if (newUsername) {
			if (newUsername.length < 3) errors.push("Username has to be at least 3 characters long");
			if (newUsername === user.username) errors.push("New Username same as current username");
		}
		if (newEmail) {
			if (!emailSchema.safeParse(newEmail).success) errors.push("Invalid email");
			if (newEmail === user.email) errors.push("New email same as current email");
		}

		if (errors.length > 0) {
			errors.forEach((error) => showToast("error", error));
			return false;
		}
		return true;
	}

	async function handleConfirm(password: string): Promise<boolean> {
		if (!isValidInput()) return false;

		let updatedUsername: string | undefined;
		let updatedEmail: string | undefined;
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
					updatedUsername = newUsername;
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
					updatedEmail = newEmail;
					showToast("success", "Successfully updated email");
				}
			}

			if (updatedUsername !== undefined || updatedEmail !== undefined) {
				onUpdate(updatedUsername, updatedEmail);
			}
			resetState();
			return true;
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
			return false;
		}
	}

	return (
		<>
			<div className="flex flex-col justify-center items-center">
				<label htmlFor="username-input">Username</label>
				<Hints id="username-hints" hints={["Minimum length 3", "Maximum length 20"]} />
				<Input
					id="username-input"
					type="text"
					placeholder={user.username}
					value={newUsername}
					onChange={(e) => setNewUsername(e.target.value)}
				/>
				<label htmlFor="email-input">Email</label>
				<Input
					id="email-input"
					type="email"
					placeholder={user.email}
					value={newEmail}
					maxLength={EMAIL_MAX_LENGTH}
					onChange={(e) => setNewEmail(e.target.value)}
				/>
				<div>
					<PasswordConfirmDialog
						disabled={newEmail.length === 0 && newUsername.length === 0}
						onConfirm={handleConfirm}
						onCancel={() => {
							resetState();
						}}
					/>
				</div>
			</div>
		</>
	);
}

function Password() {
	const [isEditing, setIsEditing] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [newPassword2, setNewPassword2] = useState("");
	const [oldPassword, setOldPassword] = useState("");
	const showToast = useShowToast();

	function resetState() {
		setIsEditing(false);
		setNewPassword("");
		setNewPassword2("");
		setOldPassword("");
	}

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		if (!newPassword || !newPassword2) {
			return showToast("error", "Please fill all the fields!");
		}

		const passwordError = validatePassword(newPassword);
		if (passwordError) {
			return showToast("error", passwordError);
		}

		if (newPassword !== newPassword2) {
			return showToast("error", "The passwords do not match!");
		}

		try {
			const response: ApiResponse<null> = await apiFetch("/api/user", {
				method: "PATCH",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({password: oldPassword, newPassword, newPassword2}),
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
		<div aria-live="polite" className="my-2">
			{isEditing ? (
				<form onSubmit={(e) => handleSubmit(e)} className="flex flex-col items-center justify-center">
					<PasswordInput
						label="New password"
						showHints={true}
						id="new-password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
					<PasswordInput
						label="Repeat new password"
						id="new-password-again"
						value={newPassword2}
						onChange={(e) => setNewPassword2(e.target.value)}
					/>
					<PasswordInput
						label="Old password"
						id="old-password"
						value={oldPassword}
						onChange={(e) => setOldPassword(e.target.value)}
					/>
					<div>
						<Button type="submit">Submit</Button>
						<Button
							type="reset"
							onClick={() => {
								resetState();
								setIsEditing(false);
							}}
						>
							Cancel
						</Button>
					</div>
				</form>
			) : (
				<>
					<Button onClick={() => setIsEditing(true)} aria-label="Change password">
						Change password
					</Button>
				</>
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

	return (
		<div aria-live="polite" className="my-2">
			{githubLinked ? (
				<>
					<span>GitHub: Linked</span>
					<Button onClick={handleUnlink} disabled={isLoading} aria-label="Unlink GitHub account">
						{isLoading ? "Unlinking..." : "Unlink"}
					</Button>
				</>
			) : (
				<a
					href="/api/auth/github?action=link_account"
					className="rounded-sm cursor-pointer m-1 p-1 bg-surface hover:text-accent text-foreground-light"
				>
					Link GitHub
				</a>
			)}
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
			showToast("info", `Vim bindings ${!enabled ? "enabled" : "disabled"}`);
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		}
		setIsLoading(false);
	}

	return (
		<div>
			<span>Vim keybindings default</span>
			<Button onClick={handleToggle} disabled={isLoading} aria-label="Toggle vim bindings">
				{enabled ? "On" : "Off"}
			</Button>
		</div>
	);
}

function Delete() {
	const navigate = useNavigate();
	const showToast = useShowToast();

	async function deleteAccount(password: string): Promise<boolean> {
		const response: ApiResponse<null> = await apiFetch("/api/user", {
			method: "DELETE",
			headers: {"Content-Type": "application/json"},
			credentials: "include",
			body: JSON.stringify({password: password}),
		});

		if (!response.ok) {
			showToast("error", response.error);
			return false;
		}

		showToast("success", "Successfully deleted user");
		navigate("/login");
		return true;
	}

	return (
		<div className="flex flex-col justify-center items-center outline-1 outline-error-accent rounded-sm p-2 m-2">
			<Subheading className="text-error-accent">Danger Zone</Subheading>
			<PasswordConfirmDialog
				submitButtonLabel="Delete Account"
				onConfirm={deleteAccount}
				hint="You're about to remove your account! This cannot be undone..."
			/>
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
			showToast("success", "API key created");
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
			showToast("success", "API key copied to clipboard");
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
			showToast("success", "Successfully deleted API key");
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<OutlineDiv>
			<Subheading>API Keys</Subheading>
			<Button onClick={createNewApiKey} disabled={isLoading} aria-label="Create new API key">
				Create new API key
			</Button>
			<Button onClick={copyApiKey} disabled={isLoading || !hasApiKey} aria-label="Get current API key">
				Copy current API key
			</Button>
			<div aria-live="polite">
				{showDeleteConfirm ? (
					<ConfirmCancelDialog
						textToShow="Delete your current key?"
						onConfirm={deleteApiKey}
						onCancel={() => setAcceptDelete(false)}
					/>
				) : (
					<Button onClick={() => setAcceptDelete(true)} disabled={isLoading || !hasApiKey} aria-label="Delete API key">
						Delete API key
					</Button>
				)}
			</div>
		</OutlineDiv>
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

		if (file.size > MAX_AVATAR_SIZE) {
			showToast("error", "Avatar must be under 1 MB");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

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
		<OutlineDiv>
			<Subheading>Avatar</Subheading>
			<div className="flex items-end gap-3 m-2">
				<div className="w-32 h-32 rounded-full overflow-hidden">
					<img src={avatarURL} alt="avatar" className="w-full h-full object-cover" />
				</div>
				<img src={avatarURL} alt="" className="w-5 h-5 rounded-full object-cover" />
			</div>
			<input type="file" accept="image/*" onChange={handleUpload} ref={fileInputRef} style={{display: "none"}} />
			<Button disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
				Upload avatar
			</Button>
			<div aria-live="polite">
				{hasAvatar && !acceptDelete ? (
					<Button disabled={isLoading} danger={true} onClick={() => setAcceptDelete(true)}>
						Delete avatar
					</Button>
				) : hasAvatar ? (
					<ConfirmCancelDialog
						textToShow="Delete your avatar?"
						onConfirm={handleDelete}
						onCancel={() => setAcceptDelete(false)}
					/>
				) : null}
			</div>
			<span className="text-sm text-foreground-sexy">max. 1 MB (.png .webp .jpg .jpeg)</span>
		</OutlineDiv>
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
		apiFetch<User>("/api/user", {method: "GET", credentials: "include"}).then((response) => {
			if (!response.ok) {
				showToast("error", `Error fetching user data: ${response.error}`);
				navigate("/login");
				return;
			}
			setUser(response.data);
			setIsLoading(false);
		});
	}, []);

	return isLoading || !currentUser ? (
		<div>Loading...</div>
	) : (
		<>
			<div className="grid grid-cols-1 gap-4 w-64 mx-auto">
				<OutlineDiv>
					<Subheading>Account settings</Subheading>
					<UserSettings
						user={currentUser}
						onUpdate={(username, email) => {
							if (username !== undefined) updateUser({username});
							if (email !== undefined) updateUser({email});
						}}
					/>
					<Password />
					<GithubLink githubLinked={!!currentUser.github_linked} />
				</OutlineDiv>

				<ApiKey hasApiKey={!!currentUser.has_apikey} />

				<OutlineDiv>
					<Subheading>Editor settings</Subheading>
					<VimBindings enabled={currentUser.vim_bindings} />
				</OutlineDiv>

				<Avatar hasAvatar={!!currentUser.has_avatar} />

				<Delete />
			</div>
			<div className="mt-12">
				<Footer />
			</div>
		</>
	);
}
