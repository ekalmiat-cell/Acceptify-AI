#!/usr/bin/env node
// Runs the frontend and backend dev servers together, prefixing their
// output. Pure Node built-ins only — no root-level dependency (like
// concurrently) needed just to fan out two processes.

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === "win32";

const backendPython = isWindows
  ? path.join(rootDir, "backend", ".venv", "Scripts", "python.exe")
  : path.join(rootDir, "backend", ".venv", "bin", "python");

const children = [];

function run(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWindows,
  });
  const prefix = `[${name}] `;

  child.stdout.on("data", (chunk) => process.stdout.write(prefix + chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(prefix + chunk));
  child.on("exit", (code) => {
    console.log(`${prefix}exited with code ${code}`);
  });

  children.push(child);
  return child;
}

run("frontend", isWindows ? "npm.cmd" : "npm", ["run", "dev"], path.join(rootDir, "frontend"));
run(
  "backend",
  backendPython,
  ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
  path.join(rootDir, "backend")
);

function shutdown() {
  for (const child of children) {
    child.kill();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
