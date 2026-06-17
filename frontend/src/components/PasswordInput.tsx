import Input from "./Input";
import Hints from "./Hints";
import {PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH} from "#shared/src/userValidation.js";

type passwordInputProps = {
	label?: string;
	id?: string;
	showHints?: boolean;
	maxLength?: number;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function PasswordInput({label, id, showHints, maxLength, value, onChange}: passwordInputProps) {
	return (
		<>
			<label htmlFor={id}>{label ?? "Password"}</label>
			{showHints ? (
				<Hints hints={[`Minimum length ${PASSWORD_MIN_LENGTH}`, `Maximum length ${PASSWORD_MAX_LENGTH}`]} />
			) : null}
			<Input
				id={id ?? "password"}
				placeholder="**************"
				type="password"
				maxLength={maxLength}
				value={value}
				onChange={onChange}
			/>
		</>
	);
}

export default PasswordInput;
