/**
 * tools/diagnostics.ts — Android dev environment health checks
 *
 * Read-only: inspects local SDK, JDK, adb, Gradle, and project structure.
 * Does NOT modify any files.
 */

import * as fs from "fs";
import * as path from "path";
import {
  ANDROID_SDK_ROOT,
  JAVA_HOME,
  ANDROID_PROJECT_ROOT,
  ADB_PATH,
  GRADLE_WRAPPER,
  BUILD_TIMEOUT_MS,
  validateConfig,
} from "../config.js";
import { run } from "../runner.js";

export interface HealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck[];
  summary: string;
}

export interface HealthCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

/** Run a full Android dev environment health check. */
export async function androidDevHealth(): Promise<HealthReport> {
  const checks: HealthCheck[] = [];

  // 1. Config validation
  const cfg = validateConfig();
  for (const err of cfg.errors) {
    checks.push({ name: "config", status: "fail", message: err });
  }
  for (const warn of cfg.warnings) {
    checks.push({ name: "config", status: "warn", message: warn });
  }

  // 2. Android SDK root
  checks.push(checkPath("android_sdk_root", ANDROID_SDK_ROOT, "Android SDK root"));

  // 3. Java home
  checks.push(checkPath("java_home", JAVA_HOME, "Java home (Android Studio JBR JDK 17)"));

  // 4. Java version
  await checkJavaVersion(checks);

  // 5. ADB
  checks.push(checkPath("adb_executable", ADB_PATH, "adb executable"));
  if (fs.existsSync(ADB_PATH)) {
    await checkAdbVersion(checks);
    await checkConnectedDevices(checks);
  }

  // 6. Android SDK components
  checkSdkComponents(checks);

  // 7. Project root
  checks.push(checkPath("project_root", ANDROID_PROJECT_ROOT, "Android project root"));
  if (fs.existsSync(ANDROID_PROJECT_ROOT)) {
    checkProjectStructure(checks);
    await checkGradleWrapper(checks);
  }

  // Compute overall status
  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarn = checks.some((c) => c.status === "warn");
  const status: HealthReport["status"] = hasFail
    ? "unhealthy"
    : hasWarn
    ? "degraded"
    : "healthy";

  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const summary = `${passCount} pass / ${warnCount} warn / ${failCount} fail — status: ${status}`;

  return { status, checks, summary };
}

// ---------------------------------------------------------------------------
// Individual check helpers
// ---------------------------------------------------------------------------

function checkPath(name: string, p: string, label: string): HealthCheck {
  const exists = fs.existsSync(p);
  return {
    name,
    status: exists ? "pass" : "fail",
    message: exists ? `${label} found: ${p}` : `${label} NOT found: ${p}`,
  };
}

async function checkJavaVersion(checks: HealthCheck[]): Promise<void> {
  const javaBin = path.join(JAVA_HOME, "bin", "java.exe");
  if (!fs.existsSync(javaBin)) {
    checks.push({
      name: "java_version",
      status: "fail",
      message: `java.exe not found at ${javaBin}`,
    });
    return;
  }
  try {
    const result = await run(javaBin, ["-version"], process.cwd(), 10000);
    const output = result.stderr || result.stdout; // java -version writes to stderr
    const match = output.match(/version "(\d+)/);
    const major = match ? parseInt(match[1], 10) : -1;
    if (major === 17) {
      checks.push({
        name: "java_version",
        status: "pass",
        message: `Java 17 (Android Studio JBR) confirmed: ${output.split("\n")[0]}`,
      });
    } else if (major > 0) {
      checks.push({
        name: "java_version",
        status: "warn",
        message:
          `Java ${major} detected (expected 17 for Android Studio JBR). ` +
          `Output: ${output.split("\n")[0]}`,
      });
    } else {
      checks.push({
        name: "java_version",
        status: "warn",
        message: `Could not parse Java version from: ${output.split("\n")[0]}`,
      });
    }
  } catch (e) {
    checks.push({
      name: "java_version",
      status: "fail",
      message: `Failed to run java -version: ${(e as Error).message}`,
    });
  }
}

async function checkAdbVersion(checks: HealthCheck[]): Promise<void> {
  try {
    const result = await run(ADB_PATH, ["version"], process.cwd(), 10000);
    checks.push({
      name: "adb_version",
      status: "pass",
      message: result.stdout.split("\n")[0] || "adb version OK",
    });
  } catch (e) {
    checks.push({
      name: "adb_version",
      status: "fail",
      message: `Failed to run adb version: ${(e as Error).message}`,
    });
  }
}

async function checkConnectedDevices(checks: HealthCheck[]): Promise<void> {
  try {
    const result = await run(ADB_PATH, ["devices"], process.cwd(), 10000);
    const lines = result.stdout.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("List"));
    const devices = lines.filter((l) => l.includes("\t"));
    if (devices.length > 0) {
      checks.push({
        name: "connected_devices",
        status: "pass",
        message: `${devices.length} device(s) connected:\n${devices.join("\n")}`,
      });
    } else {
      checks.push({
        name: "connected_devices",
        status: "warn",
        message: "No devices or emulators connected. Connect a device or start an emulator.",
      });
    }
  } catch (e) {
    checks.push({
      name: "connected_devices",
      status: "fail",
      message: `adb devices failed: ${(e as Error).message}`,
    });
  }
}

function checkSdkComponents(checks: HealthCheck[]): void {
  const components: Array<{ name: string; rel: string }> = [
    { name: "platform-tools (adb)", rel: "platform-tools" },
    { name: "build-tools", rel: "build-tools" },
    { name: "platforms", rel: "platforms" },
    { name: "emulator", rel: "emulator" },
  ];
  for (const comp of components) {
    const full = path.join(ANDROID_SDK_ROOT, comp.rel);
    checks.push({
      name: `sdk_${comp.rel.replace("-", "_")}`,
      status: fs.existsSync(full) ? "pass" : "warn",
      message: fs.existsSync(full)
        ? `SDK component "${comp.name}" found`
        : `SDK component "${comp.name}" not found at ${full}`,
    });
  }
}

function checkProjectStructure(checks: HealthCheck[]): void {
  const required = ["settings.gradle", "settings.gradle.kts", "build.gradle", "build.gradle.kts"];
  const hasSettings = required.slice(0, 2).some((f) =>
    fs.existsSync(path.join(ANDROID_PROJECT_ROOT, f))
  );
  const hasBuild = required.slice(2).some((f) =>
    fs.existsSync(path.join(ANDROID_PROJECT_ROOT, f))
  );

  checks.push({
    name: "project_settings",
    status: hasSettings ? "pass" : "fail",
    message: hasSettings
      ? "settings.gradle(.kts) found"
      : "No settings.gradle or settings.gradle.kts found in project root",
  });

  checks.push({
    name: "project_build_gradle",
    status: hasBuild ? "pass" : "warn",
    message: hasBuild
      ? "Root build.gradle(.kts) found"
      : "No root build.gradle(.kts) found in project root",
  });
}

async function checkGradleWrapper(checks: HealthCheck[]): Promise<void> {
  const wrapperBat = path.join(ANDROID_PROJECT_ROOT, "gradlew.bat");
  if (!fs.existsSync(wrapperBat)) {
    checks.push({
      name: "gradle_wrapper",
      status: "warn",
      message: `gradlew.bat not found in project root (${ANDROID_PROJECT_ROOT}).`,
    });
    return;
  }
  try {
    const result = await run(
      GRADLE_WRAPPER,
      ["--version"],
      ANDROID_PROJECT_ROOT,
      BUILD_TIMEOUT_MS
    );
    const firstLine = (result.stdout || result.stderr).split("\n")[0];
    checks.push({
      name: "gradle_wrapper",
      status: "pass",
      message: `Gradle wrapper OK: ${firstLine}`,
    });
  } catch (e) {
    checks.push({
      name: "gradle_wrapper",
      status: "fail",
      message: `gradlew.bat failed: ${(e as Error).message}`,
    });
  }
}
