import React from "react";

type inputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, inputProps>(({className, ...props}, ref) => {
	return <input ref={ref} className={`m-1 px-1 border-2 border-surface ${className ?? ""}`} {...props} />;
});

Input.displayName = "Input";

export default Input;
