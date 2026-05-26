import Button from "./Button";
import Input from "./Input";
import {useState, useEffect} from "react";

type resettingFormProps = {
	initialValue: string;
	onSubmit: (value: string) => Promise<void>;
	inputLabel: string;
	buttonLabel?: string;
};

function ResettingForm({initialValue, onSubmit, inputLabel, buttonLabel}: resettingFormProps) {
	const [draft, setDraft] = useState<string>(initialValue);

	const buttonDisabled = initialValue === draft || draft.length === 0;

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
			<label htmlFor="resetting-form">{inputLabel}</label>
			<Input id="resetting-form" type="text" value={draft} onChange={(e) => setDraft(e.target.value)} />
			<Button type="submit" disabled={buttonDisabled}>
				{buttonLabel ?? "Submit"}
			</Button>
		</form>
	);
}

export default ResettingForm;
