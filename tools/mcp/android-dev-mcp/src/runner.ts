/**
 * Safe command runner for the Android Dev MCP server.
 *
 * Design goals:
 *  - Explicit denylist of write-dangerous commands (git commit/push, file editing, etc.)
 *  - Configurable timeout (default 120 s)
 *  - Full stdout/stderr capture
 *  - Arguments are passed as an array (never concatenated into a shell string)
 *    so there is no shell injection surface
 */
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export interface RunOptions {
  /** Absolute path to the working directory */
  cwd: string;
  /** Environment variable overrides (merged with sanitized process.env) */
  env?: Record<string, string>;
  /** Timeout in milliseconds (default: 120 000) */
  timeoutMs?: number;
  /** Maximum output buffer in bytes (default: 10 MB) */
  maxBuffer?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Commands (first token) that are unconditionally denied.
 * These are write-dangerous or out-of-scope operations.
 */
const DENIED_EXECUTABLES = new Set([
  "git",
  "rm",
  "del",
  "rmdir",
  "rd",
  "mv",
  "move",
  "cp",
  "copy",
  "xcopy",
  "robocopy",
  "format",
  "mkfs",
  "dd",
  "wget",
  "curl",
  "powershell",
  "pwsh",
  "cmd",
  "bash",
  "sh",
  "python",
  "python3",
  "pip",
  "npm",
  "npx",
  "node",
  "reg",
  "regedit",
  "sc",
  "net",
  "netsh",
  "attrib",
  "icacls",
  "takeown",
]);

/**
 * Specific (executable, arg) pairs that are denied even if the executable
 * itself is allowed in some contexts.
 * Key: lower-cased executable basename (without extension), Value: regex on joined args
 */
const DENIED_ARG_PATTERNS: Array<{ exec: string; pattern: RegExp }> = [
  // adb commands that write to device in unexpected ways – we allow push/pull explicitly via tools
  // but block shell writes
  { exec: "adb", pattern: /\bshell\b.*\b(rm|mv|cp|chmod|chown|dd|mkfs|format)\b/i },
  // Gradle tasks that modify source/git state
  {
    exec: "gradlew",
    pattern: /\b(spotlessApply|ktlintFormat|formatKotlin|checkstyleMain|generateCode)\b/i,
  },
  { exec: "gradlew.bat", pattern: /\b(spotlessApply|ktlintFormat|formatKotlin)\b/i },
];

/**
 * Validates that the command is not in the denylist.
 * Throws an error if the command is denied.
 */
export function assertCommandAllowed(executable: string, args: string[]): void {
  // Extract basename handling both Unix "/" and Windows "\" separators cross-platform
  const normalized = executable.replace(/\\/g, "/");
  const base = path.basename(normalized).replace(/\.(exe|bat|cmd)$/i, "").toLowerCase();

  if (DENIED_EXECUTABLES.has(base)) {
    throw new Error(
      `Command "${base}" is not allowed by the read-only MCP policy. ` +
        `Allowed tools: adb, gradlew, emulator, apksigner, bundletool, aapt2, maestro.`
    );
  }

  for (const rule of DENIED_ARG_PATTERNS) {
    if (rule.exec === base && rule.pattern.test(args.join(" "))) {
      throw new Error(
        `Command "${base} ${args.join(" ")}" is blocked by the MCP safety policy.`
      );
    }
  }
}

/**
 * Builds a sanitized environment for the child process.
 * Strips variables that could be used to override critical paths.
 */
function buildEnv(
  overrides: Record<string, string>,
  androidSdkRoot: string,
  javaHome: string
): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = {};

  // Copy safe vars from current process environment
  const SAFE_PASS_THROUGH = [
    "PATH",
    "PATHEXT",
    "TEMP",
    "TMP",
    "SYSTEMROOT",
    "SYSTEMDRIVE",
    "WINDIR",
    "LOCALAPPDATA",
    "APPDATA",
    "USERPROFILE",
    "USERNAME",
    "COMPUTERNAME",
    "PROCESSOR_ARCHITECTURE",
    "NUMBER_OF_PROCESSORS",
    "OS",
    "GRADLE_USER_HOME",
    "GRADLE_OPTS",
    "ANDROID_HOME", // legacy compat
  ];

  for (const key of SAFE_PASS_THROUGH) {
    if (process.env[key] !== undefined) {
      base[key] = process.env[key]!;
    }
  }

  // Enforce SDK and Java paths from config
  base["ANDROID_SDK_ROOT"] = androidSdkRoot;
  base["ANDROID_HOME"] = androidSdkRoot;
  base["JAVA_HOME"] = javaHome;

  // Prepend platform-tools to PATH so adb is always found
  const platformTools = path.join(androidSdkRoot, "platform-tools");
  const emulatorDir = path.join(androidSdkRoot, "emulator");
  const pathSep = os.platform() === "win32" ? ";" : ":";
  base["PATH"] = `${platformTools}${pathSep}${emulatorDir}${pathSep}${base["PATH"] ?? ""}`;

  // Apply caller overrides last (but never allow overriding JAVA_HOME or SDK root)
  for (const [k, v] of Object.entries(overrides)) {
    const upper = k.toUpperCase();
    if (upper === "JAVA_HOME" || upper === "ANDROID_SDK_ROOT" || upper === "ANDROID_HOME") {
      continue; // silently ignore attempts to override these
    }
    base[k] = v;
  }

  return base;
}

/**
 * Runs an executable with the given args in the specified working directory.
 * This is the single safe entry-point for all CLI calls in the MCP server.
 */
export async function run(
  executable: string,
  args: string[],
  options: RunOptions & { androidSdkRoot: string; javaHome: string }
): Promise<RunResult> {
  assertCommandAllowed(executable, args);

  const timeoutMs = options.timeoutMs ?? 120_000;
  const maxBuffer = options.maxBuffer ?? 10 * 1024 * 1024;
  const env = buildEnv(options.env ?? {}, options.androidSdkRoot, options.javaHome);

  try {
    const { stdout, stderr } = await execFileAsync(executable, args, {
      cwd: options.cwd,
      env,
      timeout: timeoutMs,
      maxBuffer,
      windowsHide: true,
    });
    return { stdout: stdout ?? "", stderr: stderr ?? "", exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean };
    const exitCode = typeof e.code === "number" ? e.code : 1;
    const stdout = e.stdout ?? "";
    const stderr = e.stderr ?? (e.killed ? "Process timed out." : String(err));
    return { stdout, stderr, exitCode };
  }
}
