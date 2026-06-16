import Button from "#/src/components/Button";
import Input from "#/src/components/Input";
import {useState, useEffect} from "react";
import {useNavigate, useSearchParams, useLocation} from "react-router";
import type {Location} from "react-router";
import type {SubmitEvent} from "react";
import type {SigningUser, ApiResponse, User, PendingGithubPayload} from "#shared/src/types";
import {apiFetch, getSession} from "#/src/utils.ts";
import {z} from "zod";
import {validatePassword, EMAIL_MAX_LENGTH} from "#shared/src/userValidation.js";
import {useShowToast} from "#/src/stores/toastStore";
import {useSetUser} from "#/src/stores/userStore.ts";
import Hints from "../components/Hints";
import PasswordInput from "../components/PasswordInput";
import Subheading from "../components/Subheading";

const emailSchema = z.email();

function decodeGithubToken(token: string): PendingGithubPayload | null {
	try {
		// Token format: "<base64url-payload>.<hmac-sig>" — strip the signature, convert base64url to base64, decode
		// `replace` operations because base64url uses - and _ instead of + and / (RFC 4648 §5): atob needs standard base64, so swap them back
		// e.g. "eyJnaXRodWJJZCI6....<sig>" to { githubId: "...", email: "...", ... }
		const data = token.slice(0, token.lastIndexOf("."));
		return JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")));
	} catch {
		return null;
	}
}

export default function SignupPage() {
	const [username, setUserName] = useState("");
	const [email, setUserEmail] = useState("");
	const [password, setUserPassword] = useState("");
	const [password2, setUserPassword2] = useState("");
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const showToast = useShowToast();
	const setUser = useSetUser();

	const githubToken = searchParams.get("github_token");
	const pendingGithub = githubToken ? decodeGithubToken(githubToken) : null;

	const from: Location | null = location.state?.from ?? null;
	const redirectTo = from ? from.pathname + from.search : "/filebrowser";

	useEffect(() => {
		getSession().then((ok) => {
			if (ok) navigate(redirectTo, {replace: true});
		});
		if (pendingGithub) {
			setUserName(pendingGithub.displayName.slice(0, 20).replace(/[^a-zA-Z0-9_]/g, "_"));
		}
	}, [navigate]);

	async function signup(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			if (!username || !email || !password) {
				throw new Error("Please fill all the fields!");
			}

			const result = emailSchema.safeParse(email);
			if (!result.success) {
				throw new Error("Invalid email");
			}

			const passwordError = validatePassword(password);
			if (passwordError) {
				throw new Error(passwordError);
			}

			if (password !== password2) {
				throw new Error("The passwords do not match!");
			}

			const newUser: SigningUser = {
				username: username,
				email: email,
				password: password,
			};

			const response: ApiResponse<null> = await apiFetch("/api/user", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify(newUser),
			});

			if (!response.ok) {
				throw new Error(response.error);
			}

			showToast("success", "Signup successful");
			navigate("/login", {state: from ? {from} : undefined});
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		}
	}

	async function completeGithubSignup(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			if (!username) throw new Error("Please enter a username");

			const response: ApiResponse<User> = await apiFetch("/api/auth/github/username", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({token: githubToken, username}),
			});

			if (!response.ok) throw new Error(response.error);

			setUser(response.data);
			showToast("success", "Account created");
			navigate(redirectTo, {replace: true});
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		}
	}

	if (pendingGithub) {
		return (
			<div className="min-h-[calc(100vh-105px)] flex flex-col items-center pt-12 gap-2">
				<Subheading className={"text-3xl! font-bold"}>Complete your GitHub sign-up</Subheading>
				<form className="flex flex-col items-center" onSubmit={completeGithubSignup}>
					<Input
						className="block"
						placeholder="username"
						value={username}
						onChange={(e) => setUserName(e.target.value)}
					/>
					<Button type="submit">Create Account</Button>
				</form>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-105px)] flex flex-col items-center pt-12 gap-1">
			<Subheading className={"text-3xl! font-bold"}>Create a new account</Subheading>
			<form onSubmit={signup} className="flex flex-col items-center justify-center">
				<label htmlFor="username-input">Username</label>
				<Hints id="username-hints" hints={["Minimum length 3", "Maximum length 20"]} />
				<Input
					id="username-input"
					placeholder="username"
					value={username}
					onChange={(e) => setUserName(e.target.value)}
				/>

				<label htmlFor="email-input">Email</label>
				<Input
					id="email-input"
					placeholder="email"
					value={email}
					maxLength={EMAIL_MAX_LENGTH}
					onChange={(e) => setUserEmail(e.target.value)}
				/>

				<PasswordInput showHints={true} value={password} onChange={(e) => setUserPassword(e.target.value)} />

				<PasswordInput label="Repeat password" value={password2} onChange={(e) => setUserPassword2(e.target.value)} />

				<Button type="submit">Sign Up</Button>
			</form>
			<Button href="/api/auth/github?action=signup">Sign up with GitHub</Button>
			<div>
				Already have an account? Go to the&nbsp;
				<button
					onClick={() => navigate("/login", {state: from ? {from} : undefined})}
					className="hover:text-accent font-bold underline cursor-pointer"
				>
					login page
				</button>
			</div>
		</div>
	);
}
