import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface KeystoreConfig {
  path: string;
  alias: string;
  /** Name of env var that holds the store password */
  storePasswordEnv: string;
  /** Name of env var that holds the key password */
  keyPasswordEnv: string;
}

export interface AndroidMcpConfig {
  /** Absolute path to the Android SDK root */
  androidSdk: string;
  /** Absolute path to JAVA_HOME */
  javaHome: string;
  /** Override path to adb binary (auto-detected from androidSdk if empty) */
  adb: string;
  /** Path or name of gradlew / gradle wrapper (default: "./gradlew") */
  gradlew: string;
  /** Path to bundletool JAR or binary */
  bundletool: string;
  /** Path to apksigner binary (auto-detected from androidSdk if empty) */
  apksigner: string;
  /** Path to aapt2 binary (auto-detected from androidSdk if empty) */
  aapt2: string;
  /** Path to emulator binary */
  emulator: string;
  /** Path to avdmanager binary */
  avdmanager: string;
  /** Path to maestro binary (optional) */
  maestro: string;
  /** Path to fastlane binary (optional) */
  fastlane: string;
  /** Keystore configuration for signing */
  keystore: KeystoreConfig;
  /**
   * List of absolute paths that commands are allowed to run inside.
   * An empty list allows any directory (not recommended in production).
   */
  workingDirectories: string[];
  /** Timeout in milliseconds for spawned commands (default: 300 000 ms = 5 min) */
  commandTimeoutMs: number;
  /** Maximum number of logcat lines returned by device.logcat (default: 2000) */
  logcatMaxLines: number;
  /** Whether to allow external network calls from tool implementations (always false) */
  allowExternalNetworkCalls: boolean;
}

const DEFAULTS: AndroidMcpConfig = {
  androidSdk: process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME ?? "",
  javaHome: process.env.JAVA_HOME ?? "",
  adb: "",
  gradlew: "./gradlew",
  bundletool: "",
  apksigner: "",
  aapt2: "",
  emulator: "",
  avdmanager: "",
  maestro: "",
  fastlane: "",
  keystore: {
    path: "",
    alias: "release",
    storePasswordEnv: "KEYSTORE_STORE_PASSWORD",
    keyPasswordEnv: "KEYSTORE_KEY_PASSWORD",
  },
  workingDirectories: [],
  commandTimeoutMs: 300_000,
  logcatMaxLines: 2_000,
  allowExternalNetworkCalls: false,
};

function locateConfigFile(): string | undefined {
  const fromEnv = process.env.ANDROID_MCP_CONFIG;
  if (fromEnv) return fromEnv;
  const candidates = [
    path.join(process.cwd(), "android-dev-mcp.config.json"),
    path.join(os.homedir(), ".android-dev-mcp.config.json"),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function resolveToolPath(
  configured: string,
  sdkRoot: string,
  ...sdkRelative: string[]
): string {
  if (configured) return configured;
  if (sdkRoot) {
    const candidate = path.join(sdkRoot, ...sdkRelative);
    if (fs.existsSync(candidate)) return candidate;
    // Windows .exe variant
    const winCandidate = candidate + ".exe";
    if (fs.existsSync(winCandidate)) return winCandidate;
  }
  // Fall back to PATH lookup (just the base name)
  return sdkRelative[sdkRelative.length - 1] ?? "";
}

function findLatestBuildToolsVersion(sdkRoot: string): string {
  try {
    const btDir = path.join(sdkRoot, "build-tools");
    if (!fs.existsSync(btDir)) return "";
    const versions = fs
      .readdirSync(btDir)
      .filter((d) => /^\d+\.\d+\.\d+/.test(d))
      .sort()
      .reverse();
    return versions[0] ?? "";
  } catch {
    return "";
  }
}

export function loadConfig(): AndroidMcpConfig {
  const configPath = locateConfigFile();
  let fileConfig: Partial<AndroidMcpConfig> = {};
  if (configPath) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      fileConfig = JSON.parse(raw) as Partial<AndroidMcpConfig>;
    } catch (err) {
      process.stderr.write(
        `[android-dev-mcp] Warning: could not parse config file ${configPath}: ${err}\n`
      );
    }
  }

  const merged: AndroidMcpConfig = {
    ...DEFAULTS,
    ...fileConfig,
    keystore: { ...DEFAULTS.keystore, ...fileConfig.keystore },
  };

  // Override SDK root from env if not set in config
  if (!merged.androidSdk) {
    merged.androidSdk =
      process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME ?? "";
  }
  if (!merged.javaHome) {
    merged.javaHome = process.env.JAVA_HOME ?? "";
  }

  // Auto-resolve tool paths from SDK root
  const sdk = merged.androidSdk;
  const btVersion = findLatestBuildToolsVersion(sdk);
  const btDir = btVersion ? path.join(sdk, "build-tools", btVersion) : "";

  merged.adb = resolveToolPath(merged.adb, sdk, "platform-tools", "adb");
  merged.apksigner = resolveToolPath(
    merged.apksigner,
    btDir,
    "",
    "apksigner"
  );
  merged.aapt2 = resolveToolPath(merged.aapt2, btDir, "", "aapt2");
  merged.emulator = resolveToolPath(merged.emulator, sdk, "emulator", "emulator");
  merged.avdmanager = resolveToolPath(
    merged.avdmanager,
    sdk,
    "cmdline-tools",
    "latest",
    "bin",
    "avdmanager"
  );

  // Ensure allowExternalNetworkCalls is always false — hard-coded safety rail
  merged.allowExternalNetworkCalls = false;

  return merged;
}

/** Redact keystore passwords from a string (for logging / output) */
export function redactSecrets(input: string, config: AndroidMcpConfig): string {
  let out = input;
  for (const envName of [
    config.keystore.storePasswordEnv,
    config.keystore.keyPasswordEnv,
  ]) {
    const secret = envName ? process.env[envName] : undefined;
    if (secret && secret.length >= 4) {
      out = out.split(secret).join("[REDACTED]");
    }
  }
  return out;
}
