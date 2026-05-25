import {useState, type JSX} from "react";
import Button from "#/src/components/Button";
import {useShowToast} from "#/src/stores/toastStore";
import Input from "#/src/components/Input";
import {apiFetch} from "#/src/utils.ts";
import {validateFileNameLen, MAX_FILENAME_LEN} from "#shared/src/fileValidation.ts";

type NewFileProps = {
	onFileCreate: (fileId: string) => Promise<void>;
	refreshFileList: () => Promise<void>;
};

function NewFile({onFileCreate, refreshFileList}: NewFileProps): JSX.Element {
	const [newFileName, setNewFileName] = useState<string>("");
	const [touched, setTouched] = useState<boolean>(false);
	const fileNameError: string | null = newFileName.length > 0 ? validateFileNameLen(newFileName) : null;
	const showToast = useShowToast();

	async function openNewFile() {
		if (!newFileName || !newFileName.trim().length) {
			showToast("error", "Filename can't be empty");
			return;
		}

		const formData = new FormData();
		const file = new File([""], newFileName, {type: "text/plain"});

		formData.append("file", file);

		const fileResult = await apiFetch<string>("/api/files", {
			method: "POST",
			body: formData,
		});

		if (!fileResult.ok) {
			showToast("error", `File creation failed: ${fileResult.error}`);
			refreshFileList();
			return;
		}
		showToast("success", `File "${newFilename}" created`);

		try {
			const fileId = fileResult.data;
			await onFileCreate(fileId);
		} catch (err) {
			if (typeof err === "string" && err) {
				showToast("error", err);
			} else if (err instanceof Error) {
				showToast("error", err.message);
			} else {
				showToast("error", "Unknown error occurred");
			}
			refreshFileList();
		}
	}

	return (
		<div className="flex flex-col justify-center items-center">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					openNewFile();
				}}
			>
				<ul id="filename-hints" className="text-xs text-foreground-sexy list-disc flex flex-col w-fit mx-auto">
					<li>Maximum {MAX_FILENAME_LEN} characters</li>
					<li>At least one non-whitespace character</li>
				</ul>
				<div
					id="filename-error"
					aria-live="polite"
					aria-atomic="true"
					className="flex justify-center text-sm text-error"
				>
					{fileNameError}
				</div>
				<label htmlFor="fileNameInput">New File</label>
				<Input
					id="fileNameInput"
					value={newFileName}
					aria-describedby="filename-hints"
					aria-invalid={touched && !!fileNameError}
					aria-required={true}
					placeholder="filename"
					onChange={(event) => setNewFileName(event.target.value)}
					onBlur={() => setTouched(true)}
				/>
				<Button type="submit" disabled={!!fileNameError || newFileName.length === 0}>
					Create
				</Button>
			</form>
		</div>
	);
}

export default NewFile;
