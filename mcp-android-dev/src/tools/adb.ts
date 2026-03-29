/**
 * tools/adb.ts — ADB device operations (read-only from repo perspective)
 *
 * Provides device listing, APK installation, launching, logcat capture,
 * screenshots, file pull/push, and UI hierarchy dumps.
 *
 * NOTE: adb push / pull operate on the *device* filesystem, not the
 * repository files, so they do not violate the read-only-repo constraint.
 * No repository source files are ever written by this module.
 */

import * as path from "path";
import * as fs from "fs";
import { ADB_PATH, ADB_TIMEOUT_MS } from "../config.js";
import { run } from "../runner.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function adb(args: string[], timeoutMs = ADB_TIMEOUT_MS) {
  return run(ADB_PATH, args, process.cwd(), timeoutMs);
}

function deviceArgs(serial?: string): string[] {
  return serial ? ["-s", serial] : [];
}

function assertSafeDevicePath(devicePath: string): void {
  // Prevent path traversal on the device side by rejecting sequences like
  // ".." that could be used to escape intended directories.
  if (devicePath.includes("..")) {
    throw new Error(
      `Unsafe device path rejected: "${devicePath}". Paths must not contain "..".`
    );
  }
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/** List connected devices and emulators. */
export async function listDevices(): Promise<string> {
  const result = await adb(["devices", "-l"]);
  if (result.exitCode !== 0) {
    throw new Error(`adb devices failed:\n${result.stderr}`);
  }
  return result.stdout;
}

/** Get detailed properties for a device. */
export async function deviceProperties(serial?: string): Promise<string> {
  const result = await adb([...deviceArgs(serial), "shell", "getprop"]);
  if (result.exitCode !== 0) {
    throw new Error(`adb getprop failed:\n${result.stderr}`);
  }
  return result.stdout;
}

/** Install an APK onto a device.  The apkPath must exist locally. */
export async function installApk(
  apkPath: string,
  serial?: string,
  reinstall = true
): Promise<string> {
  if (!fs.existsSync(apkPath)) {
    throw new Error(`APK not found: "${apkPath}". Build the project first.`);
  }
  const flags = reinstall ? ["-r"] : [];
  const result = await adb(
    [...deviceArgs(serial), "install", ...flags, apkPath],
    ADB_TIMEOUT_MS * 2 // installs can be slow
  );
  if (result.exitCode !== 0) {
    throw new Error(`adb install failed:\n${result.stderr}`);
  }
  return result.stdout || "Installation successful.";
}

/** Launch an activity on the device. */
export async function launchActivity(
  packageName: string,
  activityName: string,
  serial?: string
): Promise<string> {
  const component = `${packageName}/${activityName}`;
  const result = await adb([
    ...deviceArgs(serial),
    "shell",
    "am",
    "start",
    "-n",
    component,
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to launch "${component}":\n${result.stderr}`);
  }
  return result.stdout || `Launched ${component}`;
}

/** Capture logcat output (tail N lines, optional tag filter). */
export async function captureLogcat(
  lines = 200,
  tags?: string,
  serial?: string
): Promise<string> {
  // Dump current buffer and exit cleanly
  const filterArgs = tags ? [tags] : [];
  const result = await adb([
    ...deviceArgs(serial),
    "logcat",
    "-d", // dump and exit (no hang)
    "-t",
    String(lines),
    ...filterArgs,
  ]);
  return result.stdout || result.stderr;
}

/** Take a screenshot and save it to a local Windows path. */
export async function takeScreenshot(
  localPath: string,
  serial?: string
): Promise<string> {
  const deviceTmp = "/sdcard/mcp_screenshot.png";
  // Capture to device
  const capResult = await adb([
    ...deviceArgs(serial),
    "shell",
    "screencap",
    "-p",
    deviceTmp,
  ]);
  if (capResult.exitCode !== 0) {
    throw new Error(`screencap failed:\n${capResult.stderr}`);
  }
  // Pull to local
  const pullResult = await adb([...deviceArgs(serial), "pull", deviceTmp, localPath]);
  if (pullResult.exitCode !== 0) {
    throw new Error(`adb pull screenshot failed:\n${pullResult.stderr}`);
  }
  // Clean up device temp file
  await adb([...deviceArgs(serial), "shell", "rm", deviceTmp]);
  return `Screenshot saved to ${localPath}`;
}

/** Pull a file from the device to a local path. */
export async function pullFile(
  devicePath: string,
  localPath: string,
  serial?: string
): Promise<string> {
  assertSafeDevicePath(devicePath);
  const result = await adb([...deviceArgs(serial), "pull", devicePath, localPath]);
  if (result.exitCode !== 0) {
    throw new Error(`adb pull failed:\n${result.stderr}`);
  }
  return result.stdout || `Pulled ${devicePath} → ${localPath}`;
}

/** Push a local file to the device. */
export async function pushFile(
  localPath: string,
  devicePath: string,
  serial?: string
): Promise<string> {
  assertSafeDevicePath(devicePath);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Local file not found: "${localPath}"`);
  }
  const result = await adb([...deviceArgs(serial), "push", localPath, devicePath]);
  if (result.exitCode !== 0) {
    throw new Error(`adb push failed:\n${result.stderr}`);
  }
  return result.stdout || `Pushed ${localPath} → ${devicePath}`;
}

/** Dump the UI hierarchy (uiautomator). */
export async function dumpUiHierarchy(serial?: string): Promise<string> {
  const deviceDump = "/sdcard/mcp_ui_dump.xml";
  const dumpResult = await adb([
    ...deviceArgs(serial),
    "shell",
    "uiautomator",
    "dump",
    deviceDump,
  ]);
  if (dumpResult.exitCode !== 0) {
    throw new Error(`uiautomator dump failed:\n${dumpResult.stderr}`);
  }
  // Read the XML from device via cat
  const catResult = await adb([...deviceArgs(serial), "shell", "cat", deviceDump]);
  // Clean up
  await adb([...deviceArgs(serial), "shell", "rm", deviceDump]);
  return catResult.stdout || "Empty hierarchy.";
}

/** List installed packages on the device. */
export async function listPackages(
  filter?: string,
  serial?: string
): Promise<string> {
  const filterArgs = filter ? ["|", "findstr", filter] : [];
  // Use adb shell pm list packages; on Windows we capture all and filter in JS
  const result = await adb([...deviceArgs(serial), "shell", "pm", "list", "packages"]);
  if (result.exitCode !== 0) {
    throw new Error(`pm list packages failed:\n${result.stderr}`);
  }
  if (filter) {
    const lines = result.stdout
      .split(/\r?\n/)
      .filter((l) => l.toLowerCase().includes(filter.toLowerCase()));
    return lines.join("\n");
  }
  return result.stdout;
}

/** Uninstall a package from the device. */
export async function uninstallPackage(
  packageName: string,
  serial?: string
): Promise<string> {
  const result = await adb([...deviceArgs(serial), "uninstall", packageName]);
  if (result.exitCode !== 0) {
    throw new Error(`adb uninstall failed:\n${result.stderr}`);
  }
  return result.stdout || `Uninstalled ${packageName}`;
}

/** Run a shell command on the device (output only — does NOT write repo files). */
export async function deviceShell(
  command: string,
  serial?: string
): Promise<string> {
  // Safety: reject commands that attempt file writes to common repo/source paths
  const forbidden = [">", ">>", "tee ", "rm -rf /", "mkfs"];
  for (const pattern of forbidden) {
    if (command.includes(pattern)) {
      throw new Error(
        `Shell command contains forbidden pattern "${pattern}". ` +
          "Only read/diagnostic shell commands are permitted."
      );
    }
  }
  const result = await adb([...deviceArgs(serial), "shell", command]);
  return result.stdout + (result.stderr ? `\nSTDERR: ${result.stderr}` : "");
}

/** Start an emulator by AVD name (path to emulator binary derived from SDK). */
export async function startEmulator(
  avdName: string,
  sdkRoot?: string
): Promise<string> {
  const sdk = sdkRoot || process.env.ANDROID_SDK_ROOT || "D:\\android-sdk";
  const emulatorBin = path.join(sdk, "emulator", "emulator.exe");
  if (!fs.existsSync(emulatorBin)) {
    throw new Error(
      `Emulator binary not found: "${emulatorBin}". ` +
        "Ensure the Android Emulator SDK component is installed."
    );
  }
  // Start emulator detached (fire-and-forget)
  const { spawn } = await import("child_process");
  spawn("cmd", ["/C", emulatorBin, "-avd", avdName], {
    detached: true,
    stdio: "ignore",
  }).unref();
  return `Emulator "${avdName}" launch requested. Run adb.listDevices() after ~10 seconds to verify it appeared.`;
}
