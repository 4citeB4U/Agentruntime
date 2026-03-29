import { spawn } from "node:child_process";
import path from "node:path";
import { AndroidMcpConfig, redactSecrets } from "./config.js";

export interface RunOptions {
  /** Working directory for the command */
  cwd?: string;
  /** Environment variables to merge with the current env */
  env?: Record<string, string>;
  /** Timeout override in ms (falls back to config.commandTimeoutMs) */
  timeoutMs?: number;
  /** When true, stdin is ignored and stdout/stderr are captured as strings */
  captureOutput?: boolean;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

/**
 * Validates that `cwd` is within one of the allowed working directories
 * listed in config.workingDirectories. If the list is empty, all paths
 * are permitted.
 */
export function assertAllowedCwd(
  cwd: string,
  config: AndroidMcpConfig
): void {
  if (config.workingDirectories.length === 0) return;
  const abs = path.resolve(cwd);
  const sep = path.sep;
  const allowed = config.workingDirectories.some((dir) => {
    const resolvedDir = path.resolve(dir);
    return (
      abs === resolvedDir ||
      abs.startsWith(resolvedDir + sep)
    );
  });
  if (!allowed) {
    throw new Error(
      `Working directory "${abs}" is not in the allowed list. ` +
        `Allowed: ${config.workingDirectories.join(", ")}`
    );
  }
}

/**
 * Runs a command safely:
 * - enforces cwd restriction
 * - applies a timeout
 * - captures and redacts secrets from output
 */
export async function run(
  cmd: string,
  args: string[],
  config: AndroidMcpConfig,
  options: RunOptions = {}
): Promise<RunResult> {
  const cwd = options.cwd ?? process.cwd();
  assertAllowedCwd(cwd, config);

  const timeoutMs = options.timeoutMs ?? config.commandTimeoutMs;

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...(options.env ?? {}),
  };

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(cmd, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false, // Never use shell — prevents injection
    });

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL");
      }, 3_000);
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout: redactSecrets(stdout, config),
        stderr: redactSecrets(stderr, config),
        exitCode: code ?? -1,
        timedOut,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: redactSecrets(err.message, config),
        exitCode: -1,
        timedOut: false,
      });
    });
  });
}

/** Formats a RunResult into a human-readable string for MCP tool output */
export function formatResult(result: RunResult): string {
  const parts: string[] = [];
  if (result.timedOut) parts.push("⚠️  Command timed out.");
  if (result.stdout.trim()) parts.push(result.stdout.trim());
  if (result.stderr.trim()) parts.push(`STDERR:\n${result.stderr.trim()}`);
  if (result.exitCode !== 0)
    parts.push(`Exit code: ${result.exitCode}`);
  return parts.join("\n\n") || "(no output)";
}
