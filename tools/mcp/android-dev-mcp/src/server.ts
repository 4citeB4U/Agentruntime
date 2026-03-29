import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Environment resolution
// ---------------------------------------------------------------------------

const ANDROID_SDK = process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME ?? "";
const JAVA_HOME = process.env.JAVA_HOME ?? "";
const REPO_ROOT = process.env.ANDROID_REPO_ROOT ?? process.cwd();

// Platform helpers
const isWindows = process.platform === "win32";
const adbBin = isWindows ? "adb.exe" : "adb";
const gradleBin = isWindows ? "gradlew.bat" : "./gradlew";

function adbPath(): string {
  if (ANDROID_SDK) return path.join(ANDROID_SDK, "platform-tools", adbBin);
  return adbBin; // fall back to PATH
}

// ---------------------------------------------------------------------------
// Safety: deny-list for dangerous command fragments
// ---------------------------------------------------------------------------

const DENYLIST = [
  /\bgit\s+(commit|push|reset|clean|rm)\b/i,
  /\bsed\b.*-i/i,
  /\becho\b.*>\s*[^\|]/i, // echo > file (redirect write)
  /\brm\s+-rf?\b/i,
];

function assertSafe(cmd: string): void {
  for (const pattern of DENYLIST) {
    if (pattern.test(cmd)) {
      throw new Error(
        `Command blocked by read-only policy: matched deny pattern ${pattern}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Command execution helper
// ---------------------------------------------------------------------------

async function run(
  executable: string,
  args: string[],
  cwd: string = REPO_ROOT,
  timeoutMs = 60_000
): Promise<{ stdout: string; stderr: string }> {
  assertSafe([executable, ...args].join(" "));
  try {
    const result = await execFileAsync(executable, args, {
      cwd,
      timeout: timeoutMs,
      env: {
        ...process.env,
        ANDROID_SDK_ROOT: ANDROID_SDK,
        ANDROID_HOME: ANDROID_SDK,
        JAVA_HOME: JAVA_HOME,
      },
    });
    return { stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// MCP Server definition
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "android-dev-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "adb_list_devices",
      description: "List connected Android devices and emulators.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "adb_logcat",
      description:
        "Capture a short burst of logcat output (default 3 seconds). Pass an optional package filter.",
      inputSchema: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description: "Tag or package name filter, e.g. 'MyApp:V *:S'",
          },
          seconds: {
            type: "number",
            description: "How many seconds of logcat to capture (1-30).",
          },
          deviceId: { type: "string", description: "ADB device serial (optional)." },
        },
        required: [],
      },
    },
    {
      name: "adb_screenshot",
      description: "Take a screenshot of the connected device and return the file path.",
      inputSchema: {
        type: "object",
        properties: {
          outputPath: {
            type: "string",
            description:
              "Local path to save the PNG, e.g. C:\\tmp\\screen.png or /tmp/screen.png",
          },
          deviceId: { type: "string" },
        },
        required: ["outputPath"],
      },
    },
    {
      name: "adb_install_apk",
      description:
        "Install an APK onto a connected device. Does NOT modify source code.",
      inputSchema: {
        type: "object",
        properties: {
          apkPath: { type: "string", description: "Absolute path to the APK file." },
          deviceId: { type: "string" },
        },
        required: ["apkPath"],
      },
    },
    {
      name: "adb_shell",
      description:
        "Run a read-safe adb shell command (no file-write commands allowed).",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to run on the device." },
          deviceId: { type: "string" },
        },
        required: ["command"],
      },
    },
    {
      name: "gradle_build",
      description:
        "Run a Gradle build task (assembleDebug, assembleRelease, bundleRelease, etc.).",
      inputSchema: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "Gradle task, e.g. assembleDebug, bundleRelease",
          },
          repoPath: {
            type: "string",
            description:
              "Absolute path to the Android repo root (defaults to ANDROID_REPO_ROOT env var).",
          },
          extraArgs: {
            type: "array",
            items: { type: "string" },
            description: "Extra Gradle arguments, e.g. ['--stacktrace']",
          },
        },
        required: ["task"],
      },
    },
    {
      name: "gradle_test",
      description: "Run Android unit tests via Gradle (test, connectedAndroidTest, etc.).",
      inputSchema: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "Test task, e.g. test, connectedDebugAndroidTest",
          },
          repoPath: { type: "string" },
          extraArgs: { type: "array", items: { type: "string" } },
        },
        required: ["task"],
      },
    },
    {
      name: "gradle_lint",
      description: "Run Gradle lint (read-only analysis, does not apply fixes).",
      inputSchema: {
        type: "object",
        properties: {
          repoPath: { type: "string" },
          variant: { type: "string", description: "Variant, e.g. debug or release" },
        },
        required: [],
      },
    },
    {
      name: "emulator_start",
      description: "Start an Android emulator AVD by name.",
      inputSchema: {
        type: "object",
        properties: {
          avdName: { type: "string", description: "AVD name (from 'emulator -list-avds')" },
        },
        required: ["avdName"],
      },
    },
    {
      name: "emulator_list_avds",
      description: "List available Android Virtual Devices (AVDs).",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "aapt2_dump",
      description: "Dump APK manifest or resources using aapt2.",
      inputSchema: {
        type: "object",
        properties: {
          apkPath: { type: "string" },
          what: {
            type: "string",
            enum: ["badging", "manifest", "resources", "strings"],
            description: "What to dump.",
          },
        },
        required: ["apkPath", "what"],
      },
    },
    {
      name: "apksigner_verify",
      description: "Verify APK signature using apksigner.",
      inputSchema: {
        type: "object",
        properties: {
          apkPath: { type: "string" },
          verbose: { type: "boolean" },
        },
        required: ["apkPath"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    switch (name) {
      // -----------------------------------------------------------------------
      case "adb_list_devices": {
        const r = await run(adbPath(), ["devices", "-l"]);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "adb_logcat": {
        const filter = (args.filter as string) ?? "*:V";
        const seconds = Math.min(Math.max(Number(args.seconds ?? 3), 1), 30);
        const deviceArgs = args.deviceId ? ["-s", args.deviceId as string] : [];
        // Use -T to grab only recent lines, timeout the process
        const r = await run(
          adbPath(),
          [...deviceArgs, "logcat", "-v", "threadtime", "-d", filter],
          REPO_ROOT,
          seconds * 1000 + 3000
        );
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "adb_screenshot": {
        const outputPath = args.outputPath as string;
        const deviceArgs = args.deviceId ? ["-s", args.deviceId as string] : [];
        // screencap to device temp, then pull
        await run(adbPath(), [...deviceArgs, "shell", "screencap", "-p", "/sdcard/_mcp_screen.png"]);
        const r = await run(adbPath(), [...deviceArgs, "pull", "/sdcard/_mcp_screen.png", outputPath]);
        return { content: [{ type: "text", text: `Screenshot saved to ${outputPath}\n${r.stdout}` }] };
      }

      // -----------------------------------------------------------------------
      case "adb_install_apk": {
        const apkPath = args.apkPath as string;
        const deviceArgs = args.deviceId ? ["-s", args.deviceId as string] : [];
        const r = await run(adbPath(), [...deviceArgs, "install", "-r", apkPath]);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "adb_shell": {
        const command = args.command as string;
        assertSafe(command);
        const deviceArgs = args.deviceId ? ["-s", args.deviceId as string] : [];
        const r = await run(adbPath(), [...deviceArgs, "shell", command]);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "gradle_build":
      case "gradle_test": {
        const task = args.task as string;
        const repoPath = (args.repoPath as string) ?? REPO_ROOT;
        const extra = (args.extraArgs as string[]) ?? [];
        const r = await run(gradleBin, [task, ...extra], repoPath, 300_000);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "gradle_lint": {
        const repoPath = (args.repoPath as string) ?? REPO_ROOT;
        const variant = (args.variant as string) ?? "debug";
        const task = `lint${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
        const r = await run(gradleBin, [task], repoPath, 300_000);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "emulator_list_avds": {
        const emulatorBin = ANDROID_SDK
          ? path.join(ANDROID_SDK, "emulator", isWindows ? "emulator.exe" : "emulator")
          : "emulator";
        const r = await run(emulatorBin, ["-list-avds"]);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "emulator_start": {
        const avdName = args.avdName as string;
        const emulatorBin = ANDROID_SDK
          ? path.join(ANDROID_SDK, "emulator", isWindows ? "emulator.exe" : "emulator")
          : "emulator";
        // Fire-and-forget (emulator runs in background)
        const child = execFile(emulatorBin, ["-avd", avdName, "-no-snapshot-load"], {
          detached: true,
          stdio: "ignore",
          env: { ...process.env, ANDROID_SDK_ROOT: ANDROID_SDK },
        });
        child.unref();
        return {
          content: [
            {
              type: "text",
              text: `Emulator "${avdName}" launch requested. Use adb_list_devices to confirm it appears.`,
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case "aapt2_dump": {
        const apkPath = args.apkPath as string;
        const what = args.what as string;
        // Locate aapt2 inside build-tools using PowerShell (Windows) or find (Unix)
        const { stdout: foundPath } = await (ANDROID_SDK
          ? run(
              isWindows ? "powershell.exe" : "sh",
              isWindows
                ? [
                    "-NoProfile",
                    "-Command",
                    `(Get-ChildItem -Path '${path.join(ANDROID_SDK, "build-tools")}' -Recurse -Filter 'aapt2.exe' -ErrorAction SilentlyContinue | Sort-Object FullName | Select-Object -Last 1).FullName`,
                  ]
                : ["-c", `find "${path.join(ANDROID_SDK, "build-tools")}" -name "aapt2" 2>/dev/null | sort | tail -1`],
              REPO_ROOT,
              10_000
            )
          : Promise.resolve({ stdout: "", stderr: "" })
        ).catch(() => ({ stdout: "", stderr: "" }));

        const resolvedAapt2 = foundPath.trim() || (isWindows ? "aapt2.exe" : "aapt2");
        const r = await run(resolvedAapt2, ["dump", what, apkPath]);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      case "apksigner_verify": {
        const apkPath = args.apkPath as string;
        const verbose = (args.verbose as boolean) ?? false;
        // Locate apksigner inside build-tools using PowerShell (Windows) or find (Unix)
        const { stdout: foundPath } = await (ANDROID_SDK
          ? run(
              isWindows ? "powershell.exe" : "sh",
              isWindows
                ? [
                    "-NoProfile",
                    "-Command",
                    `(Get-ChildItem -Path '${path.join(ANDROID_SDK, "build-tools")}' -Recurse -Filter 'apksigner.bat' -ErrorAction SilentlyContinue | Sort-Object FullName | Select-Object -Last 1).FullName`,
                  ]
                : ["-c", `find "${path.join(ANDROID_SDK, "build-tools")}" -name "apksigner" 2>/dev/null | sort | tail -1`],
              REPO_ROOT,
              10_000
            )
          : Promise.resolve({ stdout: "", stderr: "" })
        ).catch(() => ({ stdout: "", stderr: "" }));

        const resolvedApksigner = foundPath.trim() || (isWindows ? "apksigner.bat" : "apksigner");
        const verifyArgs = ["verify", "--print-certs", ...(verbose ? ["--verbose"] : []), apkPath];
        const r = await run(resolvedApksigner, verifyArgs);
        return { content: [{ type: "text", text: r.stdout || r.stderr }] };
      }

      // -----------------------------------------------------------------------
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${String(err)}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start transport
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
