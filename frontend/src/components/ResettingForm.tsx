import Button from "./Button";
import Input from "./Input";
import {useState, useEffect} from "react";

type resettingFormProps = {
	initialValue: string;
	onSubmit: (value: string) => Promise<void>;
	inputLabel: string;
	buttonLabel?: string;
	validation?: (value: string) => string | null;
};

function ResettingForm({initialValue, onSubmit, inputLabel, buttonLabel, validation}: resettingFormProps) {
	const [draft, setDraft] = useState<string>(initialValue);
	const validationError = validation !== undefined ? validation(draft) : null;

	const buttonDisabled = initialValue === draft || (validation !== undefined && validationError !== null);

	useEffect(() => setDraft(initialValue), [initialValue]);

	function handleBlur(e: React.FocusEvent) {
		if (e.currentTarget.contains(e.relatedTarget)) return;
		setDraft(initialValue);
	}

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		await onSubmit(draft);
	}

	return (
		<form className="flex gap-1 items-center" onSubmit={(e) => handleSubmit(e)} onBlur={(e) => handleBlur(e)}>
			<label>
				{inputLabel}
				<Input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} />
			</label>
			<Button type="submit" disabled={buttonDisabled}>
				{buttonLabel ?? "Submit"}
			</Button>
			{validationError ? <div className="text-sm text-error-accent">{validationError}</div> : null}
		</form>
	);
}

export default ResettingForm;
