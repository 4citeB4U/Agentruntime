/**
 * tools/diagnostics.ts – diagnostics.android.health
 *
 * Checks the local Android development environment:
 *  - ANDROID_SDK_ROOT / ANDROID_HOME
 *  - JAVA_HOME and java version
 *  - ADB connectivity
 *  - build-tools, platform, emulator installation
 *  - Gradle wrapper presence
 *  - bundletool JAR presence
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { loadConfig, resolveAdb, resolveAapt2, resolveApkSigner } from "../config.js";
import { run } from "../runner.js";

export const DiagnosticsHealthSchema = z.object({
  projectPath: z
    .string()
    .optional()
    .describe("Optional path to an Android project to check for Gradle wrapper presence"),
});

interface Check {
  name: string;
  status: "ok" | "warn" | "error";
  detail: string;
}

export async function diagnosticsAndroidHealth(
  input: z.infer<typeof DiagnosticsHealthSchema>
): Promise<string> {
  const cfg = loadConfig();
  const checks: Check[] = [];

  // ── Android SDK ──────────────────────────────────────────────────────────
  checks.push(checkSdkRoot(cfg.androidSdkRoot));
  checks.push(checkPlatformTools(cfg.androidSdkRoot));
  checks.push(checkBuildTools(cfg.androidSdkRoot));
  checks.push(checkPlatforms(cfg.androidSdkRoot));
  checks.push(checkEmulator(cfg.androidSdkRoot));

  // ── Java ─────────────────────────────────────────────────────────────────
  checks.push(await checkJava(cfg.javaHome));

  // ── ADB ──────────────────────────────────────────────────────────────────
  checks.push(await checkAdb(resolveAdb(cfg)));

  // ── aapt2 ────────────────────────────────────────────────────────────────
  checks.push(checkFilePresence("aapt2", resolveAapt2(cfg)));

  // ── apksigner ────────────────────────────────────────────────────────────
  checks.push(checkFilePresence("apksigner", resolveApkSigner(cfg)));

  // ── bundletool ───────────────────────────────────────────────────────────
  if (cfg.bundletoolJar) {
    checks.push(checkFilePresence("bundletool JAR", cfg.bundletoolJar));
  } else {
    checks.push({
      name: "bundletool",
      status: "warn",
      detail: "bundletoolJar not set in config. AAB validation will be skipped.",
    });
  }

  // ── Gradle wrapper ───────────────────────────────────────────────────────
  if (input.projectPath) {
    const gw = path.join(input.projectPath, cfg.gradlewName);
    checks.push({
      name: `Gradle wrapper (${cfg.gradlewName})`,
      status: fs.existsSync(gw) ? "ok" : "error",
      detail: fs.existsSync(gw) ? `Found: ${gw}` : `Not found at: ${gw}`,
    });
  }

  // ── Allowlist ────────────────────────────────────────────────────────────
  if (cfg.allowedProjectRoots.length === 0) {
    checks.push({
      name: "Project allowlist",
      status: "warn",
      detail:
        "allowedProjectRoots is empty – all project paths are permitted. " +
        "Set allowedProjectRoots in android-mcp.config.json for stricter security.",
    });
  } else {
    checks.push({
      name: "Project allowlist",
      status: "ok",
      detail: `${cfg.allowedProjectRoots.length} allowed root(s) configured.`,
    });
  }

  // ── Format report ────────────────────────────────────────────────────────
  const lines = ["Android Dev Environment Health Check", "═".repeat(42), ""];
  for (const c of checks) {
    const icon = c.status === "ok" ? "✔" : c.status === "warn" ? "⚠" : "✘";
    lines.push(`${icon} ${c.name}`);
    lines.push(`   ${c.detail}`);
  }

  const errors = checks.filter((c) => c.status === "error").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  lines.push("");
  lines.push(`Summary: ${checks.length} checks – ${errors} error(s), ${warns} warning(s)`);

  return lines.join("\n");
}

// ─── individual check helpers ────────────────────────────────────────────────

function checkSdkRoot(sdkRoot: string): Check {
  if (!sdkRoot) {
    return {
      name: "ANDROID_SDK_ROOT",
      status: "error",
      detail:
        "Not set. Set ANDROID_SDK_ROOT env var or add androidSdkRoot to android-mcp.config.json.",
    };
  }
  return {
    name: "ANDROID_SDK_ROOT",
    status: fs.existsSync(sdkRoot) ? "ok" : "error",
    detail: fs.existsSync(sdkRoot) ? sdkRoot : `Path does not exist: ${sdkRoot}`,
  };
}

function checkPlatformTools(sdkRoot: string): Check {
  if (!sdkRoot) return { name: "platform-tools", status: "error", detail: "SDK root not set." };
  const pt = path.join(sdkRoot, "platform-tools");
  return {
    name: "platform-tools",
    status: fs.existsSync(pt) ? "ok" : "error",
    detail: fs.existsSync(pt) ? pt : `Not found: ${pt}. Open SDK Manager and install Platform Tools.`,
  };
}

function checkBuildTools(sdkRoot: string): Check {
  if (!sdkRoot) return { name: "build-tools", status: "error", detail: "SDK root not set." };
  const bt = path.join(sdkRoot, "build-tools");
  if (!fs.existsSync(bt)) {
    return {
      name: "build-tools",
      status: "error",
      detail: `Not found: ${bt}. Open SDK Manager and install at least one Build-Tools version.`,
    };
  }
  const versions = fs.readdirSync(bt).sort().reverse();
  return {
    name: "build-tools",
    status: versions.length > 0 ? "ok" : "error",
    detail:
      versions.length > 0
        ? `Found versions: ${versions.join(", ")}`
        : `Directory exists but is empty: ${bt}`,
  };
}

function checkPlatforms(sdkRoot: string): Check {
  if (!sdkRoot) return { name: "platforms", status: "error", detail: "SDK root not set." };
  const pp = path.join(sdkRoot, "platforms");
  if (!fs.existsSync(pp)) {
    return {
      name: "platforms",
      status: "error",
      detail: `Not found: ${pp}. Open SDK Manager and install at least one API level.`,
    };
  }
  const apis = fs.readdirSync(pp);
  return {
    name: "platforms",
    status: apis.length > 0 ? "ok" : "warn",
    detail:
      apis.length > 0 ? `Installed: ${apis.join(", ")}` : `Directory exists but is empty: ${pp}`,
  };
}

function checkEmulator(sdkRoot: string): Check {
  if (!sdkRoot) return { name: "emulator", status: "warn", detail: "SDK root not set." };
  const em = path.join(sdkRoot, "emulator", "emulator.exe");
  return {
    name: "emulator",
    status: fs.existsSync(em) ? "ok" : "warn",
    detail: fs.existsSync(em)
      ? em
      : `Not found: ${em}. Install Emulator via SDK Manager if you need virtual devices.`,
  };
}

async function checkJava(javaHome: string): Promise<Check> {
  const java = javaHome ? path.join(javaHome, "bin", "java.exe") : "java";
  const result = await run(java, ["-version"], { timeoutMs: 10_000 });
  const output = (result.stdout + result.stderr).trim();
  if (result.exitCode !== 0 && result.exitCode !== null) {
    return {
      name: "Java (JAVA_HOME)",
      status: "error",
      detail: `java not found or failed. ${javaHome ? `Checked: ${java}` : "Checked PATH."}\n   ${output}`,
    };
  }
  return {
    name: "Java (JAVA_HOME)",
    status: "ok",
    detail: output.split("\n")[0] ?? output,
  };
}

async function checkAdb(adbPath: string): Promise<Check> {
  const result = await run(adbPath, ["version"], { timeoutMs: 10_000 });
  if (result.exitCode !== 0 && result.exitCode !== null) {
    return {
      name: "ADB",
      status: "error",
      detail:
        `adb not found or failed. Checked: ${adbPath}\n` +
        `   ${result.stderr || result.stdout}\n` +
        "   Ensure ANDROID_SDK_ROOT/platform-tools is on your PATH or set adbPath in config.",
    };
  }
  const versionLine = (result.stdout + result.stderr)
    .split("\n")
    .find((l) => l.includes("Android Debug Bridge"))
    ?? result.stdout.trim();
  return { name: "ADB", status: "ok", detail: versionLine };
}

function checkFilePresence(name: string, filePath: string): Check {
  return {
    name,
    status: fs.existsSync(filePath) ? "ok" : "warn",
    detail: fs.existsSync(filePath)
      ? filePath
      : `Not found: ${filePath}`,
  };
}
