import type {ReactNode} from "react";

type outlineDivProps = {
	children: ReactNode;
};

function OutlineDiv({children}: outlineDivProps) {
	return (
		<div className="flex flex-col items-center justify-center outline-1 outline-surface rounded-sm m-2 p-2">
			{children}
		</div>
	);
}

export default OutlineDiv;
