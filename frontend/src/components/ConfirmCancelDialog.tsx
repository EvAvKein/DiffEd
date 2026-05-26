import Button from "#/src/components/Button";

type ConfirmCancelProps = {
	textToShow?: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export default function ConfirmCancelDialog({textToShow, onConfirm, onCancel}: ConfirmCancelProps) {
	return (
		<div>
			<span className="text-error-accent">{textToShow}</span>
			<div className="flex justify-center">
				<Button onClick={onConfirm} aria-label="Confirm changes">
					Confirm{" "}
				</Button>
				<Button onClick={onCancel} aria-label="Cancel changes">
					Cancel{" "}
				</Button>
			</div>
		</div>
	);
}
