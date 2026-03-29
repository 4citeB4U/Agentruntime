/**
 * runner.ts – Safe CLI runner
 *
 * Wraps child_process.spawn to:
 *  - Never use a shell (avoids shell-injection on all platforms)
 *  - Enforce a configurable timeout via AbortController
 *  - Capture stdout + stderr without leaking secrets into logs
 *  - Reject dangerous write-capable commands by name
 */

import { spawn } from "node:child_process";

export interface RunOptions {
  /** Working directory for the subprocess */
  cwd?: string;
  /** Environment variable overrides/additions */
  env?: NodeJS.ProcessEnv;
  /** Milliseconds before the process is killed (default: 120 000) */
  timeoutMs?: number;
  /** Maximum bytes of combined stdout/stderr to capture (default: 4 MB) */
  maxOutputBytes?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

/**
 * Commands that are explicitly denied even if they appear as the first argument.
 * This is a last-resort safety net; the tool layer enforces the read-only contract.
 */
const DENIED_EXECUTABLES = new Set([
  "rm", "del", "rmdir", "rd", "format",
  "git", "svn", "hg",          // no VCS mutations allowed
  "powershell", "pwsh", "cmd", // no shell-within-shell
  "python", "python3", "py",   // no arbitrary scripting
  "node", "npm", "npx", "yarn",
]);

/**
 * Run an executable with an explicit argument array (no shell expansion).
 *
 * @param executable  Absolute path or PATH-resolved executable name
 * @param args        Argument list – each element is treated as a literal string
 * @param options     RunOptions
 */
export async function run(
  executable: string,
  args: string[],
  options: RunOptions = {}
): Promise<RunResult> {
  const execName = executable.split(/[\\/]/).pop()?.toLowerCase().replace(/\.(exe|bat|cmd)$/, "") ?? "";
  if (DENIED_EXECUTABLES.has(execName)) {
    throw new Error(`Execution of "${execName}" is denied by the MCP server safety policy.`);
  }

  const timeoutMs = options.timeoutMs ?? 120_000;
  const maxOutputBytes = options.maxOutputBytes ?? 4 * 1024 * 1024; // 4 MB

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...options.env,
  };

  return new Promise<RunResult>((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let timedOut = false;

    const child = spawn(executable, args, {
      cwd: options.cwd,
      env,
      shell: false,           // IMPORTANT: no shell – prevents injection
      stdio: ["ignore", "pipe", "pipe"],
      signal: controller.signal,
      windowsHide: true,
    });

    const onData = (chunk: Buffer) => {
      if (totalBytes < maxOutputBytes) {
        chunks.push(chunk);
        totalBytes += chunk.length;
      }
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("close", (code) => {
      clearTimeout(timer);
      // Both stdout and stderr are merged into a single output string for
      // simplicity; the caller receives everything in `stdout`.
      resolve({
        stdout: Buffer.concat(chunks).toString("utf-8"),
        stderr: "",
        exitCode: code,
        timedOut,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === "ERR_ABORT") {
        timedOut = true;
        resolve({
          stdout: Buffer.concat(chunks).toString("utf-8"),
          stderr: `Process timed out after ${timeoutMs}ms`,
          exitCode: null,
          timedOut: true,
        });
      } else {
        resolve({
          stdout: "",
          stderr: err.message,
          exitCode: -1,
          timedOut: false,
        });
      }
    });
  });
}

/**
 * Run a command and return a formatted result string for MCP tool responses.
 */
export async function runFormatted(
  executable: string,
  args: string[],
  options: RunOptions = {}
): Promise<string> {
  const result = await run(executable, args, options);
  const parts: string[] = [];

  if (result.stdout.trim()) parts.push(`stdout:\n${result.stdout.trim()}`);
  if (result.stderr.trim()) parts.push(`stderr:\n${result.stderr.trim()}`);
  if (result.timedOut) parts.push("⚠ Process timed out.");
  parts.push(`exit code: ${result.exitCode ?? "null"}`);

  return parts.join("\n\n");
}
