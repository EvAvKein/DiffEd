import type {ReactNode} from "react";

type headerProps = {
	className?: string;
	children?: ReactNode;
};

function Subheading({className, children}: headerProps) {
	return <h2 className={`text-lg mb-4 ${className ?? ""}`}>{children}</h2>;
}

export default Subheading;
