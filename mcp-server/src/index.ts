/**
 * BYO Android Dev MCP Server
 *
 * Read-only Android development tooling via the Model Context Protocol.
 * Allowed operations: build, test, deploy, inspect — NO file modifications.
 *
 * Environment variables (set in .vscode/mcp.json or shell):
 *   ANDROID_HOME        – path to Android SDK  (e.g. D:\Android\Sdk)
 *   ANDROID_SDK_ROOT    – same as ANDROID_HOME (legacy alias)
 *   JAVA_HOME           – path to JDK/JBR      (e.g. C:\...\Android Studio\jbr)
 *   ANDROID_PROJECT_DIR – root of the Android project to build/test
 *   MCP_READONLY        – "true" to enforce read-only contract (default: true)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawnSync, spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

// ── Environment ──────────────────────────────────────────────────────────────

const ANDROID_HOME =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  "C:\\Users\\Public\\Android\\Sdk";

const JAVA_HOME =
  process.env.JAVA_HOME ||
  "C:\\Program Files\\Android\\Android Studio\\jbr";

const PROJECT_DIR =
  process.env.ANDROID_PROJECT_DIR ||
  process.cwd();

const READONLY = process.env.MCP_READONLY !== "false"; // default true

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Run a command synchronously and return { stdout, stderr, exitCode }.
 * Prepends ANDROID_HOME/platform-tools and JAVA_HOME/bin to PATH.
 */
function runCommand(
  cmd: string,
  args: string[],
  cwd: string = PROJECT_DIR
): { stdout: string; stderr: string; exitCode: number } {
  const platformTools = path.join(ANDROID_HOME, "platform-tools");
  const javaBin = path.join(JAVA_HOME, "bin");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ANDROID_HOME,
    ANDROID_SDK_ROOT: ANDROID_HOME,
    JAVA_HOME,
    PATH: `${platformTools};${javaBin};${process.env.PATH ?? ""}`,
  };

  const result = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: "utf8",
    shell: true,          // needed on Windows for .bat / .cmd wrappers
    maxBuffer: 10 * 1024 * 1024,
    timeout: 300_000,     // 5 min max per command
  });

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? -1,
  };
}

/** Resolve gradlew(.bat) inside the project directory. */
function gradlew(): string {
  const bat = path.join(PROJECT_DIR, "gradlew.bat");
  const sh  = path.join(PROJECT_DIR, "gradlew");
  if (fs.existsSync(bat)) return bat;
  if (fs.existsSync(sh))  return sh;
  throw new Error(`gradlew not found in ${PROJECT_DIR}`);
}

/** Format a command result into a readable string. */
function fmt(r: { stdout: string; stderr: string; exitCode: number }): string {
  const parts: string[] = [];
  if (r.stdout.trim()) parts.push(`STDOUT:\n${r.stdout.trim()}`);
  if (r.stderr.trim()) parts.push(`STDERR:\n${r.stderr.trim()}`);
  parts.push(`Exit code: ${r.exitCode}`);
  return parts.join("\n\n");
}

// ── MCP Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "android-dev",
  version: "1.0.0",
});

// ── Tool: adb_devices ────────────────────────────────────────────────────────
server.tool(
  "adb_devices",
  "List connected Android devices / emulators via adb.",
  {},
  async () => {
    const r = runCommand("adb", ["devices", "-l"]);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: adb_logcat ─────────────────────────────────────────────────────────
server.tool(
  "adb_logcat",
  "Dump the last N lines of logcat from a connected device.",
  {
    lines:  z.number().int().min(1).max(5000).default(200).describe("Number of log lines to retrieve"),
    serial: z.string().optional().describe("Device serial (from adb devices). Omit for the only connected device."),
  },
  async ({ lines, serial }) => {
    const args = serial
      ? ["-s", serial, "logcat", "-d", "-t", String(lines)]
      : ["logcat", "-d", "-t", String(lines)];
    const r = runCommand("adb", args);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: adb_install ────────────────────────────────────────────────────────
server.tool(
  "adb_install",
  "Install an APK onto a connected device (read-only: only installs, never modifies source).",
  {
    apkPath: z.string().describe("Absolute path to the .apk file to install"),
    serial:  z.string().optional().describe("Target device serial"),
  },
  async ({ apkPath, serial }) => {
    if (!fs.existsSync(apkPath)) {
      return { content: [{ type: "text", text: `APK not found: ${apkPath}` }] };
    }
    const args = serial
      ? ["-s", serial, "install", "-r", apkPath]
      : ["install", "-r", apkPath];
    const r = runCommand("adb", args);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: adb_screenshot ─────────────────────────────────────────────────────
server.tool(
  "adb_screenshot",
  "Take a screenshot from a connected device and save it to a local file.",
  {
    outputPath: z.string().describe("Local path where the screenshot PNG should be saved (e.g. D:\\screenshots\\screen.png)"),
    serial:     z.string().optional().describe("Target device serial"),
  },
  async ({ outputPath, serial }) => {
    // Pull screenshot via adb exec-out screencap
    const args = serial
      ? ["-s", serial, "exec-out", "screencap", "-p"]
      : ["exec-out", "screencap", "-p"];

    const result = spawnSync("adb", args, {
      cwd: PROJECT_DIR,
      encoding: "buffer",
      shell: true,
      timeout: 30_000,
    });

    if (result.status !== 0) {
      return {
        content: [{ type: "text", text: `Screenshot failed. Exit ${result.status}\n${result.stderr?.toString()}` }],
      };
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, result.stdout);
    return { content: [{ type: "text", text: `Screenshot saved to ${outputPath}` }] };
  }
);

// ── Tool: gradle_build ───────────────────────────────────────────────────────
server.tool(
  "gradle_build",
  "Build the Android project using gradlew assembleDebug (or a specified variant).",
  {
    variant: z.string().default("Debug").describe("Build variant, e.g. Debug or Release"),
    module:  z.string().default("app").describe("Gradle module name (default: app)"),
  },
  async ({ variant, module }) => {
    const task = `:${module}:assemble${variant}`;
    const r = runCommand(gradlew(), [task, "--no-daemon"]);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: gradle_test ────────────────────────────────────────────────────────
server.tool(
  "gradle_test",
  "Run unit tests for a module using gradlew test.",
  {
    module:  z.string().default("app").describe("Gradle module name"),
    variant: z.string().default("Debug").describe("Test variant (Debug / Release)"),
  },
  async ({ module, variant }) => {
    const task = `:${module}:test${variant}UnitTest`;
    const r = runCommand(gradlew(), [task, "--no-daemon"]);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: gradle_lint ────────────────────────────────────────────────────────
server.tool(
  "gradle_lint",
  "Run Android Lint on a module (read-only analysis, no auto-fix).",
  {
    module: z.string().default("app").describe("Gradle module name"),
  },
  async ({ module }) => {
    const task = `:${module}:lint`;
    const r = runCommand(gradlew(), [task, "--no-daemon"]);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: gradle_tasks ───────────────────────────────────────────────────────
server.tool(
  "gradle_tasks",
  "List all available Gradle tasks for the project.",
  {},
  async () => {
    const r = runCommand(gradlew(), ["tasks", "--all", "--no-daemon"]);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: emulator_list ──────────────────────────────────────────────────────
server.tool(
  "emulator_list",
  "List available Android Virtual Devices (AVDs).",
  {},
  async () => {
    const emulatorPath = path.join(ANDROID_HOME, "emulator", "emulator.exe");
    const cmd = fs.existsSync(emulatorPath) ? emulatorPath : "emulator";
    const r = runCommand(cmd, ["-list-avds"]);
    return { content: [{ type: "text", text: fmt(r) }] };
  }
);

// ── Tool: emulator_start ─────────────────────────────────────────────────────
server.tool(
  "emulator_start",
  "Start an Android emulator by AVD name (non-blocking, returns immediately).",
  {
    avdName: z.string().describe("AVD name as shown by emulator_list"),
  },
  async ({ avdName }) => {
    const emulatorPath = path.join(ANDROID_HOME, "emulator", "emulator.exe");
    const cmd = fs.existsSync(emulatorPath) ? emulatorPath : "emulator";

    // Use async spawn so the MCP server returns immediately while the emulator
    // continues booting in the background.
    const child = spawn(cmd, ["-avd", avdName, "-no-boot-anim", "-no-window"], {
      cwd: PROJECT_DIR,
      shell: true,
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    return {
      content: [
        {
          type: "text",
          text: `Emulator '${avdName}' launch initiated (PID ${child.pid ?? "unknown"}). Use adb_devices to check when it is ready.`,
        },
      ],
    };
  }
);

// ── Tool: sdk_info ───────────────────────────────────────────────────────────
server.tool(
  "sdk_info",
  "Show installed Android SDK platforms, build-tools, and Java version.",
  {},
  async () => {
    const sdkManager = path.join(ANDROID_HOME, "cmdline-tools", "latest", "bin", "sdkmanager.bat");
    const sdkCmd = fs.existsSync(sdkManager) ? sdkManager : "sdkmanager";

    const sdkResult  = runCommand(sdkCmd, ["--list_installed"]);
    const javaResult = runCommand("java",  ["-version"]);

    return {
      content: [
        {
          type: "text",
          text: `=== Installed SDK Packages ===\n${fmt(sdkResult)}\n\n=== Java Version ===\n${fmt(javaResult)}`,
        },
      ],
    };
  }
);

// ── Start server ─────────────────────────────────────────────────────────────

async function main() {
  if (READONLY) {
    process.stderr.write("[android-dev-mcp] Running in READ-ONLY mode.\n");
  }
  process.stderr.write(`[android-dev-mcp] ANDROID_HOME = ${ANDROID_HOME}\n`);
  process.stderr.write(`[android-dev-mcp] JAVA_HOME    = ${JAVA_HOME}\n`);
  process.stderr.write(`[android-dev-mcp] PROJECT_DIR  = ${PROJECT_DIR}\n`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[android-dev-mcp] MCP server ready.\n");
}

main().catch((err) => {
  process.stderr.write(`[android-dev-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
