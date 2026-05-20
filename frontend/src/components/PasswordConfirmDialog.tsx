import {useState} from "react";
import {useShowToast} from "#/src/stores/toastStore";
import Input from "#/src/components/Input";
import Button from "#/src/components/Button";

type PasswordConfirmProps = {
	onConfirm: (password: string) => void;
	onCancel: () => void;
};

export default function PasswordConfirmDialog({onConfirm, onCancel}: PasswordConfirmProps) {
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const showToast = useShowToast();

	async function handleSubmitClick() {
		setIsLoading(true);
		try {
			if (!password) {
				throw new Error("Please fill the password!");
			}

			onConfirm(password);
		} catch (e) {
			showToast("error", e instanceof Error ? e.message : String(e));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<div>
				<Input
					placeholder="Enter password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<Button onClick={handleSubmitClick} disabled={isLoading} aria-label="Accept profile updates">
					Confirm
				</Button>
			</div>
			<div>
				Please enter password to accept the changes or&nbsp;
				<button
					onClick={onCancel}
					className="hover:text-accent font-bold underline cursor-pointer"
					aria-label="Cancel profile updates"
				>
					cancel
				</button>
			</div>
		</>
	);
}
