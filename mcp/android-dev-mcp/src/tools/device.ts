import path from "node:path";
import os from "node:os";
import { z } from "zod";
import { AndroidMcpConfig } from "../config.js";
import { run, formatResult } from "../runner.js";

// ── Device list ───────────────────────────────────────────────────────────────

export const listDevicesSchema = z.object({});

export async function listDevices(config: AndroidMcpConfig): Promise<string> {
  const adb = config.adb || "adb";
  const result = await run(adb, ["devices", "-l"], config, {
    timeoutMs: 15_000,
  });
  return formatResult(result);
}

// ── Install APK ───────────────────────────────────────────────────────────────

export const installApkSchema = z.object({
  apkPath: z.string().describe("Absolute path to the APK to install"),
  deviceId: z
    .string()
    .optional()
    .describe("Target device serial (from 'adb devices'). Uses default if omitted."),
  reinstall: z
    .boolean()
    .optional()
    .default(false)
    .describe("Pass -r to reinstall keeping data"),
  grantPermissions: z
    .boolean()
    .optional()
    .default(true)
    .describe("Pass -g to grant all manifest permissions"),
});

export type InstallApkInput = z.infer<typeof installApkSchema>;

export async function installApk(
  input: InstallApkInput,
  config: AndroidMcpConfig
): Promise<string> {
  const adb = config.adb || "adb";
  const args: string[] = [];

  if (input.deviceId) args.push("-s", input.deviceId);

  args.push("install");
  if (input.reinstall) args.push("-r");
  if (input.grantPermissions) args.push("-g");
  args.push(input.apkPath);

  const result = await run(adb, args, config);
  return formatResult(result);
}

// ── Launch app ────────────────────────────────────────────────────────────────

export const launchAppSchema = z.object({
  packageName: z.string().describe("Application package name (e.g. 'com.example.app')"),
  activityName: z
    .string()
    .optional()
    .describe(
      "Activity to launch (e.g. '.MainActivity'). If omitted, uses the app's main launcher activity."
    ),
  deviceId: z.string().optional().describe("Target device serial"),
});

export type LaunchAppInput = z.infer<typeof launchAppSchema>;

export async function launchApp(
  input: LaunchAppInput,
  config: AndroidMcpConfig
): Promise<string> {
  const adb = config.adb || "adb";
  const args: string[] = [];

  if (input.deviceId) args.push("-s", input.deviceId);

  const component = input.activityName
    ? `${input.packageName}/${input.activityName}`
    : input.packageName;

  if (input.activityName) {
    args.push(
      "shell",
      "am",
      "start",
      "-n",
      component
    );
  } else {
    args.push(
      "shell",
      "monkey",
      "-p",
      input.packageName,
      "-c",
      "android.intent.category.LAUNCHER",
      "1"
    );
  }

  const result = await run(adb, args, config);
  return formatResult(result);
}

// ── Logcat ────────────────────────────────────────────────────────────────────

export const logcatSchema = z.object({
  deviceId: z.string().optional().describe("Target device serial"),
  filter: z
    .string()
    .optional()
    .describe("Logcat filter spec (e.g. 'MyTag:D *:S')"),
  maxLines: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of lines to return (default from config)"),
  dumpAndExit: z
    .boolean()
    .optional()
    .default(true)
    .describe("Use -d to dump current log buffer and exit (bounded mode)"),
  pid: z
    .number()
    .int()
    .optional()
    .describe("Filter logcat to a specific process id"),
});

export type LogcatInput = z.infer<typeof logcatSchema>;

export async function getLogcat(
  input: LogcatInput,
  config: AndroidMcpConfig
): Promise<string> {
  const adb = config.adb || "adb";
  const maxLines = input.maxLines ?? config.logcatMaxLines;
  const args: string[] = [];

  if (input.deviceId) args.push("-s", input.deviceId);

  args.push("logcat");
  if (input.dumpAndExit) args.push("-d");
  if (input.pid !== undefined) args.push("--pid", String(input.pid));
  if (input.filter) args.push(...input.filter.split(" ").filter(Boolean));

  // Cap time to avoid hanging — even with -d, large buffers can be slow
  const result = await run(adb, args, config, { timeoutMs: 60_000 });
  let lines = (result.stdout + (result.stderr ? `\nSTDERR: ${result.stderr}` : ""))
    .split("\n");

  if (lines.length > maxLines) {
    lines = [
      `[truncated to last ${maxLines} lines]`,
      ...lines.slice(lines.length - maxLines),
    ];
  }

  return lines.join("\n");
}

// ── Screenshot ────────────────────────────────────────────────────────────────

export const screenshotSchema = z.object({
  deviceId: z.string().optional().describe("Target device serial"),
  outputPath: z
    .string()
    .optional()
    .describe(
      "Local path to save the PNG screenshot. Defaults to a temp file."
    ),
});

export type ScreenshotInput = z.infer<typeof screenshotSchema>;

export async function takeScreenshot(
  input: ScreenshotInput,
  config: AndroidMcpConfig
): Promise<string> {
  const adb = config.adb || "adb";
  const remotePath = "/sdcard/android_dev_mcp_screenshot.png";
  const localPath =
    input.outputPath ??
    path.join(os.tmpdir(), `android_screenshot_${Date.now()}.png`);

  const adbBase = (subcmd: string[]) => {
    const a: string[] = [];
    if (input.deviceId) a.push("-s", input.deviceId);
    a.push(...subcmd);
    return a;
  };

  // Take screenshot
  const capResult = await run(
    adb,
    adbBase(["shell", "screencap", "-p", remotePath]),
    config,
    { timeoutMs: 30_000 }
  );
  if (capResult.exitCode !== 0) {
    return `Failed to capture screenshot:\n${formatResult(capResult)}`;
  }

  // Pull to local
  const pullResult = await run(
    adb,
    adbBase(["pull", remotePath, localPath]),
    config,
    { timeoutMs: 30_000 }
  );

  // Clean up remote file (best-effort)
  await run(adb, adbBase(["shell", "rm", remotePath]), config, {
    timeoutMs: 10_000,
  });

  if (pullResult.exitCode !== 0) {
    return `Screenshot captured but pull failed:\n${formatResult(pullResult)}`;
  }

  return `Screenshot saved to: ${localPath}`;
}

// ── Pull ──────────────────────────────────────────────────────────────────────

export const pullFileSchema = z.object({
  deviceId: z.string().optional().describe("Target device serial"),
  remotePath: z.string().describe("Path on the device to pull"),
  localPath: z.string().describe("Local destination path"),
});

export type PullFileInput = z.infer<typeof pullFileSchema>;

export async function pullFile(
  input: PullFileInput,
  config: AndroidMcpConfig
): Promise<string> {
  const adb = config.adb || "adb";
  const args: string[] = [];
  if (input.deviceId) args.push("-s", input.deviceId);
  args.push("pull", input.remotePath, input.localPath);
  const result = await run(adb, args, config);
  return formatResult(result);
}

// ── Push ──────────────────────────────────────────────────────────────────────

export const pushFileSchema = z.object({
  deviceId: z.string().optional().describe("Target device serial"),
  localPath: z.string().describe("Local file path to push"),
  remotePath: z.string().describe("Destination path on the device"),
});

export type PushFileInput = z.infer<typeof pushFileSchema>;

export async function pushFile(
  input: PushFileInput,
  config: AndroidMcpConfig
): Promise<string> {
  const adb = config.adb || "adb";
  const args: string[] = [];
  if (input.deviceId) args.push("-s", input.deviceId);
  args.push("push", input.localPath, input.remotePath);
  const result = await run(adb, args, config);
  return formatResult(result);
}
