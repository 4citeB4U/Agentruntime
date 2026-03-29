/**
 * index.ts — BYO Android Dev MCP Server
 *
 * Windows-only, read-only build/test/deploy/ADB toolset for GitHub Copilot Chat.
 * Uses Android Studio JBR (JDK 17) and targets Android SDK on D: drive by default.
 *
 * ════════════════════════════════════════════════════════
 *  READ-ONLY ENFORCEMENT — EXPLICITLY EXCLUDED TOOLS
 * ════════════════════════════════════════════════════════
 * The following categories of operations are intentionally ABSENT from this
 * server's tool list.  Any Copilot Chat tool request that falls into these
 * categories must be handled by the IDE's built-in editor or a dedicated
 * code-editing extension — NOT by this MCP server:
 *
 *   ✗  Write / create / overwrite source files in the repository
 *   ✗  Delete repository files or directories
 *   ✗  Edit Gradle build scripts (build.gradle, settings.gradle, …)
 *   ✗  Edit AndroidManifest.xml, resource files, Kotlin/Java source
 *   ✗  Run arbitrary shell commands that redirect output to repo paths
 *   ✗  git add / git commit / git push (version-control writes)
 *   ✗  Modify .env or any secrets/config files
 *
 * Tools provided by this server operate on:
 *   ✓  Build artifacts under build/ (outputs only)
 *   ✓  Connected Android device filesystem (via adb, not repo)
 *   ✓  External services (Play Store — optional, requires your own key)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import * as buildTools from "./tools/build.js";
import * as testTools from "./tools/test.js";
import * as deployTools from "./tools/deploy.js";
import * as adbTools from "./tools/adb.js";
import * as diagTools from "./tools/diagnostics.js";

// ---------------------------------------------------------------------------
// Server definition
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "android-dev-mcp",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// ① BUILD TOOLS
// ---------------------------------------------------------------------------

server.tool(
  "android_build_list_tasks",
  "List all Gradle tasks in the Android project. Read-only.",
  {
    projectRoot: z
      .string()
      .optional()
      .describe("Absolute Windows path to the project root. Defaults to ANDROID_PROJECT_ROOT env var."),
  },
  async ({ projectRoot }) => {
    const output = await buildTools.listTasks(projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_build_assemble_apk",
  "Assemble a debug or release APK using the Gradle wrapper. Read-only (produces artifacts under build/).",
  {
    variant: z.enum(["debug", "release"]).describe("Build variant to assemble."),
    module: z
      .string()
      .default("app")
      .describe("Gradle module name (e.g. 'app', 'feature_diagnostics')."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ variant, module, projectRoot }) => {
    const output = await buildTools.assembleApk(variant, module, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_build_bundle_aab",
  "Build an Android App Bundle (AAB) using the Gradle wrapper. Read-only.",
  {
    variant: z.enum(["debug", "release"]).describe("Build variant."),
    module: z.string().default("app").describe("Gradle module name."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ variant, module, projectRoot }) => {
    const output = await buildTools.bundleAab(variant, module, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_build_lint",
  "Run Android Lint on a module and return the report. Read-only.",
  {
    module: z.string().default("app").describe("Gradle module name."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ module, projectRoot }) => {
    const output = await buildTools.runLint(module, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_build_dependencies",
  "Show the Gradle dependency tree for a module. Read-only.",
  {
    module: z.string().default("app").describe("Gradle module name."),
    configuration: z
      .string()
      .optional()
      .describe("Specific configuration to inspect (e.g. 'debugRuntimeClasspath')."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ module, configuration, projectRoot }) => {
    const output = await buildTools.showDependencies(module, configuration, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_build_signing_report",
  "Show signing configuration fingerprints (key aliases, SHA-1, SHA-256). Read-only.",
  {
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ projectRoot }) => {
    const output = await buildTools.signingReport(projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_build_list_artifacts",
  "List built APK/AAB artifacts found in the project build output directory. Read-only.",
  {
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ projectRoot }) => {
    const output = await buildTools.listArtifacts(projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// ② TEST TOOLS
// ---------------------------------------------------------------------------

server.tool(
  "android_test_unit",
  "Run JVM unit tests for an Android module variant. Read-only.",
  {
    module: z.string().default("app").describe("Gradle module name."),
    variant: z
      .enum(["debug", "release"])
      .default("debug")
      .describe("Build variant whose unit tests to run."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ module, variant, projectRoot }) => {
    const output = await testTools.runUnitTests(module, variant, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_test_instrumentation",
  "Run connected Android instrumentation tests on an attached device/emulator. Read-only.",
  {
    module: z.string().default("app").describe("Gradle module name."),
    testRunner: z
      .string()
      .optional()
      .describe("Custom test runner class (optional)."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ module, testRunner, projectRoot }) => {
    const output = await testTools.runInstrumentationTests(module, testRunner, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "android_test_collect_reports",
  "Collect and list test report files from the build output directory. Read-only.",
  {
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ projectRoot }) => {
    const output = await testTools.collectTestReports(projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// ③ ADB / DEVICE TOOLS
// ---------------------------------------------------------------------------

server.tool(
  "adb_list_devices",
  "List all connected Android devices and emulators via adb. Read-only.",
  {},
  async () => {
    const output = await adbTools.listDevices();
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_device_properties",
  "Get all system properties from a connected Android device (adb shell getprop). Read-only.",
  {
    serial: z.string().optional().describe("Device serial number (from adb_list_devices). Omit for single device."),
  },
  async ({ serial }) => {
    const output = await adbTools.deviceProperties(serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_install_apk",
  "Install an APK onto a connected device via adb install. Operates on device filesystem only.",
  {
    apkPath: z.string().describe("Absolute Windows path to the APK file to install."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
    reinstall: z
      .boolean()
      .default(true)
      .describe("Pass -r to adb install to reinstall (keep data). Default: true."),
  },
  async ({ apkPath, serial, reinstall }) => {
    const output = await adbTools.installApk(apkPath, serial, reinstall);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_launch_activity",
  "Launch an Android activity on a connected device using adb shell am start.",
  {
    packageName: z.string().describe("Android package name (e.g. 'com.example.app')."),
    activityName: z.string().describe("Activity class name (e.g. '.MainActivity')."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ packageName, activityName, serial }) => {
    const output = await adbTools.launchActivity(packageName, activityName, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_logcat",
  "Capture the last N lines of device logcat output. Read-only.",
  {
    lines: z.number().int().positive().default(200).describe("Number of log lines to return."),
    tags: z
      .string()
      .optional()
      .describe("Logcat tag filter (e.g. 'AgentLee:D *:S')."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ lines, tags, serial }) => {
    const output = await adbTools.captureLogcat(lines, tags, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_screenshot",
  "Take a screenshot of the device screen and save it to a local Windows path.",
  {
    localPath: z
      .string()
      .describe("Absolute Windows path where the screenshot PNG should be saved (e.g. D:\\screenshots\\screen.png)."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ localPath, serial }) => {
    const output = await adbTools.takeScreenshot(localPath, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_pull_file",
  "Pull a file from the Android device to a local Windows path.",
  {
    devicePath: z.string().describe("Path on the Android device (e.g. /sdcard/data.db)."),
    localPath: z.string().describe("Absolute Windows destination path."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ devicePath, localPath, serial }) => {
    const output = await adbTools.pullFile(devicePath, localPath, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_push_file",
  "Push a local file to the Android device filesystem.",
  {
    localPath: z.string().describe("Absolute Windows path to the local file to push."),
    devicePath: z.string().describe("Destination path on the Android device."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ localPath, devicePath, serial }) => {
    const output = await adbTools.pushFile(localPath, devicePath, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_ui_hierarchy",
  "Dump the UI hierarchy of the current device screen via uiautomator. Read-only.",
  {
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ serial }) => {
    const output = await adbTools.dumpUiHierarchy(serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_list_packages",
  "List installed packages on the device. Read-only.",
  {
    filter: z.string().optional().describe("Optional substring to filter package names."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ filter, serial }) => {
    const output = await adbTools.listPackages(filter, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_uninstall_package",
  "Uninstall an app package from the device.",
  {
    packageName: z.string().describe("Package name to uninstall (e.g. 'com.example.app')."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ packageName, serial }) => {
    const output = await adbTools.uninstallPackage(packageName, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_device_shell",
  "Run a read-only diagnostic shell command on the device (no file-write operators allowed).",
  {
    command: z.string().describe("Shell command to run on the device (e.g. 'df -h', 'ps -A')."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
  },
  async ({ command, serial }) => {
    const output = await adbTools.deviceShell(command, serial);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "adb_start_emulator",
  "Start an Android emulator by AVD name.",
  {
    avdName: z.string().describe("AVD name as shown in Android Studio AVD Manager."),
    sdkRoot: z.string().optional().describe("Android SDK root path. Defaults to ANDROID_SDK_ROOT."),
  },
  async ({ avdName, sdkRoot }) => {
    const output = await adbTools.startEmulator(avdName, sdkRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// ④ DEPLOY TOOLS
// ---------------------------------------------------------------------------

server.tool(
  "deploy_sideload_apk",
  "Install a pre-built APK to a connected device via adb. Operates on device filesystem only.",
  {
    apkPath: z.string().describe("Absolute Windows path to the APK file."),
    serial: z.string().optional().describe("Device serial number. Omit for single device."),
    reinstall: z.boolean().default(true).describe("Reinstall preserving data. Default: true."),
  },
  async ({ apkPath, serial, reinstall }) => {
    const output = await deployTools.sideloadApk(apkPath, serial, reinstall);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "deploy_fastlane_lane",
  "Run a fastlane lane defined in the project Fastfile. Requires fastlane installed locally.",
  {
    lane: z
      .string()
      .regex(/^[a-zA-Z0-9_]+$/, "Lane name must be alphanumeric with underscores only.")
      .describe("Name of the fastlane lane to execute."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ lane, projectRoot }) => {
    const output = await deployTools.runFastlaneLane(lane, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "deploy_list_fastlane_lanes",
  "List available fastlane lanes defined in the project Fastfile. Read-only.",
  {
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ projectRoot }) => {
    const output = await deployTools.listFastlaneLanes(projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "deploy_play_publish",
  "Publish the app to Google Play Store via Gradle Play Publisher. Requires GOOGLE_PLAY_SERVICE_ACCOUNT_JSON in .env.",
  {
    track: z
      .enum(["internal", "alpha", "beta", "production"])
      .describe("Play Store track to publish to."),
    module: z.string().default("app").describe("Gradle module name."),
    projectRoot: z.string().optional().describe("Absolute Windows path to project root."),
  },
  async ({ track, module, projectRoot }) => {
    const output = await deployTools.publishToPlay(track, module, projectRoot);
    return { content: [{ type: "text", text: output }] };
  }
);

// ---------------------------------------------------------------------------
// ⑤ DIAGNOSTICS
// ---------------------------------------------------------------------------

server.tool(
  "android_dev_health",
  "Run a full Android development environment health check (SDK, JDK, adb, Gradle, project structure). Read-only.",
  {},
  async () => {
    const report = await diagTools.androidDevHealth();
    const lines: string[] = [
      `═══ Android Dev Environment Health Report ═══`,
      `Overall status: ${report.status.toUpperCase()}`,
      `Summary: ${report.summary}`,
      ``,
      ...report.checks.map(
        (c) => `[${c.status.toUpperCase().padEnd(4)}] ${c.name}: ${c.message}`
      ),
    ];
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr only (stdout is reserved for MCP protocol messages)
  process.stderr.write("android-dev-mcp server started (stdio transport)\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
