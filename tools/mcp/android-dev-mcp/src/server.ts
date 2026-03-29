import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Environment / path helpers (Windows-first)
// ---------------------------------------------------------------------------

function getAndroidHome(): string {
  return (
    process.env["ANDROID_HOME"] ??
    process.env["ANDROID_SDK_ROOT"] ??
    path.join(
      process.env["LOCALAPPDATA"] ?? "C:\\Users\\Default\\AppData\\Local",
      "Android",
      "Sdk"
    )
  );
}

function getAdbPath(): string {
  if (process.env["ADB_PATH"]) return process.env["ADB_PATH"];
  const androidHome = getAndroidHome();
  // Windows
  const winAdb = path.join(androidHome, "platform-tools", "adb.exe");
  if (fs.existsSync(winAdb)) return winAdb;
  // Unix fallback
  const unixAdb = path.join(androidHome, "platform-tools", "adb");
  if (fs.existsSync(unixAdb)) return unixAdb;
  // PATH fallback
  return process.platform === "win32" ? "adb.exe" : "adb";
}

function getGradleWrapper(projectRoot: string): string {
  const winWrapper = path.join(projectRoot, "gradlew.bat");
  if (fs.existsSync(winWrapper)) return winWrapper;
  const unixWrapper = path.join(projectRoot, "gradlew");
  if (fs.existsSync(unixWrapper)) return unixWrapper;
  throw new Error(
    `Gradle wrapper not found in ${projectRoot}. Make sure you have gradlew.bat (Windows) or gradlew (Unix) in your project root.`
  );
}

function resolveProjectRoot(projectRoot?: string): string {
  if (projectRoot) return projectRoot;
  return process.env["ANDROID_PROJECT_ROOT"] ?? process.cwd();
}

interface ExecResult {
  stdout: string;
  stderr: string;
}

async function runAdb(args: string[]): Promise<ExecResult> {
  const adb = getAdbPath();
  const { stdout, stderr } = await execFileAsync(adb, args, {
    timeout: 30_000,
    windowsHide: true,
  });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}

async function runGradle(
  projectRoot: string,
  tasks: string[],
  extraArgs: string[] = []
): Promise<ExecResult> {
  const wrapper = getGradleWrapper(projectRoot);
  const cmd = process.platform === "win32" ? "cmd.exe" : wrapper;
  const args =
    process.platform === "win32"
      ? ["/c", wrapper, ...tasks, ...extraArgs]
      : [...tasks, ...extraArgs];

  const { stdout, stderr } = await execFileAsync(cmd, args, {
    cwd: projectRoot,
    timeout: 300_000,
    env: {
      ...process.env,
      ANDROID_HOME: getAndroidHome(),
      ANDROID_SDK_ROOT: getAndroidHome(),
    },
    windowsHide: true,
  });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_devices",
    description:
      "List all Android devices and emulators connected via ADB. Returns device serial numbers, states, and model names.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_device_info",
    description:
      "Get detailed information about a specific Android device (Android version, model, manufacturer, screen resolution, API level).",
    inputSchema: {
      type: "object",
      properties: {
        serial: {
          type: "string",
          description:
            "Device serial number from list_devices. Omit to use the only connected device.",
        },
      },
      required: [],
    },
  },
  {
    name: "build_debug_apk",
    description:
      "Build a debug APK using Gradle (runs gradlew.bat assembleDebug on Windows). Returns the path to the generated APK.",
    inputSchema: {
      type: "object",
      properties: {
        project_root: {
          type: "string",
          description:
            "Absolute path to the Android project root (where gradlew.bat lives). Defaults to ANDROID_PROJECT_ROOT env var or current directory.",
        },
        module: {
          type: "string",
          description:
            "Module name to build (e.g. 'app'). Defaults to 'app'. Use ':module:assembleDebug' format if multi-module.",
        },
        extra_args: {
          type: "array",
          items: { type: "string" },
          description:
            "Extra Gradle arguments (e.g. ['--stacktrace', '-Pandroid.testInstrumentationRunnerArguments.class=...']).",
        },
      },
      required: [],
    },
  },
  {
    name: "build_release_aab",
    description:
      "Build a release Android App Bundle (AAB) using Gradle (runs gradlew.bat bundleRelease on Windows).",
    inputSchema: {
      type: "object",
      properties: {
        project_root: {
          type: "string",
          description:
            "Absolute path to the Android project root. Defaults to ANDROID_PROJECT_ROOT env var or current directory.",
        },
        module: {
          type: "string",
          description: "Module name (e.g. 'app'). Defaults to 'app'.",
        },
        extra_args: {
          type: "array",
          items: { type: "string" },
          description: "Extra Gradle arguments.",
        },
      },
      required: [],
    },
  },
  {
    name: "install_apk",
    description: "Install an APK on a connected Android device via ADB.",
    inputSchema: {
      type: "object",
      properties: {
        apk_path: {
          type: "string",
          description: "Absolute path to the APK file to install.",
        },
        serial: {
          type: "string",
          description: "Device serial number. Omit to use the only connected device.",
        },
        reinstall: {
          type: "boolean",
          description: "If true, reinstall the app and keep its data (-r flag). Defaults to true.",
        },
      },
      required: ["apk_path"],
    },
  },
  {
    name: "run_app",
    description:
      "Launch an Android app on a connected device via ADB (starts the main activity).",
    inputSchema: {
      type: "object",
      properties: {
        package_name: {
          type: "string",
          description: "App package name (e.g. 'com.example.myapp').",
        },
        activity: {
          type: "string",
          description:
            "Activity to launch (e.g. '.MainActivity'). Defaults to the launcher activity via 'monkey'.",
        },
        serial: {
          type: "string",
          description: "Device serial number. Omit to use the only connected device.",
        },
      },
      required: ["package_name"],
    },
  },
  {
    name: "stop_app",
    description: "Force-stop an Android app on a connected device via ADB.",
    inputSchema: {
      type: "object",
      properties: {
        package_name: {
          type: "string",
          description: "App package name (e.g. 'com.example.myapp').",
        },
        serial: {
          type: "string",
          description: "Device serial number. Omit to use the only connected device.",
        },
      },
      required: ["package_name"],
    },
  },
  {
    name: "get_logcat",
    description:
      "Capture recent logcat output from a connected Android device. Optionally filter by package/tag.",
    inputSchema: {
      type: "object",
      properties: {
        serial: {
          type: "string",
          description: "Device serial number. Omit to use the only connected device.",
        },
        package_name: {
          type: "string",
          description:
            "Filter logs to this app package name (uses pidof to find PID). Optional.",
        },
        tag: {
          type: "string",
          description: "Logcat tag filter (e.g. 'MyApp:D *:S'). Optional.",
        },
        lines: {
          type: "number",
          description: "Number of recent log lines to return. Defaults to 200.",
        },
        clear_first: {
          type: "boolean",
          description: "If true, clears the logcat buffer before capturing. Defaults to false.",
        },
      },
      required: [],
    },
  },
  {
    name: "run_instrumented_tests",
    description:
      "Run Android instrumented tests on a connected device via Gradle (assembleAndroidTest + connectedAndroidTest).",
    inputSchema: {
      type: "object",
      properties: {
        project_root: {
          type: "string",
          description:
            "Absolute path to the Android project root. Defaults to ANDROID_PROJECT_ROOT env var or current directory.",
        },
        module: {
          type: "string",
          description: "Module to test (e.g. 'app'). Defaults to 'app'.",
        },
        class_filter: {
          type: "string",
          description:
            "Optional test class/method filter (e.g. 'com.example.MyTest#myMethod').",
        },
        serial: {
          type: "string",
          description: "Target device serial number.",
        },
      },
      required: [],
    },
  },
  {
    name: "run_unit_tests",
    description: "Run Android unit tests (JVM) via Gradle (testDebugUnitTest).",
    inputSchema: {
      type: "object",
      properties: {
        project_root: {
          type: "string",
          description:
            "Absolute path to the Android project root. Defaults to ANDROID_PROJECT_ROOT env var or current directory.",
        },
        module: {
          type: "string",
          description: "Module to test (e.g. 'app'). Defaults to 'app'.",
        },
        class_filter: {
          type: "string",
          description:
            "Optional test class/method filter (e.g. '--tests com.example.MyUnitTest').",
        },
      },
      required: [],
    },
  },
  {
    name: "take_screenshot",
    description:
      "Take a screenshot of the device screen and save it to a local file.",
    inputSchema: {
      type: "object",
      properties: {
        output_path: {
          type: "string",
          description:
            "Local path to save the PNG screenshot (e.g. 'C:\\screenshots\\screen.png'). Defaults to the system temp directory.",
        },
        serial: {
          type: "string",
          description: "Device serial number. Omit to use the only connected device.",
        },
      },
      required: [],
    },
  },
  {
    name: "pull_file",
    description: "Pull a file or directory from the Android device to your local machine.",
    inputSchema: {
      type: "object",
      properties: {
        device_path: {
          type: "string",
          description: "Absolute path on the device (e.g. '/sdcard/Download/data.txt').",
        },
        local_path: {
          type: "string",
          description: "Local path to save the file (e.g. 'C:\\Downloads\\data.txt').",
        },
        serial: {
          type: "string",
          description: "Device serial number. Omit to use the only connected device.",
        },
      },
      required: ["device_path", "local_path"],
    },
  },
  {
    name: "get_android_sdk_info",
    description:
      "Get information about the detected Android SDK, ADB path, and environment configuration for debugging setup issues.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

function deviceArgs(serial?: string): string[] {
  return serial ? ["-s", serial] : [];
}

async function handleListDevices(): Promise<string> {
  const { stdout } = await runAdb(["devices", "-l"]);
  if (!stdout || stdout === "List of devices attached") {
    return "No devices connected. Make sure your phone is plugged in with USB debugging enabled, or start an emulator.";
  }
  return stdout;
}

async function handleGetDeviceInfo(serial?: string): Promise<string> {
  const args = deviceArgs(serial);
  const props = [
    ["Model", "ro.product.model"],
    ["Manufacturer", "ro.product.manufacturer"],
    ["Android Version", "ro.build.version.release"],
    ["API Level", "ro.build.version.sdk"],
    ["Build", "ro.build.display.id"],
    ["Screen Density", "ro.sf.lcd_density"],
    ["ABI", "ro.product.cpu.abi"],
  ];
  const results: string[] = [];
  for (const [label, prop] of props) {
    try {
      const { stdout } = await runAdb([...args, "shell", "getprop", prop]);
      results.push(`${label}: ${stdout}`);
    } catch {
      results.push(`${label}: (unavailable)`);
    }
  }
  return results.join("\n");
}

async function handleBuildDebugApk(
  projectRoot?: string,
  module = "app",
  extraArgs: string[] = []
): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const task = `:${module}:assembleDebug`;
  const { stdout, stderr } = await runGradle(root, [task], extraArgs);

  // Try to find the APK path in the output
  const apkMatch = stdout.match(/APK.*?:\s*(.+\.apk)/i) ??
    stderr.match(/APK.*?:\s*(.+\.apk)/i);

  let apkPath = "";
  if (apkMatch) {
    apkPath = apkMatch[1].trim();
  } else {
    const guessed = path.join(
      root,
      module,
      "build",
      "outputs",
      "apk",
      "debug",
      `${module}-debug.apk`
    );
    if (fs.existsSync(guessed)) apkPath = guessed;
  }

  const output = [`Gradle output:\n${stdout}`];
  if (stderr) output.push(`\nWarnings/errors:\n${stderr}`);
  if (apkPath) output.push(`\nAPK location: ${apkPath}`);
  return output.join("");
}

async function handleBuildReleaseAab(
  projectRoot?: string,
  module = "app",
  extraArgs: string[] = []
): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const task = `:${module}:bundleRelease`;
  const { stdout, stderr } = await runGradle(root, [task], extraArgs);

  const aabGuess = path.join(
    root,
    module,
    "build",
    "outputs",
    "bundle",
    "release",
    `${module}-release.aab`
  );
  const output = [`Gradle output:\n${stdout}`];
  if (stderr) output.push(`\nWarnings/errors:\n${stderr}`);
  if (fs.existsSync(aabGuess)) output.push(`\nAAB location: ${aabGuess}`);
  return output.join("");
}

async function handleInstallApk(
  apkPath: string,
  serial?: string,
  reinstall = true
): Promise<string> {
  if (!fs.existsSync(apkPath)) {
    throw new Error(`APK not found at: ${apkPath}`);
  }
  const args = [...deviceArgs(serial), "install"];
  if (reinstall) args.push("-r");
  args.push(apkPath);
  const { stdout, stderr } = await runAdb(args);
  return `${stdout}\n${stderr}`.trim();
}

async function handleRunApp(
  packageName: string,
  activity?: string,
  serial?: string
): Promise<string> {
  const args = deviceArgs(serial);
  if (activity) {
    const component = activity.startsWith(".")
      ? `${packageName}/${packageName}${activity}`
      : `${packageName}/${activity}`;
    const { stdout, stderr } = await runAdb([
      ...args,
      "shell",
      "am",
      "start",
      "-n",
      component,
    ]);
    return `${stdout}\n${stderr}`.trim();
  } else {
    const { stdout, stderr } = await runAdb([
      ...args,
      "shell",
      "monkey",
      "-p",
      packageName,
      "-c",
      "android.intent.category.LAUNCHER",
      "1",
    ]);
    return `${stdout}\n${stderr}`.trim();
  }
}

async function handleStopApp(
  packageName: string,
  serial?: string
): Promise<string> {
  const { stdout, stderr } = await runAdb([
    ...deviceArgs(serial),
    "shell",
    "am",
    "force-stop",
    packageName,
  ]);
  return `Stopped ${packageName}\n${stdout}\n${stderr}`.trim();
}

async function handleGetLogcat(
  serial?: string,
  packageName?: string,
  tag?: string,
  lines = 200,
  clearFirst = false
): Promise<string> {
  const args = deviceArgs(serial);

  if (clearFirst) {
    await runAdb([...args, "logcat", "-c"]);
  }

  const logcatArgs = [...args, "logcat", "-d", "-t", String(lines)];
  if (tag) logcatArgs.push(tag);

  const { stdout } = await runAdb(logcatArgs);

  if (packageName) {
    // Filter by package name (simple string filter since PID lookup is complex in ADB)
    const filtered = stdout
      .split("\n")
      .filter((line) => line.includes(packageName))
      .join("\n");
    return filtered || `No log lines found matching package: ${packageName}`;
  }

  return stdout || "No log output captured.";
}

async function handleRunInstrumentedTests(
  projectRoot?: string,
  module = "app",
  classFilter?: string,
  serial?: string
): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const extraArgs: string[] = [];
  if (classFilter) {
    extraArgs.push(
      `-Pandroid.testInstrumentationRunnerArguments.class=${classFilter}`
    );
  }
  const task = `:${module}:connectedAndroidTest`;

  // ANDROID_SERIAL tells the Android Gradle plugin which device to target
  const env = serial
    ? { ...process.env, ANDROID_SERIAL: serial }
    : process.env;

  const { stdout, stderr } = await execFileAsync(
    process.platform === "win32" ? "cmd.exe" : getGradleWrapper(root),
    process.platform === "win32"
      ? ["/c", getGradleWrapper(root), task, ...extraArgs]
      : [task, ...extraArgs],
    {
      cwd: root,
      timeout: 300_000,
      env: {
        ...env,
        ANDROID_HOME: getAndroidHome(),
        ANDROID_SDK_ROOT: getAndroidHome(),
      },
      windowsHide: true,
    }
  );
  return `${stdout.trim()}\n${stderr.trim()}`.trim();
}

async function handleRunUnitTests(
  projectRoot?: string,
  module = "app",
  classFilter?: string
): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const extraArgs = classFilter ? [`--tests`, classFilter] : [];
  const task = `:${module}:testDebugUnitTest`;
  const { stdout, stderr } = await runGradle(root, [task], extraArgs);
  return `${stdout}\n${stderr}`.trim();
}

async function handleTakeScreenshot(
  outputPath?: string,
  serial?: string
): Promise<string> {
  const args = deviceArgs(serial);
  const deviceTmpPath = "/sdcard/mcp_screenshot.png";
  const localPath =
    outputPath ??
    path.join(
      process.env["TEMP"] ?? process.env["TMPDIR"] ?? "/tmp",
      `android_screenshot_${Date.now()}.png`
    );

  await runAdb([...args, "shell", "screencap", "-p", deviceTmpPath]);
  await runAdb([...args, "pull", deviceTmpPath, localPath]);
  await runAdb([...args, "shell", "rm", "-f", deviceTmpPath]);

  return `Screenshot saved to: ${localPath}`;
}

async function handlePullFile(
  devicePath: string,
  localPath: string,
  serial?: string
): Promise<string> {
  const { stdout, stderr } = await runAdb([
    ...deviceArgs(serial),
    "pull",
    devicePath,
    localPath,
  ]);
  return `${stdout}\n${stderr}`.trim();
}

async function handleGetAndroidSdkInfo(): Promise<string> {
  const androidHome = getAndroidHome();
  const adbPath = getAdbPath();
  const javaHome = process.env["JAVA_HOME"] ?? "(not set)";
  const projectRoot = process.env["ANDROID_PROJECT_ROOT"] ?? "(not set, will use cwd)";

  const adbExists = fs.existsSync(adbPath);

  return [
    `Android SDK (ANDROID_HOME/ANDROID_SDK_ROOT): ${androidHome}`,
    `  Exists: ${fs.existsSync(androidHome)}`,
    `ADB path: ${adbPath}`,
    `  Exists: ${adbExists}`,
    `JAVA_HOME: ${javaHome}`,
    `ANDROID_PROJECT_ROOT: ${projectRoot}`,
    `Platform: ${process.platform}`,
    `Node.js: ${process.version}`,
    ``,
    `To fix missing paths, set environment variables in your VS Code MCP config:`,
    `  ANDROID_HOME=D:\\Android\\Sdk`,
    `  JAVA_HOME=D:\\Program Files\\Android\\Android Studio\\jbr`,
    `  ANDROID_PROJECT_ROOT=D:\\path\\to\\your\\android\\project`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "android-dev-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;

  try {
    let result: string;

    switch (name) {
      case "list_devices":
        result = await handleListDevices();
        break;

      case "get_device_info":
        result = await handleGetDeviceInfo(a["serial"] as string | undefined);
        break;

      case "build_debug_apk":
        result = await handleBuildDebugApk(
          a["project_root"] as string | undefined,
          (a["module"] as string | undefined) ?? "app",
          (a["extra_args"] as string[] | undefined) ?? []
        );
        break;

      case "build_release_aab":
        result = await handleBuildReleaseAab(
          a["project_root"] as string | undefined,
          (a["module"] as string | undefined) ?? "app",
          (a["extra_args"] as string[] | undefined) ?? []
        );
        break;

      case "install_apk":
        result = await handleInstallApk(
          a["apk_path"] as string,
          a["serial"] as string | undefined,
          (a["reinstall"] as boolean | undefined) ?? true
        );
        break;

      case "run_app":
        result = await handleRunApp(
          a["package_name"] as string,
          a["activity"] as string | undefined,
          a["serial"] as string | undefined
        );
        break;

      case "stop_app":
        result = await handleStopApp(
          a["package_name"] as string,
          a["serial"] as string | undefined
        );
        break;

      case "get_logcat":
        result = await handleGetLogcat(
          a["serial"] as string | undefined,
          a["package_name"] as string | undefined,
          a["tag"] as string | undefined,
          (a["lines"] as number | undefined) ?? 200,
          (a["clear_first"] as boolean | undefined) ?? false
        );
        break;

      case "run_instrumented_tests":
        result = await handleRunInstrumentedTests(
          a["project_root"] as string | undefined,
          (a["module"] as string | undefined) ?? "app",
          a["class_filter"] as string | undefined,
          a["serial"] as string | undefined
        );
        break;

      case "run_unit_tests":
        result = await handleRunUnitTests(
          a["project_root"] as string | undefined,
          (a["module"] as string | undefined) ?? "app",
          a["class_filter"] as string | undefined
        );
        break;

      case "take_screenshot":
        result = await handleTakeScreenshot(
          a["output_path"] as string | undefined,
          a["serial"] as string | undefined
        );
        break;

      case "pull_file":
        result = await handlePullFile(
          a["device_path"] as string,
          a["local_path"] as string,
          a["serial"] as string | undefined
        );
        break;

      case "get_android_sdk_info":
        result = await handleGetAndroidSdkInfo();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // MCP servers communicate via stdio; log to stderr only
  process.stderr.write("Android Dev MCP server started\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
