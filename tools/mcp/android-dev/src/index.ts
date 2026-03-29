#!/usr/bin/env node
/**
 * index.ts – Android Dev MCP Server entry point
 *
 * Exposes all Android development tools via the Model Context Protocol (MCP)
 * over stdio, making it compatible with VS Code Copilot Chat and any other
 * MCP-aware client.
 *
 * Start with:  node dist/index.js
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { projectDetect, ProjectDetectSchema } from "./tools/project.js";
import { gradleTasksList, GradleTasksListSchema, gradleRun, GradleRunSchema } from "./tools/gradle.js";
import { buildApk, BuildApkSchema, buildAab, BuildAabSchema } from "./tools/build.js";
import { artifactVerify, ArtifactVerifySchema } from "./tools/artifact.js";
import {
  deviceList,
  DeviceListSchema,
  deviceInstall,
  DeviceInstallSchema,
  deviceLaunch,
  DeviceLaunchSchema,
  deviceLogcat,
  DeviceLogcatSchema,
  deviceScreenshot,
  DeviceScreenshotSchema,
  devicePull,
  DevicePullSchema,
  devicePush,
  DevicePushSchema,
} from "./tools/device.js";
import { testInstrumentationRun, TestInstrumentationRunSchema } from "./tools/test.js";
import { diagnosticsAndroidHealth, DiagnosticsHealthSchema } from "./tools/diagnostics.js";

const server = new McpServer({
  name: "android-dev-mcp",
  version: "1.0.0",
});

// ── Project ──────────────────────────────────────────────────────────────────

server.tool(
  "android_project_detect",
  "Detect Android project structure: modules, flavors, build variants, application IDs, signing configs, and Gradle wrapper.",
  ProjectDetectSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await projectDetect(input as z.infer<typeof ProjectDetectSchema>) }],
  })
);

// ── Gradle ───────────────────────────────────────────────────────────────────

server.tool(
  "android_gradle_tasks_list",
  "List all available Gradle tasks for an Android project (or a specific module).",
  GradleTasksListSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await gradleTasksList(input as z.infer<typeof GradleTasksListSchema>) }],
  })
);

server.tool(
  "android_gradle_run",
  "Run a Gradle task (e.g. ':app:assembleDebug', 'clean', ':app:testDebugUnitTest'). Source-modifying tasks are blocked.",
  GradleRunSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await gradleRun(input as z.infer<typeof GradleRunSchema>) }],
  })
);

// ── Build ────────────────────────────────────────────────────────────────────

server.tool(
  "android_build_apk",
  "Build an APK for the specified module, flavor, and build type using the Gradle wrapper.",
  BuildApkSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await buildApk(input as z.infer<typeof BuildApkSchema>) }],
  })
);

server.tool(
  "android_build_aab",
  "Build an Android App Bundle (AAB) for the specified module, flavor, and build type.",
  BuildAabSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await buildAab(input as z.infer<typeof BuildAabSchema>) }],
  })
);

// ── Artifact verification ────────────────────────────────────────────────────

server.tool(
  "android_artifact_verify",
  "Verify an APK or AAB artifact using apksigner, aapt2, and bundletool (read-only).",
  ArtifactVerifySchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await artifactVerify(input as z.infer<typeof ArtifactVerifySchema>) }],
  })
);

// ── Device ───────────────────────────────────────────────────────────────────

server.tool(
  "device_list",
  "List all connected Android devices and emulators via ADB.",
  DeviceListSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await deviceList(input as z.infer<typeof DeviceListSchema>) }],
  })
);

server.tool(
  "device_install",
  "Install an APK onto a connected Android device or emulator.",
  DeviceInstallSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await deviceInstall(input as z.infer<typeof DeviceInstallSchema>) }],
  })
);

server.tool(
  "device_launch",
  "Launch an installed app on a connected device by package name.",
  DeviceLaunchSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await deviceLaunch(input as z.infer<typeof DeviceLaunchSchema>) }],
  })
);

server.tool(
  "device_logcat",
  "Read recent logcat output from a connected Android device.",
  DeviceLogcatSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await deviceLogcat(input as z.infer<typeof DeviceLogcatSchema>) }],
  })
);

server.tool(
  "device_screenshot",
  "Take a screenshot of a connected Android device and save it to a local file.",
  DeviceScreenshotSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await deviceScreenshot(input as z.infer<typeof DeviceScreenshotSchema>) }],
  })
);

server.tool(
  "device_pull",
  "Pull a file from a connected Android device to the local machine.",
  DevicePullSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await devicePull(input as z.infer<typeof DevicePullSchema>) }],
  })
);

server.tool(
  "device_push",
  "Push a local file to a connected Android device.",
  DevicePushSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await devicePush(input as z.infer<typeof DevicePushSchema>) }],
  })
);

// ── Testing ──────────────────────────────────────────────────────────────────

server.tool(
  "test_instrumentation_run",
  "Run Android instrumentation tests via Gradle connectedAndroidTest (or directly via ADB).",
  TestInstrumentationRunSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await testInstrumentationRun(input as z.infer<typeof TestInstrumentationRunSchema>) }],
  })
);

// ── Diagnostics ──────────────────────────────────────────────────────────────

server.tool(
  "diagnostics_android_health",
  "Run a full Android development environment health check: SDK, JDK, ADB, build-tools, emulator, Gradle wrapper.",
  DiagnosticsHealthSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: await diagnosticsAndroidHealth(input as z.infer<typeof DiagnosticsHealthSchema>) }],
  })
);

// ── Start server ─────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
