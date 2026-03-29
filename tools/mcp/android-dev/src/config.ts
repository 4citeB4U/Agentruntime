/**
 * config.ts – Load and validate android-mcp.config.json
 *
 * The config file is searched in this order:
 *  1. Path provided in env var ANDROID_MCP_CONFIG
 *  2. android-mcp.config.json next to the running script
 *  3. android-mcp.config.json in the current working directory
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface McpConfig {
  /** Root of the Android SDK installation (ANDROID_SDK_ROOT / ANDROID_HOME) */
  androidSdkRoot: string;
  /** JAVA_HOME – Android Studio JBR or a JDK 17+ installation */
  javaHome: string;
  /**
   * Allowlist of absolute project root directories.
   * Any project path supplied to a tool MUST start with one of these.
   */
  allowedProjectRoots: string[];
  /** Maximum milliseconds any single CLI invocation may run (default 120 000) */
  defaultTimeoutMs: number;
  /** Override full path to adb.exe (auto-detected from androidSdkRoot if empty) */
  adbPath: string;
  /** Gradle wrapper executable name (gradlew.bat on Windows) */
  gradlewName: string;
  /** Full path to bundletool JAR (optional) */
  bundletoolJar: string;
}

const DEFAULTS: McpConfig = {
  androidSdkRoot: process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME ?? "",
  javaHome: process.env.JAVA_HOME ?? "",
  allowedProjectRoots: [],
  defaultTimeoutMs: 120_000,
  adbPath: "",
  gradlewName: "gradlew.bat",
  bundletoolJar: "",
};

function findConfigFile(): string | null {
  const envPath = process.env.ANDROID_MCP_CONFIG;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(__dirname, "..", "android-mcp.config.json"),
    path.resolve(process.cwd(), "android-mcp.config.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

let _config: McpConfig | null = null;

export function loadConfig(): McpConfig {
  if (_config) return _config;

  const configPath = findConfigFile();
  if (!configPath) {
    _config = { ...DEFAULTS };
    return _config;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Partial<McpConfig>;
    _config = { ...DEFAULTS, ...raw };
  } catch {
    _config = { ...DEFAULTS };
  }
  return _config;
}

/**
 * Resolve the full path to adb.exe.
 * Priority: config.adbPath → ANDROID_SDK_ROOT/platform-tools/adb.exe
 */
export function resolveAdb(cfg: McpConfig): string {
  if (cfg.adbPath) return cfg.adbPath;
  if (cfg.androidSdkRoot) {
    return path.join(cfg.androidSdkRoot, "platform-tools", "adb.exe");
  }
  // Fall back to just "adb" and let PATH resolve it
  return "adb";
}

/**
 * Resolve the full path to aapt2.exe.
 */
export function resolveAapt2(cfg: McpConfig): string {
  if (cfg.androidSdkRoot) {
    // aapt2 lives inside build-tools/<version>/; pick the highest available
    const bt = path.join(cfg.androidSdkRoot, "build-tools");
    if (fs.existsSync(bt)) {
      const versions = fs.readdirSync(bt).sort().reverse();
      if (versions.length > 0) {
        return path.join(bt, versions[0], "aapt2.exe");
      }
    }
  }
  return "aapt2";
}

/**
 * Resolve the full path to apksigner.bat.
 */
export function resolveApkSigner(cfg: McpConfig): string {
  if (cfg.androidSdkRoot) {
    const bt = path.join(cfg.androidSdkRoot, "build-tools");
    if (fs.existsSync(bt)) {
      const versions = fs.readdirSync(bt).sort().reverse();
      if (versions.length > 0) {
        return path.join(bt, versions[0], "apksigner.bat");
      }
    }
  }
  return "apksigner";
}

/**
 * Validate that projectPath is under one of the allowed roots.
 * Returns the normalised absolute path, or throws if not allowed.
 */
export function assertAllowedPath(projectPath: string, cfg: McpConfig): string {
  const normalised = path.resolve(projectPath);

  if (cfg.allowedProjectRoots.length === 0) {
    // No allowlist configured – warn but allow
    return normalised;
  }

  for (const root of cfg.allowedProjectRoots) {
    const normRoot = path.resolve(root);
    // Use path.relative to determine whether normalised is inside normRoot.
    // If the relative path starts with ".." the target is outside the root.
    const rel = path.relative(normRoot, normalised);
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
      return normalised;
    }
  }
  throw new Error(
    `Path "${normalised}" is not under any allowed project root.\n` +
      `Allowed roots: ${cfg.allowedProjectRoots.map((r) => path.resolve(r)).join(", ")}\n` +
      `Add the root to allowedProjectRoots in android-mcp.config.json to permit it.`
  );
}
