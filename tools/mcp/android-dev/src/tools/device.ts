/**
 * tools/device.ts – device.list/install/launch/logcat/screenshot/pull/push
 *
 * Wraps ADB for device operations.  All paths supplied for pull/push are
 * validated against the allowed-project-roots allowlist.
 */

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertAllowedPath, loadConfig, resolveAdb } from "../config.js";
import { run, runFormatted } from "../runner.js";

// ─── device.list ─────────────────────────────────────────────────────────────

export const DeviceListSchema = z.object({});

export async function deviceList(_input: z.infer<typeof DeviceListSchema>): Promise<string> {
  const cfg = loadConfig();
  const adb = resolveAdb(cfg);
  return runFormatted(adb, ["devices", "-l"], { timeoutMs: 10_000 });
}

// ─── device.install ──────────────────────────────────────────────────────────

export const DeviceInstallSchema = z.object({
  apkPath: z
    .string()
    .describe("Absolute path to the APK to install"),
  deviceId: z
    .string()
    .optional()
    .describe("ADB device serial (from 'device.list'); omit to target the only connected device"),
  reinstall: z
    .boolean()
    .default(false)
    .describe("Pass -r to reinstall, keeping data"),
});

export async function deviceInstall(input: z.infer<typeof DeviceInstallSchema>): Promise<string> {
  const cfg = loadConfig();
  assertAllowedPath(path.dirname(input.apkPath), cfg);
  const adb = resolveAdb(cfg);

  if (!fs.existsSync(input.apkPath)) {
    return `Error: APK not found: ${input.apkPath}`;
  }

  const args: string[] = [];
  if (input.deviceId) args.push("-s", input.deviceId);
  args.push("install");
  if (input.reinstall) args.push("-r");
  args.push(input.apkPath);

  return runFormatted(adb, args, { timeoutMs: 60_000 });
}

// ─── device.launch ───────────────────────────────────────────────────────────

export const DeviceLaunchSchema = z.object({
  packageName: z
    .string()
    .describe("Android package name, e.g. 'com.example.myapp'"),
  activityName: z
    .string()
    .optional()
    .describe("Fully-qualified activity name; auto-detected via aapt if omitted"),
  deviceId: z.string().optional().describe("ADB device serial"),
});

export async function deviceLaunch(input: z.infer<typeof DeviceLaunchSchema>): Promise<string> {
  const cfg = loadConfig();
  const adb = resolveAdb(cfg);

  const args: string[] = [];
  if (input.deviceId) args.push("-s", input.deviceId);
  if (input.activityName) {
    // Use -n component when the activity is explicitly known
    args.push("shell", "am", "start", "-n", `${input.packageName}/${input.activityName}`);
  } else {
    // No explicit activity: let Android resolve the main launcher intent
    args.push(
      "shell", "am", "start",
      "-a", "android.intent.action.MAIN",
      "-c", "android.intent.category.LAUNCHER",
      input.packageName,
    );
  }

  return runFormatted(adb, args, { timeoutMs: 15_000 });
}

// ─── device.logcat ───────────────────────────────────────────────────────────

export const DeviceLogcatSchema = z.object({
  deviceId: z.string().optional().describe("ADB device serial"),
  filter: z
    .string()
    .optional()
    .describe("Logcat filter spec, e.g. 'MyTag:D *:S'"),
  lines: z
    .number()
    .int()
    .min(1)
    .max(5000)
    .default(200)
    .describe("Number of recent log lines to return (1–5000)"),
});

export async function deviceLogcat(input: z.infer<typeof DeviceLogcatSchema>): Promise<string> {
  const cfg = loadConfig();
  const adb = resolveAdb(cfg);

  const args: string[] = [];
  if (input.deviceId) args.push("-s", input.deviceId);
  args.push("logcat", "-d", "-t", String(input.lines));
  if (input.filter) args.push(...input.filter.split(/\s+/));

  return runFormatted(adb, args, { timeoutMs: 20_000 });
}

// ─── device.screenshot ───────────────────────────────────────────────────────

export const DeviceScreenshotSchema = z.object({
  deviceId: z.string().optional().describe("ADB device serial"),
  saveTo: z
    .string()
    .describe("Absolute local path where the screenshot PNG will be saved"),
});

export async function deviceScreenshot(
  input: z.infer<typeof DeviceScreenshotSchema>
): Promise<string> {
  const cfg = loadConfig();
  assertAllowedPath(path.dirname(input.saveTo), cfg);
  const adb = resolveAdb(cfg);

  // Capture on device to a temp path, then pull
  const deviceTmpPath = "/sdcard/mcp_screenshot_tmp.png";

  const captureArgs: string[] = [];
  if (input.deviceId) captureArgs.push("-s", input.deviceId);
  captureArgs.push("shell", "screencap", "-p", deviceTmpPath);
  const captureResult = await run(adb, captureArgs, { timeoutMs: 15_000 });
  if (captureResult.exitCode !== 0) {
    return `screencap failed:\n${captureResult.stderr || captureResult.stdout}`;
  }

  const pullArgs: string[] = [];
  if (input.deviceId) pullArgs.push("-s", input.deviceId);
  pullArgs.push("pull", deviceTmpPath, input.saveTo);
  const pullResult = await runFormatted(adb, pullArgs, { timeoutMs: 15_000 });

  // Clean up device temp file (best-effort)
  const cleanArgs: string[] = [];
  if (input.deviceId) cleanArgs.push("-s", input.deviceId);
  cleanArgs.push("shell", "rm", "-f", deviceTmpPath);
  await run(adb, cleanArgs, { timeoutMs: 5_000 });

  return `Screenshot saved to: ${input.saveTo}\n\n${pullResult}`;
}

// ─── device.pull ─────────────────────────────────────────────────────────────

export const DevicePullSchema = z.object({
  deviceId: z.string().optional().describe("ADB device serial"),
  remotePath: z
    .string()
    .describe("Path on the Android device, e.g. '/sdcard/Download/file.txt'"),
  localPath: z
    .string()
    .describe("Absolute local destination path"),
});

export async function devicePull(input: z.infer<typeof DevicePullSchema>): Promise<string> {
  const cfg = loadConfig();
  assertAllowedPath(path.dirname(input.localPath), cfg);
  const adb = resolveAdb(cfg);

  const args: string[] = [];
  if (input.deviceId) args.push("-s", input.deviceId);
  args.push("pull", input.remotePath, input.localPath);

  return runFormatted(adb, args, { timeoutMs: cfg.defaultTimeoutMs });
}

// ─── device.push ─────────────────────────────────────────────────────────────

export const DevicePushSchema = z.object({
  deviceId: z.string().optional().describe("ADB device serial"),
  localPath: z
    .string()
    .describe("Absolute local source path"),
  remotePath: z
    .string()
    .describe("Destination path on the Android device, e.g. '/sdcard/test-data/'"),
});

export async function devicePush(input: z.infer<typeof DevicePushSchema>): Promise<string> {
  const cfg = loadConfig();
  assertAllowedPath(path.dirname(input.localPath), cfg);
  const adb = resolveAdb(cfg);

  if (!fs.existsSync(input.localPath)) {
    return `Error: local file not found: ${input.localPath}`;
  }

  const args: string[] = [];
  if (input.deviceId) args.push("-s", input.deviceId);
  args.push("push", input.localPath, input.remotePath);

  return runFormatted(adb, args, { timeoutMs: cfg.defaultTimeoutMs });
}
