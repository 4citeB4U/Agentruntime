/**
 * Android Dev MCP Server – entry point
 *
 * Implements a Model Context Protocol (MCP) server exposing Android
 * build/test/deploy/device tools. All operations are read-only with
 * respect to the project source – no file-modifying actions are exposed.
 *
 * Run: node dist/index.js
 * The server communicates over stdio (JSON-RPC / MCP protocol).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config";
import { runHealthCheck } from "./tools/diagnostics";
import { detectProject } from "./tools/project";
import { listGradleTasks, runGradleTask } from "./tools/gradle";
import { buildApk, buildAab } from "./tools/build";
import { verifyArtifact } from "./tools/artifact";
import {
  listDevices,
  installApk,
  launchApp,
  getLogcat,
  takeScreenshot,
  pullFile,
  pushFile,
} from "./tools/device";
import { runInstrumentationTests } from "./tools/test";

const server = new McpServer({
  name: "android-dev-mcp",
  version: "1.0.0",
});

// ─── diagnostics.android.health ─────────────────────────────────────────────
server.tool(
  "diagnostics.android.health",
  "Check that all required Android CLI tools (adb, emulator, aapt2, apksigner, java) are reachable and print their versions.",
  {},
  async () => {
    const config = loadConfig();
    const report = await runHealthCheck(config);
    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
    };
  }
);

// ─── android.project.detect ──────────────────────────────────────────────────
server.tool(
  "android.project.detect",
  "Detect an Android Gradle project at the given path and return metadata (modules, build variants, gradlew location).",
  {
    projectDir: z
      .string()
      .describe("Absolute path to the Android project root (or a sub-directory)."),
  },
  async ({ projectDir }) => {
    const config = loadConfig();
    const info = detectProject(projectDir, config);
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
    };
  }
);

// ─── android.gradle.tasks.list ───────────────────────────────────────────────
server.tool(
  "android.gradle.tasks.list",
  "List all available Gradle tasks in the Android project.",
  {
    projectDir: z.string().describe("Absolute path to the Android project root."),
  },
  async ({ projectDir }) => {
    const config = loadConfig();
    const result = await listGradleTasks(projectDir, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout
              : `Exit ${result.exitCode}\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── android.gradle.run ───────────────────────────────────────────────────────
server.tool(
  "android.gradle.run",
  "Run a Gradle task in the Android project (read-only tasks only; write-modifying tasks are blocked).",
  {
    projectDir: z.string().describe("Absolute path to the Android project root."),
    task: z.string().describe("Gradle task name, e.g. ':app:lint' or 'test'."),
    extraArgs: z
      .array(z.string())
      .optional()
      .describe("Additional Gradle arguments, e.g. ['--stacktrace']."),
  },
  async ({ projectDir, task, extraArgs }) => {
    const config = loadConfig();
    const result = await runGradleTask(projectDir, task, extraArgs ?? [], config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout
              : `Exit ${result.exitCode}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── android.build.apk ───────────────────────────────────────────────────────
server.tool(
  "android.build.apk",
  "Build an APK for the specified module and variant using the Gradle wrapper.",
  {
    projectDir: z.string().describe("Absolute path to the Android project root."),
    module: z.string().default("app").describe("Gradle module name (e.g. 'app')."),
    variant: z.string().default("debug").describe("Build variant (e.g. 'debug', 'release')."),
  },
  async ({ projectDir, module, variant }) => {
    const config = loadConfig();
    const result = await buildApk(projectDir, module, variant, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? `Build succeeded.\n${result.stdout}`
              : `Build FAILED (exit ${result.exitCode})\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── android.build.aab ───────────────────────────────────────────────────────
server.tool(
  "android.build.aab",
  "Build an Android App Bundle (.aab) for the specified module and variant.",
  {
    projectDir: z.string().describe("Absolute path to the Android project root."),
    module: z.string().default("app").describe("Gradle module name (e.g. 'app')."),
    variant: z.string().default("release").describe("Build variant (e.g. 'release')."),
  },
  async ({ projectDir, module, variant }) => {
    const config = loadConfig();
    const result = await buildAab(projectDir, module, variant, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? `Bundle build succeeded.\n${result.stdout}`
              : `Bundle build FAILED (exit ${result.exitCode})\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── android.artifact.verify ─────────────────────────────────────────────────
server.tool(
  "android.artifact.verify",
  "Verify an APK (with apksigner) or .aab (with bundletool validate). Pass the path relative to workDir.",
  {
    workDir: z.string().describe("Absolute path within the allowed working directories."),
    artifactRelPath: z
      .string()
      .describe("Path to the APK or AAB, relative to workDir."),
  },
  async ({ workDir, artifactRelPath }) => {
    const config = loadConfig();
    const result = await verifyArtifact(workDir, artifactRelPath, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout
              : `Verify FAILED (exit ${result.exitCode})\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── device.list ─────────────────────────────────────────────────────────────
server.tool(
  "device.list",
  "List connected Android devices and emulators (adb devices -l).",
  {},
  async () => {
    const config = loadConfig();
    const result = await listDevices(config);
    return {
      content: [{ type: "text", text: result.stdout || result.stderr }],
    };
  }
);

// ─── device.install ──────────────────────────────────────────────────────────
server.tool(
  "device.install",
  "Install an APK on a connected device or emulator.",
  {
    workDir: z.string().describe("Absolute path within the allowed working directories."),
    apkRelPath: z.string().describe("Path to the APK file relative to workDir."),
    deviceSerial: z
      .string()
      .optional()
      .describe("Device serial from 'device.list'. Omit if only one device is connected."),
  },
  async ({ workDir, apkRelPath, deviceSerial }) => {
    const config = loadConfig();
    const result = await installApk(workDir, apkRelPath, deviceSerial, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout
              : `Install FAILED (exit ${result.exitCode})\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── device.launch ───────────────────────────────────────────────────────────
server.tool(
  "device.launch",
  "Launch an app on a connected device using adb shell am start.",
  {
    packageName: z.string().describe("App package name, e.g. 'com.example.myapp'."),
    activityName: z
      .string()
      .describe("Fully qualified activity name, e.g. 'com.example.myapp.MainActivity'."),
    deviceSerial: z.string().optional().describe("Device serial (optional)."),
  },
  async ({ packageName, activityName, deviceSerial }) => {
    const config = loadConfig();
    const result = await launchApp(packageName, activityName, deviceSerial, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout || "App launched."
              : `Launch FAILED (exit ${result.exitCode})\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── device.logcat ───────────────────────────────────────────────────────────
server.tool(
  "device.logcat",
  "Retrieve bounded logcat output (dump-and-exit, capped at 5000 lines).",
  {
    lines: z
      .number()
      .int()
      .min(1)
      .max(5000)
      .default(200)
      .describe("Number of recent log lines to retrieve (max 5000)."),
    filterTag: z
      .string()
      .optional()
      .describe("Optional logcat filter tag, e.g. 'MyApp:D *:S'."),
    deviceSerial: z.string().optional().describe("Device serial (optional)."),
  },
  async ({ lines, filterTag, deviceSerial }) => {
    const config = loadConfig();
    const result = await getLogcat(deviceSerial, lines, filterTag, config);
    return {
      content: [{ type: "text", text: result.stdout || result.stderr }],
    };
  }
);

// ─── device.screenshot ───────────────────────────────────────────────────────
server.tool(
  "device.screenshot",
  "Take a screenshot from a connected device and save it locally.",
  {
    workDir: z
      .string()
      .describe("Absolute path within the allowed working directories where the image will be saved."),
    outputRelPath: z
      .string()
      .default("screenshot.png")
      .describe("Output filename relative to workDir (e.g. 'screenshots/screen.png')."),
    deviceSerial: z.string().optional().describe("Device serial (optional)."),
  },
  async ({ workDir, outputRelPath, deviceSerial }) => {
    const config = loadConfig();
    const result = await takeScreenshot(workDir, outputRelPath, deviceSerial, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? `Screenshot saved to ${outputRelPath}`
              : `Screenshot FAILED (exit ${result.exitCode})\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── device.pull ─────────────────────────────────────────────────────────────
server.tool(
  "device.pull",
  "Pull a file from a connected device to the local machine.",
  {
    workDir: z.string().describe("Absolute local working directory (within allowed dirs)."),
    devicePath: z.string().describe("Absolute path on the device, e.g. '/sdcard/file.txt'."),
    localRelPath: z
      .string()
      .describe("Destination path relative to workDir."),
    deviceSerial: z.string().optional().describe("Device serial (optional)."),
  },
  async ({ workDir, devicePath, localRelPath, deviceSerial }) => {
    const config = loadConfig();
    const result = await pullFile(workDir, devicePath, localRelPath, deviceSerial, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout || `Pulled ${devicePath} -> ${localRelPath}`
              : `Pull FAILED (exit ${result.exitCode})\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── device.push ─────────────────────────────────────────────────────────────
server.tool(
  "device.push",
  "Push a local file to a connected device.",
  {
    workDir: z.string().describe("Absolute local working directory (within allowed dirs)."),
    localRelPath: z.string().describe("Source file path relative to workDir."),
    devicePath: z.string().describe("Destination path on the device, e.g. '/sdcard/file.txt'."),
    deviceSerial: z.string().optional().describe("Device serial (optional)."),
  },
  async ({ workDir, localRelPath, devicePath, deviceSerial }) => {
    const config = loadConfig();
    const result = await pushFile(workDir, localRelPath, devicePath, deviceSerial, config);
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout || `Pushed ${localRelPath} -> ${devicePath}`
              : `Push FAILED (exit ${result.exitCode})\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── test.instrumentation.run ────────────────────────────────────────────────
server.tool(
  "test.instrumentation.run",
  "Run Android instrumentation tests on a connected device via adb.",
  {
    workDir: z.string().describe("Absolute path to the Android project root (within allowed dirs)."),
    packageName: z.string().describe("App package name, e.g. 'com.example.myapp'."),
    testPackageName: z
      .string()
      .describe("Test package name, e.g. 'com.example.myapp.test'."),
    runner: z
      .string()
      .default("androidx.test.runner.AndroidJUnitRunner")
      .describe("Instrumentation runner class."),
    testClass: z
      .string()
      .optional()
      .describe("Specific test class or method: 'com.example.MyTest' or 'com.example.MyTest#myMethod'."),
    extras: z
      .record(z.string(), z.string())
      .optional()
      .describe("Additional -e key value pairs for the instrumentation command."),
    deviceSerial: z.string().optional().describe("Device serial (optional)."),
  },
  async ({ workDir, packageName, testPackageName, runner, testClass, extras, deviceSerial }) => {
    const config = loadConfig();
    const result = await runInstrumentationTests(
      workDir,
      { packageName, testPackageName, runner, testClass, extras, deviceSerial },
      config
    );
    return {
      content: [
        {
          type: "text",
          text:
            result.exitCode === 0
              ? result.stdout
              : `Tests FAILED (exit ${result.exitCode})\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
        },
      ],
    };
  }
);

// ─── Start server ─────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("Android Dev MCP server running on stdio.\n");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
