import {useState, type JSX} from "react";
import Button from "#/src/components/Button";
import {useShowToast} from "#/src/stores/toastStore";
import Input from "#/src/components/Input";
import Hints from "../components/Hints";
import {apiFetch} from "#/src/utils.ts";
import {validateFileNameLen, MAX_FILENAME_LEN} from "#shared/src/fileValidation.ts";

type NewFileProps = {
	onFileCreate: (fileId: string) => Promise<void>;
	refreshFileList: () => Promise<void>;
};

function NewFile({onFileCreate, refreshFileList}: NewFileProps): JSX.Element {
	const [newFileName, setNewFileName] = useState<string>("");
	const showToast = useShowToast();

	async function openNewFile() {
		const fileNameError = validateFileNameLen(newFileName);
		if (fileNameError) {
			return showToast("error", fileNameError);
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
		showToast("success", `File "${newFileName}" created`);

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
				<Hints
					id="filename-hints"
					hints={[`Maximum ${MAX_FILENAME_LEN} characters`, "At least one non-whitespace character"]}
				/>
				<label htmlFor="file-name-input">New File</label>
				<Input
					id="file-name-input"
					value={newFileName}
					aria-describedby="filename-hints"
					placeholder="filename"
					onChange={(event) => setNewFileName(event.target.value)}
				/>
				<Button type="submit" disabled={newFileName.length === 0}>
					Create
				</Button>
			</form>
		</div>
	);
}

export default NewFile;
