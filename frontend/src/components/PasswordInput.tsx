import Input from "./Input";
import Hints from "./Hints";

type passwordInputProps = {
	label?: string;
	id?: string;
	showHints?: boolean;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function PasswordInput({label, id, showHints, value, onChange}: passwordInputProps) {
	return (
		<>
			<label htmlFor={id}>{label ?? "Password"}</label>
			{showHints ? <Hints hints={["Minimum length 14", "Maximum length 128"]} /> : null}
			<Input id={id ?? "password"} placeholder="**************" type="password" value={value} onChange={onChange} />
		</>
	);
}

export default PasswordInput;
