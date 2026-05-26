import {useState} from "react";
import {useShowToast} from "#/src/stores/toastStore";
import Button from "#/src/components/Button";
import PasswordInput from "./PasswordInput";

type PasswordConfirmProps = {
	onConfirm: (password: string) => Promise<boolean>;
	onCancel?: () => void;
	submitButtonLabel?: string;
	disabled?: boolean | undefined;
	hint?: string;
};

export default function PasswordConfirmDialog({
	onConfirm,
	onCancel,
	submitButtonLabel,
	disabled,
	hint,
}: PasswordConfirmProps) {
	const [password, setPassword] = useState("");
	const [isConfirming, setIsConfirming] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const showToast = useShowToast();

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		setIsLoading(true);
		if (!password) {
			showToast("error", "No password given");
			return false;
		}

		const result = await onConfirm(password);
		if (result === true) {
			setPassword("");
			setIsConfirming(false);
		}
		setIsLoading(false);
		return result;
	}

	function handleCancel(e: React.MouseEvent) {
		e.preventDefault();
		setIsConfirming(false);
		setPassword("");
		if (onCancel !== undefined) onCancel();
	}

	return (
		<div aria-live="assertive" className="flex flex-col items-center justify-center">
			{!isConfirming ? (
				<Button disabled={disabled} onClick={() => setIsConfirming(true)}>
					{submitButtonLabel ?? "Submit"}
				</Button>
			) : (
				<form onSubmit={(e) => handleSubmit(e)} className="flex flex-col justify-center items-center mb-4">
					<span className="text-foreground-sexy text-sm mx-2">{hint}</span>
					<PasswordInput id="password-confirm-input" value={password} onChange={(e) => setPassword(e.target.value)} />
					<div>
						<Button
							type="submit"
							disabled={disabled || isLoading || password.length === 0}
							aria-label="Accept profile updates"
						>
							Confirm
						</Button>
						<Button type="button" onClick={(e) => handleCancel(e)} aria-label="Cancel profile updates">
							Cancel
						</Button>
					</div>
				</form>
			)}
		</div>
	);
}
