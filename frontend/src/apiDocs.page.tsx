import apiMarkdown from "#docs/api.md?raw";
import {Markdown} from "./components/Markdown.tsx";

export default function ApiDocsPage() {
	return (
		<div className="min-h-[calc(100vh-105px)] flex flex-col items-center px-8 py-16">
			<div className="max-w-5xl w-full">
				<p className="font-mono text-foreground/50 text-xs tracking-[0.35em] uppercase mb-3">Documentation</p>
				<Markdown>{apiMarkdown}</Markdown>
			</div>
		</div>
	);
}
