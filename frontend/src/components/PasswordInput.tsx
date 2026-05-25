import Input from "./Input";

type passwordInputProps = {
	label?: string;
	id?: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function PasswordInput({label, id, value, onChange}: passwordInputProps) {
	return (
		<>
			<label htmlFor="password-input">{label ?? "Password"}</label>
			<Input id={id ?? undefined} placeholder="**************" type="password" value={value} onChange={onChange} />
		</>
	);
}

export default PasswordInput;
