#!/usr/bin/env node
// PostToolUse hook: formats the file Claude Code just wrote with Prettier.
// Exits 0 no matter what — a file Prettier cannot parse is left as it is.

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { relative, isAbsolute } from "node:path";

function readPayload() {
	try {
		return JSON.parse(readFileSync(0, "utf8"));
	} catch {
		return null;
	}
}

const payload = readPayload();
const filePath = payload?.tool_input?.file_path;

if (!filePath || !existsSync(filePath)) {
	process.exit(0);
}

// Stay inside the project — never format a file the hook reached by accident.
const projectRoot = payload?.cwd ?? process.cwd();
const inside = relative(projectRoot, filePath);
if (inside.startsWith("..") || isAbsolute(inside)) {
	process.exit(0);
}

// Ask Prettier whether it knows the file type, and whether .prettierignore
// covers it. Anything else is silently left alone.
const check = spawnSync(
	"npx",
	["--no-install", "prettier", "--file-info", filePath],
	{ cwd: projectRoot, encoding: "utf8", shell: process.platform === "win32" },
);

if (check.status !== 0) {
	process.exit(0);
}

let info;
try {
	info = JSON.parse(check.stdout);
} catch {
	process.exit(0);
}

if (info.ignored || !info.inferredParser) {
	process.exit(0);
}

spawnSync("npx", ["--no-install", "prettier", "--write", filePath], {
	cwd: projectRoot,
	encoding: "utf8",
	shell: process.platform === "win32",
});

process.exit(0);
