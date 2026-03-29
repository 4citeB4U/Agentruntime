#!/usr/bin/env node
/**
 * Android Dev MCP Server
 *
 * A BYO (bring-your-own-tools) MCP server that wraps local Android CLI
 * tooling (adb, gradlew, apksigner, bundletool, aapt2, emulator, etc.)
 * behind a cohesive, offline-first tool schema for GitHub Copilot Chat.
 *
 * Run:  node dist/index.js
 * or:   npx android-dev-mcp
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { loadConfig } from "./config.js";

import {
  detectProjectSchema,
  detectProject,
} from "./tools/project.js";

import {
  listTasksSchema,
  runTaskSchema,
  buildApkSchema,
  buildAabSchema,
  listGradleTasks,
  runGradleTask,
  buildApk,
  buildAab,
} from "./tools/gradle.js";

import {
  signArtifactSchema,
  verifyArtifactSchema,
  signArtifact,
  verifyArtifact,
} from "./tools/artifact.js";

import {
  listDevicesSchema,
  installApkSchema,
  launchAppSchema,
  logcatSchema,
  screenshotSchema,
  pullFileSchema,
  pushFileSchema,
  listDevices,
  installApk,
  launchApp,
  getLogcat,
  takeScreenshot,
  pullFile,
  pushFile,
} from "./tools/device.js";

import {
  instrumentationTestSchema,
  maestroTestSchema,
  runInstrumentationTests,
  runMaestroFlow,
} from "./tools/test.js";

import { healthSchema, runHealthCheck } from "./tools/diagnostics.js";

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const config = loadConfig();

const server = new McpServer({
  name: "android-dev-mcp",
  version: "1.0.0",
});

// ── Tool: android.project.detect ──────────────────────────────────────────────

server.tool(
  "android.project.detect",
  "Detect and inspect an Android project: find Gradle modules, build variants, SDK path, and Gradle version.",
  detectProjectSchema.shape,
  async (input) => {
    const text = await detectProject(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: android.gradle.tasks ────────────────────────────────────────────────

server.tool(
  "android.gradle.tasks",
  "List available Gradle tasks for the Android project (optionally filtered).",
  listTasksSchema.shape,
  async (input) => {
    const text = await listGradleTasks(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: android.gradle.run ──────────────────────────────────────────────────

server.tool(
  "android.gradle.run",
  "Run any Gradle task in an Android project (e.g. ':app:assembleDebug', 'clean', 'test').",
  runTaskSchema.shape,
  async (input) => {
    const text = await runGradleTask(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: android.build.apk ───────────────────────────────────────────────────

server.tool(
  "android.build.apk",
  "Build an APK for the specified module and build variant using Gradle.",
  buildApkSchema.shape,
  async (input) => {
    const text = await buildApk(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: android.build.aab ───────────────────────────────────────────────────

server.tool(
  "android.build.aab",
  "Build an Android App Bundle (AAB) for the specified module and variant using Gradle.",
  buildAabSchema.shape,
  async (input) => {
    const text = await buildAab(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: android.artifact.sign ───────────────────────────────────────────────

server.tool(
  "android.artifact.sign",
  "Sign an APK or AAB using apksigner and the configured keystore.",
  signArtifactSchema.shape,
  async (input) => {
    const text = await signArtifact(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: android.artifact.verify ────────────────────────────────────────────

server.tool(
  "android.artifact.verify",
  "Verify the signature of an APK or AAB using apksigner.",
  verifyArtifactSchema.shape,
  async (input) => {
    const text = await verifyArtifact(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: device.list ─────────────────────────────────────────────────────────

server.tool(
  "device.list",
  "List connected Android devices and emulators (runs 'adb devices -l').",
  listDevicesSchema.shape,
  async () => {
    const text = await listDevices(config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: device.install ──────────────────────────────────────────────────────

server.tool(
  "device.install",
  "Install an APK on a connected Android device or emulator.",
  installApkSchema.shape,
  async (input) => {
    const text = await installApk(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: device.launch ───────────────────────────────────────────────────────

server.tool(
  "device.launch",
  "Launch an installed Android app on a device or emulator.",
  launchAppSchema.shape,
  async (input) => {
    const text = await launchApp(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: device.logcat ───────────────────────────────────────────────────────

server.tool(
  "device.logcat",
  "Capture logcat output from a device (bounded dump mode by default; use dumpAndExit:false for streaming).",
  logcatSchema.shape,
  async (input) => {
    const text = await getLogcat(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: device.screenshot ───────────────────────────────────────────────────

server.tool(
  "device.screenshot",
  "Take a screenshot of the current device screen and save it locally.",
  screenshotSchema.shape,
  async (input) => {
    const text = await takeScreenshot(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: device.pull ─────────────────────────────────────────────────────────

server.tool(
  "device.pull",
  "Pull a file or directory from a connected Android device to the local machine.",
  pullFileSchema.shape,
  async (input) => {
    const text = await pullFile(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: device.push ─────────────────────────────────────────────────────────

server.tool(
  "device.push",
  "Push a local file or directory to a connected Android device.",
  pushFileSchema.shape,
  async (input) => {
    const text = await pushFile(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: test.instrumentation.run ───────────────────────────────────────────

server.tool(
  "test.instrumentation.run",
  "Run Android instrumentation tests on a device or emulator using 'adb shell am instrument'.",
  instrumentationTestSchema.shape,
  async (input) => {
    const text = await runInstrumentationTests(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: test.maestro.run (optional) ────────────────────────────────────────

server.tool(
  "test.maestro.run",
  "Run a Maestro E2E flow file against a device (requires Maestro installed and configured).",
  maestroTestSchema.shape,
  async (input) => {
    const text = await runMaestroFlow(input, config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Tool: diagnostics.android.health ─────────────────────────────────────────

server.tool(
  "diagnostics.android.health",
  "Run a full Android development environment health check: SDK, JDK, adb, signing tools, keystore, and offline-mode verification.",
  healthSchema.shape,
  async () => {
    const text = await runHealthCheck(config);
    return { content: [{ type: "text", text }] };
  }
);

// ── Start server ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[android-dev-mcp] Server started (stdio transport)\n");
}

main().catch((err) => {
  process.stderr.write(`[android-dev-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
