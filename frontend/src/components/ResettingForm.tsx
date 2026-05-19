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
		<form className="flex gap-1" onSubmit={(e) => handleSubmit(e)} onBlur={(e) => handleBlur(e)}>
			<label>
				{inputLabel}
				<Input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} />
			</label>
			<Button type="submit" disabled={initialValue === draft ? true : undefined}>
				{buttonLabel ?? "Submit"}
			</Button>
		</form>
	);
}

export default ResettingForm;
