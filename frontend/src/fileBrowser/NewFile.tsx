import {useState, type JSX} from "react";
import Button from "#/src/components/Button";
import {useShowToast} from "#/src/stores/toastStore";
import Input from "#/src/components/Input";
import {apiFetch} from "#/src/utils.ts";

type NewFileProps = {
	onFileCreate: (fileId: string) => Promise<void>;
	refreshFileList: () => Promise<void>;
};

function NewFile({onFileCreate, refreshFileList}: NewFileProps): JSX.Element {
	const [newFilename, setNewFilename] = useState<string>("");
	const showToast = useShowToast();

	async function openNewFile() {
		if (!newFilename || !newFilename.trim().length) {
			showToast("error", "Filename can't be empty");
			return;
		}

		const formData = new FormData();
		const file = new File([""], newFilename, {type: "text/plain"});

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
				<label>
					New File
					<Input
						id="fileNameInput"
						value={newFilename}
						placeholder="filename"
						onChange={(event) => setNewFilename(event.target.value)}
					/>
				</label>
				<Button type="submit">Create</Button>
			</form>
		</div>
	);
}

export default NewFile;
