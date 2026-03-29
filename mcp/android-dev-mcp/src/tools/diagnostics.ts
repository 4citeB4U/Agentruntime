import fs from "node:fs";
import { z } from "zod";
import { AndroidMcpConfig } from "../config.js";
import { run } from "../runner.js";

export const healthSchema = z.object({});

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
}

async function checkBinary(
  name: string,
  bin: string,
  verifyArg: string,
  config: AndroidMcpConfig
): Promise<CheckResult> {
  if (!bin) {
    return {
      name,
      status: "warn",
      message: `${name} path not configured — will try PATH lookup`,
    };
  }
  const result = await run(bin || name, [verifyArg], config, {
    timeoutMs: 15_000,
  });
  if (result.exitCode === 0 || result.stdout || result.stderr) {
    const versionLine = (result.stdout + result.stderr)
      .split("\n")
      .find((l) => l.trim().length > 0) ?? "";
    return {
      name,
      status: "ok",
      message: `Found: ${versionLine.trim().slice(0, 80)}`,
    };
  }
  return {
    name,
    status: "error",
    message: `${name} not found or returned exit code ${result.exitCode}`,
  };
}

export async function runHealthCheck(
  config: AndroidMcpConfig
): Promise<string> {
  const checks: CheckResult[] = [];

  // Android SDK root
  checks.push({
    name: "Android SDK root",
    status: config.androidSdk && fs.existsSync(config.androidSdk) ? "ok" : "error",
    message: config.androidSdk
      ? fs.existsSync(config.androidSdk)
        ? config.androidSdk
        : `Not found: ${config.androidSdk}`
      : "ANDROID_SDK_ROOT / ANDROID_HOME not set",
  });

  // Java home
  checks.push({
    name: "JAVA_HOME",
    status: config.javaHome && fs.existsSync(config.javaHome) ? "ok" : "warn",
    message: config.javaHome
      ? fs.existsSync(config.javaHome)
        ? config.javaHome
        : `Not found: ${config.javaHome}`
      : "JAVA_HOME not set — Gradle may still work if java is on PATH",
  });

  // adb
  checks.push(
    await checkBinary("adb", config.adb, "version", config)
  );

  // apksigner
  checks.push(
    await checkBinary("apksigner", config.apksigner, "version", config)
  );

  // aapt2
  checks.push(
    await checkBinary("aapt2", config.aapt2, "version", config)
  );

  // bundletool
  if (config.bundletool) {
    // bundletool is a JAR — check java can run it
    const javaExe = config.javaHome
      ? `${config.javaHome}/bin/java`
      : "java";
    const r = await run(javaExe, ["-jar", config.bundletool, "version"], config, {
      timeoutMs: 15_000,
    });
    checks.push({
      name: "bundletool",
      status: r.exitCode === 0 ? "ok" : "warn",
      message:
        r.exitCode === 0
          ? (r.stdout.trim() || "ok")
          : `bundletool check failed (exit ${r.exitCode})`,
    });
  } else {
    checks.push({
      name: "bundletool",
      status: "warn",
      message: "Not configured (optional — needed for AAB → APK sets)",
    });
  }

  // emulator
  if (config.emulator) {
    checks.push(
      await checkBinary("emulator", config.emulator, "-version", config)
    );
  } else {
    checks.push({
      name: "emulator",
      status: "warn",
      message: "Not configured (optional)",
    });
  }

  // Keystore
  if (config.keystore.path) {
    checks.push({
      name: "keystore",
      status: fs.existsSync(config.keystore.path) ? "ok" : "error",
      message: fs.existsSync(config.keystore.path)
        ? `Found: ${config.keystore.path} (alias: ${config.keystore.alias})`
        : `Keystore not found: ${config.keystore.path}`,
    });
    const storePassSet = !!(process.env[config.keystore.storePasswordEnv]);
    const keyPassSet = !!(process.env[config.keystore.keyPasswordEnv]);
    checks.push({
      name: "keystore passwords",
      status: storePassSet ? "ok" : "error",
      message: storePassSet
        ? `${config.keystore.storePasswordEnv} ✓${keyPassSet ? "  " + config.keystore.keyPasswordEnv + " ✓" : ""}`
        : `${config.keystore.storePasswordEnv} not set`,
    });
  } else {
    checks.push({
      name: "keystore",
      status: "warn",
      message: "Not configured (optional — needed for signed release builds)",
    });
  }

  // Maestro (optional)
  if (config.maestro) {
    checks.push(
      await checkBinary("maestro", config.maestro, "--version", config)
    );
  }

  // Fastlane (optional)
  if (config.fastlane) {
    checks.push(
      await checkBinary("fastlane", config.fastlane, "--version", config)
    );
  }

  // Safety rail: ensure external network calls are disabled
  checks.push({
    name: "offline mode",
    status: config.allowExternalNetworkCalls ? "error" : "ok",
    message: config.allowExternalNetworkCalls
      ? "⚠️  External network calls are ENABLED — this violates offline-first policy"
      : "External network calls are disabled ✓",
  });

  // Format output
  const ok = checks.filter((c) => c.status === "ok").length;
  const warn = checks.filter((c) => c.status === "warn").length;
  const error = checks.filter((c) => c.status === "error").length;

  const lines: string[] = [
    "╔══════════════════════════════════════════════╗",
    "║   Android Dev MCP — Environment Health Check ║",
    "╚══════════════════════════════════════════════╝",
    "",
  ];

  for (const c of checks) {
    const icon = c.status === "ok" ? "✅" : c.status === "warn" ? "⚠️ " : "❌";
    lines.push(`${icon} ${c.name.padEnd(24)} ${c.message}`);
  }

  lines.push("");
  lines.push(`Summary: ${ok} ok  ${warn} warnings  ${error} errors`);

  return lines.join("\n");
}
