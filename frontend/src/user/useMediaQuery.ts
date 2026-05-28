import {useState, useEffect} from "react";

export default function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

	useEffect(() => {
		const queryList = window.matchMedia(query);
		const onChange = () => setMatches(queryList.matches);
		queryList.addEventListener("change", onChange);
		setMatches(queryList.matches);
		return () => queryList.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
