import Button from "#/src/components/Button";

type AcceptCancelProps = {
	textToShow?: string;
	onAccept: () => void;
	onCancel: () => void;
};

export default function AcceptCancelDialog({textToShow, onAccept, onCancel}: AcceptCancelProps) {
	return (
		<div>
			<span className="text-error-accent">{textToShow}</span>
			<div className="flex justify-center">
				<Button onClick={onAccept} aria-label="Accept changes">
					Accept{" "}
				</Button>
				<Button onClick={onCancel} aria-label="Cancel changes">
					Cancel{" "}
				</Button>
			</div>
		</div>
	);
}
