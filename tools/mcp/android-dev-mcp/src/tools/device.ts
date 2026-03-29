/**
 * Tools: device.list, device.install, device.launch, device.logcat,
 *        device.screenshot, device.pull, device.push
 */
import path from "path";
import os from "os";
import fs from "fs";
import { McpConfig, assertAllowedDir, safeResolvePath } from "../config";
import { run, RunResult } from "../runner";

function adbPath(config: McpConfig): string {
  return path.join(
    config.androidSdkRoot,
    "platform-tools",
    os.platform() === "win32" ? "adb.exe" : "adb"
  );
}

function adbArgs(deviceSerial: string | undefined, args: string[]): string[] {
  if (deviceSerial) {
    return ["-s", deviceSerial, ...args];
  }
  return args;
}

export async function listDevices(config: McpConfig): Promise<RunResult> {
  const adb = adbPath(config);
  const cwd = config.allowedWorkingDirs[0];
  return run(adb, ["devices", "-l"], {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 15_000,
  });
}

export async function installApk(
  workDir: string,
  apkRelPath: string,
  deviceSerial: string | undefined,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(workDir, config);
  const apkPath = safeResolvePath(cwd, apkRelPath);

  if (!fs.existsSync(apkPath)) {
    return { stdout: "", stderr: `APK not found: ${apkPath}`, exitCode: 1 };
  }

  const adb = adbPath(config);
  return run(adb, adbArgs(deviceSerial, ["install", "-r", apkPath]), {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 120_000,
  });
}

export async function launchApp(
  packageName: string,
  activityName: string,
  deviceSerial: string | undefined,
  config: McpConfig
): Promise<RunResult> {
  const cwd = config.allowedWorkingDirs[0];
  const adb = adbPath(config);
  const component = `${packageName}/${activityName}`;
  return run(
    adb,
    adbArgs(deviceSerial, ["shell", "am", "start", "-n", component]),
    {
      cwd,
      androidSdkRoot: config.androidSdkRoot,
      javaHome: config.javaHome,
      timeoutMs: 30_000,
    }
  );
}

export async function getLogcat(
  deviceSerial: string | undefined,
  lines: number,
  filterTag: string | undefined,
  config: McpConfig
): Promise<RunResult> {
  const cwd = config.allowedWorkingDirs[0];
  const adb = adbPath(config);

  // Use -d (dump and exit) + -t <lines> so it's always bounded
  const args = adbArgs(deviceSerial, [
    "logcat",
    "-d",
    "-t",
    String(Math.min(lines, 5000)), // cap at 5000 lines
    ...(filterTag ? [filterTag] : []),
  ]);

  return run(adb, args, {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 30_000,
  });
}

export async function takeScreenshot(
  workDir: string,
  outputRelPath: string,
  deviceSerial: string | undefined,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(workDir, config);
  const outputPath = safeResolvePath(cwd, outputRelPath);
  const adb = adbPath(config);

  // Step 1: capture to device temp file
  const deviceTmp = "/sdcard/mcp_screenshot.png";
  const captureResult = await run(
    adb,
    adbArgs(deviceSerial, ["shell", "screencap", "-p", deviceTmp]),
    {
      cwd,
      androidSdkRoot: config.androidSdkRoot,
      javaHome: config.javaHome,
      timeoutMs: 15_000,
    }
  );
  if (captureResult.exitCode !== 0) return captureResult;

  // Step 2: pull to host
  const pullResult = await run(
    adb,
    adbArgs(deviceSerial, ["pull", deviceTmp, outputPath]),
    {
      cwd,
      androidSdkRoot: config.androidSdkRoot,
      javaHome: config.javaHome,
      timeoutMs: 30_000,
    }
  );

  // Step 3: clean up device temp file (best-effort)
  await run(adb, adbArgs(deviceSerial, ["shell", "rm", deviceTmp]), {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 10_000,
  }).catch(() => {/* ignore cleanup errors */});

  return pullResult;
}

export async function pullFile(
  workDir: string,
  devicePath: string,
  localRelPath: string,
  deviceSerial: string | undefined,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(workDir, config);
  const localPath = safeResolvePath(cwd, localRelPath);
  const adb = adbPath(config);

  return run(adb, adbArgs(deviceSerial, ["pull", devicePath, localPath]), {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 120_000,
  });
}

export async function pushFile(
  workDir: string,
  localRelPath: string,
  devicePath: string,
  deviceSerial: string | undefined,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(workDir, config);
  const localPath = safeResolvePath(cwd, localRelPath);

  if (!fs.existsSync(localPath)) {
    return { stdout: "", stderr: `Local file not found: ${localPath}`, exitCode: 1 };
  }

  const adb = adbPath(config);
  return run(adb, adbArgs(deviceSerial, ["push", localPath, devicePath]), {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 120_000,
  });
}
