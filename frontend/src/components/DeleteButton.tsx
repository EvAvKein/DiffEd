import {useState} from "react";
import Button from "./Button";
import {IconTrash, IconCheck, IconX} from "@tabler/icons-react";

type deleteButtonProps = {
	onDelete: () => void;
	itemName: string;
};

function DeleteButton({onDelete, itemName}: deleteButtonProps) {
	const [confirming, setConfirming] = useState(false);

	return (
		<div aria-live="assertive" className="contents">
			{confirming ? (
				<>
					<Button className="font-bold" aria-label={`Confirm delete ${itemName}`} onClick={onDelete}>
						<IconCheck size={18} aria-hidden />
					</Button>
					<Button onClick={() => setConfirming(false)} aria-label={`Cancel delete ${itemName}`}>
						<IconX size={18} aria-hidden />
					</Button>
				</>
			) : (
				<Button
					danger={true}
					className="font-bold"
					onClick={() => setConfirming(true)}
					aria-label={`Delete ${itemName}`}
				>
					<IconTrash size={18} aria-hidden />
				</Button>
			)}
		</div>
	);
}

export default DeleteButton;
