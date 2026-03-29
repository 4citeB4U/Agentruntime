/**
 * sdk-detector.ts
 *
 * Auto-detects ANDROID_SDK_ROOT and JAVA_HOME on Windows.
 * Priority order:
 *   1. Explicit env var (ANDROID_SDK_ROOT / ANDROID_HOME / JAVA_HOME)
 *   2. Common default install locations (Android Studio, LOCALAPPDATA, ProgramFiles)
 *   3. Returns null so callers can prompt the user for a fallback path.
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/** Candidate SDK locations (Windows, in priority order). */
const SDK_CANDIDATES: string[] = [
  process.env.ANDROID_SDK_ROOT ?? "",
  process.env.ANDROID_HOME ?? "",
  path.join(
    process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
    "Android",
    "Sdk"
  ),
  path.join(os.homedir(), "AppData", "Local", "Android", "Sdk"),
  "C:\\Users\\Public\\Android\\Sdk",
];

/** Candidate JDK/JBR locations (Android Studio JBR takes top priority). */
const JDK_CANDIDATES: string[] = [
  process.env.JAVA_HOME ?? "",
  // Android Studio's bundled JBR (JetBrains Runtime) - default install paths
  "C:\\Program Files\\Android\\Android Studio\\jbr",
  "C:\\Program Files\\Android\\Android Studio\\jre",
  path.join(
    process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
    "Android",
    "Android Studio",
    "jbr"
  ),
  // JDK 17 standalone common locations
  "C:\\Program Files\\Java\\jdk-17",
  "C:\\Program Files\\Eclipse Adoptium\\jdk-17",
  "C:\\Program Files\\Microsoft\\jdk-17",
];

/** Returns the first path that exists and is a directory, or null. */
function firstExisting(candidates: string[]): string | null {
  for (const p of candidates) {
    if (p && fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  return null;
}

/** Detected or fallback Android SDK root. */
export function detectAndroidSdkRoot(): string | null {
  return firstExisting(SDK_CANDIDATES);
}

/** Detected or fallback JAVA_HOME. */
export function detectJavaHome(): string | null {
  return firstExisting(JDK_CANDIDATES);
}

/** Full path to the adb executable. */
export function adbPath(sdkRoot?: string | null): string {
  const root = sdkRoot ?? detectAndroidSdkRoot();
  if (!root) return "adb"; // fallback: rely on PATH
  return path.join(root, "platform-tools", "adb.exe");
}

/** Full path to java executable inside a JDK/JBR root. */
export function javaPath(javaHome?: string | null): string {
  const home = javaHome ?? detectJavaHome();
  if (!home) return "java"; // fallback: rely on PATH
  return path.join(home, "bin", "java.exe");
}

/** Resolve gradlew.bat given a project root. */
export function gradlewPath(projectRoot: string): string {
  return path.join(projectRoot, "gradlew.bat");
}

export interface EnvSummary {
  androidSdkRoot: string | null;
  javaHome: string | null;
  adb: string;
  java: string;
  adbOnPath: boolean;
  javaOnPath: boolean;
}

/** Collect detected paths and verify binaries exist or are on PATH. */
export function buildEnvSummary(overrides?: {
  sdkRoot?: string;
  javaHome?: string;
}): EnvSummary {
  const androidSdkRoot = overrides?.sdkRoot ?? detectAndroidSdkRoot();
  const javaHome = overrides?.javaHome ?? detectJavaHome();
  const adb = adbPath(androidSdkRoot);
  const java = javaPath(javaHome);

  let adbOnPath = false;
  let javaOnPath = false;

  try {
    execSync(`"${adb}" version`, { stdio: "ignore" });
    adbOnPath = true;
  } catch {
    try {
      execSync("adb version", { stdio: "ignore" });
      adbOnPath = true;
    } catch {
      /* not found */
    }
  }

  try {
    execSync(`"${java}" -version`, { stdio: "ignore" });
    javaOnPath = true;
  } catch {
    try {
      execSync("java -version", { stdio: "ignore" });
      javaOnPath = true;
    } catch {
      /* not found */
    }
  }

  return { androidSdkRoot, javaHome, adb, java, adbOnPath, javaOnPath };
}
