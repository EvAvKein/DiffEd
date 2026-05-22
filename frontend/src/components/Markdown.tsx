import ReactMarkdown, {type Components} from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const components: Components = {
	h1: ({children, id}) => (
		<h1 id={id} className="group relative font-mono font-bold text-accent text-4xl mb-8">
			{children}
		</h1>
	),
	h2: ({children, id}) => (
		<h2 id={id} className="group relative font-mono text-accent/90 text-2xl mt-10 mb-3 scroll-mt-20">
			{children}
		</h2>
	),
	h3: ({children, id}) => (
		<h3 id={id} className="group relative font-mono text-accent/90 text-xl mt-10 mb-3 scroll-mt-20">
			{children}
		</h3>
	),
	h4: ({children, id}) => (
		<h4 id={id} className="group relative font-mono text-accent/90 mt-6 mb-2 scroll-mt-20">
			{children}
		</h4>
	),
	p: ({children}) => <p className="text-foreground/80 leading-relaxed mb-4">{children}</p>,
	ul: ({children}) => <ul className="list-disc pl-6 space-y-1 mb-4 text-foreground/80">{children}</ul>,
	ol: ({children}) => <ol className="list-decimal pl-6 space-y-1 mb-4 text-foreground/80">{children}</ol>,
	li: ({children}) => <li className="leading-relaxed">{children}</li>,
	a: ({href, children, className}) => {
		// rehype-autolink-headings prepends a link to each heading,
		// this render it as a "#" that fades in when the heading is hovered.
		if (typeof className === "string" && className.includes("heading-anchor")) {
			return (
				<a
					href={href}
					aria-hidden
					tabIndex={-1}
					className="absolute -left-6 text-accent/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent"
				>
					{children}
				</a>
			);
		}
		return (
			<a href={href} className="text-accent underline hover:text-foreground-light transition-colors">
				{children}
			</a>
		);
	},
	strong: ({children}) => <strong className="font-semibold text-foreground-light">{children}</strong>,
	em: ({children}) => <em className="italic">{children}</em>,
	pre: ({children}) => <pre className="bg-surface-dark rounded-lg p-4 overflow-x-auto mb-4 text-sm">{children}</pre>,
	code: ({className, children}) => {
		// Fenced code blocks have a `language-*` class, this is how we tell code blocks from inline.
		const isBlock = typeof className === "string" && className.includes("language-");
		if (isBlock) {
			return <code className="font-mono text-foreground/90">{children}</code>;
		}
		return <code className="font-mono text-sm bg-surface-dark text-accent px-1.5 py-0.5 rounded">{children}</code>;
	},
};

export function Markdown({children}: {children: string}) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			rehypePlugins={[
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: "prepend",
						properties: {className: ["heading-anchor"], ariaHidden: true, tabIndex: -1},
						content: {type: "text", value: "#"},
					},
				],
			]}
			components={components}
		>
			{children}
		</ReactMarkdown>
	);
}
