import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Pre-bundle every CodeMirror package together so they share one @codemirror/state
// instance. Otherwise transitive-only packages (e.g. @codemirror/search) can land in a
// separate Vite optimization pass with a duplicate state, which silently breaks their
// extensions — selectionMatch/searchMatch highlighting stops rendering.
const codemirrorDeps = [
	"codemirror",
	"@replit/codemirror-vim",
	"@codemirror/state",
	"@codemirror/view",
	"@codemirror/language",
	"@codemirror/commands",
	"@codemirror/search",
	"@codemirror/autocomplete",
	"@codemirror/lint",
	"@codemirror/collab",
	"@codemirror/merge",
	"@codemirror/language-data",
	"@codemirror/lang-cpp",
	"@codemirror/lang-css",
	"@codemirror/lang-html",
	"@codemirror/lang-java",
	"@codemirror/lang-javascript",
	"@codemirror/lang-json",
	"@codemirror/lang-markdown",
	"@codemirror/lang-php",
	"@codemirror/lang-python",
	"@codemirror/lang-rust",
	"@codemirror/lang-sql",
	"@codemirror/lang-xml",
];

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"#": path.resolve(__dirname, "./"),
			"#shared": path.resolve(__dirname, "../shared"),
			"#docs": path.resolve(__dirname, "../docs"),
		},
		// `optimizeDeps` only fixes dev-server pre-bundling, `dedupe` also covers the production build and actual duplicate installs in node_modules.
		// CodeMirror extensions need to be built against the same @codemirror/state copy as the editor:
		// If a second copy slips in, the affected extensions silently stop working - the app still builds and runs with nothing logged.
		// We had this with @codemirror/search, which is a dep of @codemirror/autocomplete but not the editor itself, so it doesn't get pulled into the same optimization pass by default.
		dedupe: ["@codemirror/state", "@codemirror/view"],
	},
	optimizeDeps: {
		include: codemirrorDeps,
	},
	plugins: [
		tailwindcss(),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
	],
});
