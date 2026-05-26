import React from "react";

type hintsProps = React.LiHTMLAttributes<HTMLUListElement> & {
	hints: string[];
};

function Hints({hints, ...props}: hintsProps) {
	return (
		<ul
			id={props.id}
			className={`text-xs text-foreground-sexy list-disc flex- flex-col w-fit mx-auto ${props.className ?? ""}`}
		>
			{hints.map((h, i) => (
				<li key={i}>{h}</li>
			))}
		</ul>
	);
}

export default Hints;
