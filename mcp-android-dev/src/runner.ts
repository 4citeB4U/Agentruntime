/**
 * runner.ts — Safe subprocess runner for Windows
 *
 * All commands are executed via `cmd /C` to ensure correct Windows
 * PATH and environment variable expansion.  Stdout/stderr are
 * captured and returned; process exit codes are checked.
 *
 * SECURITY NOTE: This module intentionally does NOT accept raw shell
 * strings from tool inputs.  Every call site constructs the args array
 * from validated, allow-listed values, so injection through user-
 * supplied strings is not possible.
 */

import { spawn } from "child_process";
import { buildEnv } from "./config.js";

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Run a command with an explicit argument list (no shell expansion of
 * untrusted input).
 *
 * @param executable  The program to run (e.g. "gradlew.bat", "adb.exe").
 * @param args        Positional arguments.  These come from validated
 *                    allow-listed sources, NOT raw user input.
 * @param cwd         Working directory.
 * @param timeoutMs   Kill the process after this many milliseconds.
 */
export async function run(
  executable: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const env = buildEnv();

    // On Windows we wrap via cmd /C so that .bat files and PATH
    // resolution work correctly.
    const child = spawn("cmd", ["/C", executable, ...args], {
      cwd,
      env,
      shell: false, // explicit cmd /C — no additional shell interpolation
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
