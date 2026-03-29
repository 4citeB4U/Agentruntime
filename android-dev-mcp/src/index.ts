#!/usr/bin/env node
/**
 * Android Dev MCP Server — index.ts
 *
 * A Windows-first, offline, read-only BYO Android Dev MCP server.
 * Exposes tools for VS Code Copilot Chat to:
 *   • health_check        – verify adb / java / gradlew are available
 *   • list_devices        – adb devices (show connected/authorised devices)
 *   • build_debug_apk     – gradlew.bat assembleDebug inside a given project
 *   • install_apk         – adb install <apk>
 *   • launch_app          – adb shell am start -n <package>/<activity>
 *   • logcat              – stream logcat output (optionally filtered)
 *
 * Configuration is supplied via environment variables; the server also
 * accepts per-call overrides so callers can supply paths for projects
 * stored on D:\ or any other drive.
 *
 * Safety: this server NEVER modifies source files or git state.
 */

import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  adbPath,
  buildEnvSummary,
  detectAndroidSdkRoot,
  detectJavaHome,
  gradlewPath,
  javaPath,
} from "./sdk-detector.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Run a command synchronously and return { stdout, stderr, ok }. */
function run(
  cmd: string,
  args: string[],
  cwd?: string,
  env?: NodeJS.ProcessEnv
): { stdout: string; stderr: string; ok: boolean } {
  try {
    // Quote the executable path to handle spaces (e.g. "C:\Program Files\...")
    const quoted = cmd.includes(" ") ? `"${cmd}"` : cmd;
    const full = [quoted, ...args.map((a) => (a.includes(" ") ? `"${a}"` : a))].join(" ");
    const result = execSync(full, {
      cwd,
      env: { ...process.env, ...env },
      encoding: "utf8",
      windowsHide: true,
      timeout: 120_000,
    });
    return { stdout: result, stderr: "", ok: true };
  } catch (e: unknown) {
    const err = e as { stdout?: string | Buffer; stderr?: string | Buffer };
    return {
      stdout: (err.stdout ?? "").toString(),
      stderr: (err.stderr ?? String(e)).toString(),
      ok: false,
    };
  }
}

/** Resolve effective ADB path (env override → auto-detect → PATH fallback). */
function resolveAdb(sdkRootOverride?: string): string {
  if (sdkRootOverride) return adbPath(sdkRootOverride);
  return adbPath(detectAndroidSdkRoot());
}

/** Resolve effective Java path. */
function resolveJava(javaHomeOverride?: string): string {
  if (javaHomeOverride) return javaPath(javaHomeOverride);
  return javaPath(detectJavaHome());
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: "android-dev-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── List available tools ─────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health_check",
      description:
        "Verify the Android development environment: checks that adb, java, and (optionally) gradlew are reachable. Returns detected SDK/JDK paths and any missing tool warnings.",
      inputSchema: {
        type: "object",
        properties: {
          projectRoot: {
            type: "string",
            description:
              "Absolute path to the Android project root (e.g. D:\\my-app). Optional – used only to verify gradlew.bat is present.",
          },
          sdkRoot: {
            type: "string",
            description:
              "Override for ANDROID_SDK_ROOT. Leave empty for auto-detection.",
          },
          javaHome: {
            type: "string",
            description:
              "Override for JAVA_HOME. Leave empty for auto-detection (prefers Android Studio JBR).",
          },
        },
      },
    },
    {
      name: "list_devices",
      description:
        "Run `adb devices` to list all connected Android devices and emulators. Returns serial numbers, states (device/offline/unauthorized), and model info.",
      inputSchema: {
        type: "object",
        properties: {
          sdkRoot: {
            type: "string",
            description: "Override for ANDROID_SDK_ROOT.",
          },
        },
      },
    },
    {
      name: "build_debug_apk",
      description:
        "Build a debug APK using the project's gradlew.bat wrapper. Runs `gradlew.bat assembleDebug` in the given project root. Returns build output and the path of the produced APK on success.",
      inputSchema: {
        type: "object",
        required: ["projectRoot"],
        properties: {
          projectRoot: {
            type: "string",
            description:
              "Absolute path to the Android project root that contains gradlew.bat (e.g. D:\\agent-lee-voxel-os\\agent-lee-android).",
          },
          module: {
            type: "string",
            description:
              "Gradle module to build, e.g. ':app'. Defaults to ':app:assembleDebug'.",
          },
          javaHome: {
            type: "string",
            description: "Override for JAVA_HOME.",
          },
          sdkRoot: {
            type: "string",
            description: "Override for ANDROID_SDK_ROOT.",
          },
        },
      },
    },
    {
      name: "install_apk",
      description:
        "Install an APK on a connected device using `adb install`. Returns success or error output.",
      inputSchema: {
        type: "object",
        required: ["apkPath"],
        properties: {
          apkPath: {
            type: "string",
            description:
              "Absolute path to the APK file to install (e.g. D:\\my-app\\app\\build\\outputs\\apk\\debug\\app-debug.apk).",
          },
          deviceSerial: {
            type: "string",
            description:
              "Target device serial (from list_devices). Omit to use the only connected device.",
          },
          replaceExisting: {
            type: "boolean",
            description:
              "Pass -r to allow reinstall over an existing app. Defaults to true.",
          },
          sdkRoot: {
            type: "string",
            description: "Override for ANDROID_SDK_ROOT.",
          },
        },
      },
    },
    {
      name: "launch_app",
      description:
        "Launch an installed app on a connected device using `adb shell am start`.",
      inputSchema: {
        type: "object",
        required: ["packageName", "activityName"],
        properties: {
          packageName: {
            type: "string",
            description: "App package name, e.g. com.example.agentlee.",
          },
          activityName: {
            type: "string",
            description:
              "Activity to launch, e.g. .MainActivity. Use fully-qualified name or short form with leading dot.",
          },
          deviceSerial: {
            type: "string",
            description: "Target device serial. Omit for single device.",
          },
          sdkRoot: {
            type: "string",
            description: "Override for ANDROID_SDK_ROOT.",
          },
        },
      },
    },
    {
      name: "logcat",
      description:
        "Capture logcat output from a connected device for a fixed duration. Returns the captured log lines. Useful for debugging crashes and app startup issues.",
      inputSchema: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description:
              "Logcat filter expression, e.g. '*:E' for errors only, or 'AgentLee:V *:S' for a specific tag. Defaults to '*:V'.",
          },
          durationSeconds: {
            type: "number",
            description:
              "How many seconds to collect logcat output. Defaults to 10.",
          },
          deviceSerial: {
            type: "string",
            description: "Target device serial. Omit for single device.",
          },
          sdkRoot: {
            type: "string",
            description: "Override for ANDROID_SDK_ROOT.",
          },
          clearFirst: {
            type: "boolean",
            description:
              "Clear the logcat buffer before capturing. Defaults to true.",
          },
        },
      },
    },
  ],
}));

// ── Tool implementations ─────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;

  // ── health_check ──────────────────────────────────────────────────────────
  if (name === "health_check") {
    const summary = buildEnvSummary({
      sdkRoot: a.sdkRoot as string | undefined,
      javaHome: a.javaHome as string | undefined,
    });

    const lines: string[] = [
      "=== Android Dev MCP — Environment Health Check ===",
      "",
      `ANDROID_SDK_ROOT : ${summary.androidSdkRoot ?? "❌ NOT DETECTED"}`,
      `JAVA_HOME        : ${summary.javaHome ?? "❌ NOT DETECTED"}`,
      `adb path         : ${summary.adb}`,
      `java path        : ${summary.java}`,
      `adb reachable    : ${summary.adbOnPath ? "✅ YES" : "❌ NO"}`,
      `java reachable   : ${summary.javaOnPath ? "✅ YES" : "❌ NO"}`,
    ];

    const projectRoot = a.projectRoot as string | undefined;
    if (projectRoot) {
      const gwPath = gradlewPath(projectRoot);
      const gwExists = fs.existsSync(gwPath);
      lines.push(`gradlew.bat      : ${gwExists ? `✅ ${gwPath}` : `❌ NOT FOUND at ${gwPath}`}`);
    }

    const issues: string[] = [];
    if (!summary.androidSdkRoot)
      issues.push(
        "• ANDROID_SDK_ROOT not found. Set env var or pass sdkRoot override."
      );
    if (!summary.adbOnPath)
      issues.push(
        "• adb not reachable. Ensure Android SDK platform-tools is installed."
      );
    if (!summary.javaHome)
      issues.push(
        "• JAVA_HOME not found. Set env var or pass javaHome override."
      );
    if (!summary.javaOnPath)
      issues.push("• java not reachable. Install Android Studio (includes JBR).");

    if (issues.length) {
      lines.push("", "⚠️  Issues found:", ...issues);
      lines.push(
        "",
        "Tip: Run setup.ps1 in the android-dev-mcp folder to configure paths automatically."
      );
    } else {
      lines.push("", "✅ Environment looks good!");
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // ── list_devices ──────────────────────────────────────────────────────────
  if (name === "list_devices") {
    const adb = resolveAdb(a.sdkRoot as string | undefined);
    const result = run(adb, ["devices", "-l"]);
    if (!result.ok && !result.stdout) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to run adb: ${result.stderr}\n\nTroubleshooting:\n• Run health_check to verify adb path\n• Ensure USB debugging is enabled on your device\n• Run 'adb kill-server && adb start-server' if devices don't appear`,
          },
        ],
      };
    }

    const output = result.stdout.trim();
    const lines = output.split("\n").filter(Boolean);
    const deviceLines = lines.slice(1); // skip "List of devices attached"
    const unauthorized = deviceLines.filter((l) => l.includes("unauthorized"));
    const offline = deviceLines.filter((l) => l.includes("offline"));
    const online = deviceLines.filter(
      (l) => l.includes("device") && !l.includes("unauthorized") && !l.includes("offline")
    );

    const parts: string[] = [
      `=== ADB Devices ===`,
      output,
      "",
      `Online: ${online.length}  |  Unauthorized: ${unauthorized.length}  |  Offline: ${offline.length}`,
    ];

    if (unauthorized.length > 0) {
      parts.push(
        "",
        "⚠️  Unauthorized device(s) detected.",
        "Fix: Unlock your phone → find the 'Allow USB debugging?' dialog → tap OK.",
        "If no dialog appears, try: adb kill-server && adb start-server"
      );
    }
    if (offline.length > 0) {
      parts.push(
        "",
        "⚠️  Offline device(s) detected. Try reconnecting the USB cable or restarting adb."
      );
    }
    if (online.length === 0 && deviceLines.length === 0) {
      parts.push(
        "",
        "No devices found. Make sure:",
        "  1. USB debugging is ON (Settings → Developer Options → USB Debugging)",
        "  2. The USB cable supports data transfer (not charge-only)",
        "  3. Your PC has the correct USB driver installed"
      );
    }

    return { content: [{ type: "text", text: parts.join("\n") }] };
  }

  // ── build_debug_apk ───────────────────────────────────────────────────────
  if (name === "build_debug_apk") {
    const projectRoot = a.projectRoot as string;
    if (!projectRoot) {
      return {
        content: [{ type: "text", text: "❌ projectRoot is required." }],
      };
    }

    const gwPath = gradlewPath(projectRoot);
    if (!fs.existsSync(gwPath)) {
      return {
        content: [
          {
            type: "text",
            text: [
              `❌ gradlew.bat not found at: ${gwPath}`,
              "",
              "Troubleshooting:",
              "• Verify the projectRoot path is correct",
              "• Make sure you are pointing to the root of the Android project (the folder containing gradlew.bat)",
              `• If your path contains spaces, wrap it in quotes: e.g. "D:\\my projects\\agent-lee-android"`,
            ].join("\n"),
          },
        ],
      };
    }

    const module = (a.module as string | undefined) ?? ":app";
    const task = `${module}:assembleDebug`;

    const extraEnv: NodeJS.ProcessEnv = {};
    const javaHome = a.javaHome as string | undefined;
    if (javaHome) extraEnv.JAVA_HOME = javaHome;
    else if (detectJavaHome()) extraEnv.JAVA_HOME = detectJavaHome()!;
    const sdkRoot = a.sdkRoot as string | undefined;
    if (sdkRoot) extraEnv.ANDROID_SDK_ROOT = sdkRoot;
    else if (detectAndroidSdkRoot()) extraEnv.ANDROID_SDK_ROOT = detectAndroidSdkRoot()!;

    const result = run(gwPath, [task, "--stacktrace"], projectRoot, extraEnv);

    const lines: string[] = [
      result.ok ? "✅ Build succeeded" : "❌ Build failed",
      "",
      "=== Build Output ===",
      result.stdout || "(no stdout)",
    ];
    if (result.stderr) {
      lines.push("", "=== stderr ===", result.stderr);
    }

    if (result.ok) {
      // Try to locate the APK
      const apkSearch = path.join(
        projectRoot,
        "app",
        "build",
        "outputs",
        "apk",
        "debug",
        "app-debug.apk"
      );
      if (fs.existsSync(apkSearch)) {
        lines.push("", `APK location: ${apkSearch}`);
        lines.push(
          "Next step: use install_apk with this path to deploy to your device."
        );
      }
    } else {
      lines.push(
        "",
        "Common causes:",
        "• JAVA_HOME not set correctly — run health_check",
        "• ANDROID_SDK_ROOT not set — run health_check",
        "• Missing SDK components — open Android Studio → SDK Manager and install required platforms",
        "• Path with spaces: ensure gradlew.bat path does not contain unquoted spaces"
      );
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // ── install_apk ───────────────────────────────────────────────────────────
  if (name === "install_apk") {
    const apkPath = a.apkPath as string;
    if (!apkPath) {
      return { content: [{ type: "text", text: "❌ apkPath is required." }] };
    }
    if (!fs.existsSync(apkPath)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ APK not found at: ${apkPath}\nBuild it first with build_debug_apk.`,
          },
        ],
      };
    }

    const adb = resolveAdb(a.sdkRoot as string | undefined);
    const deviceArgs = a.deviceSerial
      ? ["-s", a.deviceSerial as string]
      : [];
    const replaceFlag = a.replaceExisting !== false ? ["-r"] : [];
    const result = run(adb, [...deviceArgs, "install", ...replaceFlag, apkPath]);

    const lines: string[] = [
      result.ok && result.stdout.includes("Success")
        ? "✅ APK installed successfully"
        : "❌ Installation failed",
      "",
      result.stdout || "(no output)",
    ];
    if (result.stderr) lines.push("", "stderr:", result.stderr);

    if (!result.ok || !result.stdout.includes("Success")) {
      lines.push(
        "",
        "Troubleshooting:",
        "• Run list_devices to confirm a device is connected and authorized",
        "• If you see INSTALL_FAILED_UPDATE_INCOMPATIBLE, uninstall the old version first",
        "• If device shows unauthorized, approve USB debugging on the phone screen"
      );
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // ── launch_app ────────────────────────────────────────────────────────────
  if (name === "launch_app") {
    const packageName = a.packageName as string;
    const activityName = a.activityName as string;
    if (!packageName || !activityName) {
      return {
        content: [
          { type: "text", text: "❌ packageName and activityName are required." },
        ],
      };
    }

    const adb = resolveAdb(a.sdkRoot as string | undefined);
    const deviceArgs = a.deviceSerial
      ? ["-s", a.deviceSerial as string]
      : [];

    // Resolve fully qualified activity name
    const activity = activityName.startsWith(".")
      ? `${packageName}${activityName}`
      : activityName;

    const result = run(adb, [
      ...deviceArgs,
      "shell",
      "am",
      "start",
      "-n",
      `${packageName}/${activity}`,
    ]);

    const lines: string[] = [
      result.ok ? "✅ App launch command sent" : "❌ Launch failed",
      "",
      result.stdout || "(no output)",
    ];
    if (result.stderr) lines.push("", "stderr:", result.stderr);

    if (!result.ok) {
      lines.push(
        "",
        "Troubleshooting:",
        `• Confirm the package name: ${packageName}`,
        `• Confirm the activity: ${activity}`,
        "• Make sure the APK is installed — run install_apk first",
        "• Run list_devices to verify the device is ready"
      );
    } else {
      lines.push("", `Launched: ${packageName}/${activity}`);
      lines.push("Tip: run logcat to stream live log output from your app.");
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // ── logcat ────────────────────────────────────────────────────────────────
  if (name === "logcat") {
    const adb = resolveAdb(a.sdkRoot as string | undefined);
    const deviceArgs = a.deviceSerial
      ? ["-s", a.deviceSerial as string]
      : [];
    const filter = (a.filter as string | undefined) ?? "*:V";
    const durationSeconds = Math.min(
      Math.max(Number(a.durationSeconds ?? 10), 1),
      60
    );
    const clearFirst = a.clearFirst !== false;

    // Clear buffer first if requested
    if (clearFirst) {
      run(adb, [...deviceArgs, "logcat", "-c"]);
    }

    // Spawn logcat and collect for durationSeconds
    return new Promise((resolve) => {
      const adbCmd = adb.includes(" ") ? `"${adb}"` : adb;
      const logcatArgs = [
        ...deviceArgs,
        "logcat",
        "-v",
        "time",
        filter,
      ];

      let output = "";
      const proc = spawn(adbCmd, logcatArgs, {
        shell: true,
        env: process.env,
      });

      proc.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });
      proc.stderr.on("data", (data: Buffer) => {
        output += `[stderr] ${data.toString()}`;
      });

      setTimeout(() => {
        proc.kill();
        const lines = output.trim().split("\n");
        const summary = [
          `=== Logcat (${durationSeconds}s, filter: ${filter}) ===`,
          `Captured ${lines.length} lines`,
          "",
          output.trim() || "(no output — is the device connected?)",
          "",
          "Tip: Use a specific filter like 'AgentLee:V *:S' to reduce noise.",
          "     Run logcat with clearFirst:true and launch the app first for clean startup logs.",
        ].join("\n");

        resolve({ content: [{ type: "text", text: summary }] });
      }, durationSeconds * 1000);
    });
  }

  // ── Unknown tool ─────────────────────────────────────────────────────────
  return {
    content: [{ type: "text", text: `❌ Unknown tool: ${name}` }],
  };
});

// ─── Start server ─────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
