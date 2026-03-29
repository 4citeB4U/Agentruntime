/**
 * config.ts — Windows-specific configuration loader
 *
 * All paths default to Windows conventions (D: drive install, Android Studio JBR JDK 17).
 * Override via environment variables or a .env file at the server root.
 */

import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Load .env file from server root if present (lightweight, no dotenv dep)
// ---------------------------------------------------------------------------
function loadDotEnv(): void {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

// ---------------------------------------------------------------------------
// Resolved configuration (all values with Windows-safe defaults)
// ---------------------------------------------------------------------------

/** Android SDK root directory. */
export const ANDROID_SDK_ROOT: string =
  process.env.ANDROID_SDK_ROOT ||
  process.env.ANDROID_HOME ||
  "D:\\android-sdk";

/**
 * Java home — defaults to Android Studio Bundled JBR (JDK 17).
 * Typical Windows path: C:\Program Files\Android\Android Studio\jbr
 * D-drive variant:       D:\Android Studio\jbr
 */
export const JAVA_HOME: string =
  process.env.JAVA_HOME ||
  "C:\\Program Files\\Android\\Android Studio\\jbr";

/** Root directory of the Android project to build/test/deploy. */
export const ANDROID_PROJECT_ROOT: string =
  process.env.ANDROID_PROJECT_ROOT ||
  "D:\\agent-lee-voxel-os\\agent-lee-android";

/** Path to the adb executable. */
export const ADB_PATH: string =
  process.env.ADB_PATH ||
  path.join(ANDROID_SDK_ROOT, "platform-tools", "adb.exe");

/** Gradle wrapper command (Windows uses .bat). */
export const GRADLE_WRAPPER: string =
  process.env.GRADLE_WRAPPER || "gradlew.bat";

/** Build command timeout in milliseconds. */
export const BUILD_TIMEOUT_MS: number =
  parseInt(process.env.BUILD_TIMEOUT_MS || "300000", 10);

/** ADB command timeout in milliseconds. */
export const ADB_TIMEOUT_MS: number =
  parseInt(process.env.ADB_TIMEOUT_MS || "30000", 10);

/** Logging level. */
export const LOG_LEVEL: string =
  (process.env.LOG_LEVEL || "info").toLowerCase();

// ---------------------------------------------------------------------------
// Runtime validation helpers
// ---------------------------------------------------------------------------

export interface ConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Validate that the essential paths exist on disk (best-effort). */
export function validateConfig(): ConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(ANDROID_SDK_ROOT)) {
    errors.push(
      `ANDROID_SDK_ROOT not found: "${ANDROID_SDK_ROOT}". ` +
        `Set ANDROID_SDK_ROOT in .env or as a system environment variable.`
    );
  }

  if (!fs.existsSync(JAVA_HOME)) {
    errors.push(
      `JAVA_HOME not found: "${JAVA_HOME}". ` +
        `Set JAVA_HOME to your Android Studio JBR directory (e.g. C:\\Program Files\\Android\\Android Studio\\jbr).`
    );
  }

  if (!fs.existsSync(ANDROID_PROJECT_ROOT)) {
    warnings.push(
      `ANDROID_PROJECT_ROOT not found: "${ANDROID_PROJECT_ROOT}". ` +
        `Set ANDROID_PROJECT_ROOT to your Android project directory before using build/test tools.`
    );
  }

  if (!fs.existsSync(ADB_PATH)) {
    errors.push(
      `adb not found: "${ADB_PATH}". ` +
        `Ensure Android SDK platform-tools are installed and ANDROID_SDK_ROOT is correct.`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Build environment variables to inject when shelling out to Gradle / ADB. */
export function buildEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ANDROID_SDK_ROOT,
    ANDROID_HOME: ANDROID_SDK_ROOT,
    JAVA_HOME,
    // Prepend adb and Java bin to PATH so subprocesses find them
    PATH: [
      path.join(ANDROID_SDK_ROOT, "platform-tools"),
      path.join(JAVA_HOME, "bin"),
      process.env.PATH || "",
    ].join(";"),
  };
}
