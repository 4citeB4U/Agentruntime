/**
 * Tool: diagnostics.android.health
 * Checks that all required CLI tools are reachable and environment variables are set.
 */
import { McpConfig } from "../config";
import { run } from "../runner";
import fs from "fs";
import path from "path";
import os from "os";

export interface HealthReport {
  ok: boolean;
  androidSdkRoot: string;
  javaHome: string;
  tools: Record<string, { found: boolean; version?: string; error?: string }>;
  warnings: string[];
}

async function checkTool(
  name: string,
  executable: string,
  versionArgs: string[],
  cwd: string,
  config: McpConfig
): Promise<{ found: boolean; version?: string; error?: string }> {
  try {
    const result = await run(executable, versionArgs, {
      cwd,
      androidSdkRoot: config.androidSdkRoot,
      javaHome: config.javaHome,
      timeoutMs: 15_000,
    });
    const out = (result.stdout + result.stderr).trim().split("\n")[0] ?? "";
    return { found: result.exitCode === 0, version: out };
  } catch (e: unknown) {
    return { found: false, error: String(e) };
  }
}

export async function runHealthCheck(config: McpConfig): Promise<HealthReport> {
  const warnings: string[] = [];
  const cwd = config.allowedWorkingDirs[0];

  const adb = path.join(config.androidSdkRoot, "platform-tools", os.platform() === "win32" ? "adb.exe" : "adb");
  const emulator = path.join(config.androidSdkRoot, "emulator", os.platform() === "win32" ? "emulator.exe" : "emulator");

  const tools: Record<string, { found: boolean; version?: string; error?: string }> = {};
  tools["adb"] = await checkTool("adb", adb, ["version"], cwd, config);
  tools["emulator"] = await checkTool("emulator", emulator, ["-version"], cwd, config);

  // Check aapt2
  const buildToolsDirs = fs.existsSync(path.join(config.androidSdkRoot, "build-tools"))
    ? fs.readdirSync(path.join(config.androidSdkRoot, "build-tools")).sort().reverse()
    : [];
  if (buildToolsDirs.length > 0) {
    const latestBt = path.join(
      config.androidSdkRoot,
      "build-tools",
      buildToolsDirs[0],
      os.platform() === "win32" ? "aapt2.exe" : "aapt2"
    );
    tools["aapt2"] = await checkTool("aapt2", latestBt, ["version"], cwd, config);
  } else {
    tools["aapt2"] = { found: false, error: "No build-tools directory found in SDK" };
    warnings.push("build-tools not found under ANDROID_SDK_ROOT");
  }

  // Check apksigner
  if (buildToolsDirs.length > 0) {
    const apksigner = path.join(
      config.androidSdkRoot,
      "build-tools",
      buildToolsDirs[0],
      os.platform() === "win32" ? "apksigner.bat" : "apksigner"
    );
    tools["apksigner"] = await checkTool("apksigner", apksigner, ["version"], cwd, config);
  } else {
    tools["apksigner"] = { found: false, error: "No build-tools directory found in SDK" };
  }

  // Check bundletool
  if (config.bundletoolJar && fs.existsSync(config.bundletoolJar)) {
    const java = path.join(config.javaHome, "bin", os.platform() === "win32" ? "java.exe" : "java");
    tools["bundletool"] = await checkTool(
      "bundletool",
      java,
      ["-jar", config.bundletoolJar, "version"],
      cwd,
      config
    );
  } else {
    tools["bundletool"] = { found: false, error: config.bundletoolJar ? "JAR not found" : "bundletoolJar not configured" };
    warnings.push("bundletool not configured – android.artifact.verify will have limited AAB support");
  }

  // Check maestro
  if (config.maestroEnabled) {
    tools["maestro"] = await checkTool("maestro", "maestro", ["--version"], cwd, config);
  }

  // Check JAVA_HOME / java
  const java = path.join(config.javaHome, "bin", os.platform() === "win32" ? "java.exe" : "java");
  if (!fs.existsSync(java)) {
    tools["java"] = { found: false, error: `java not found at ${java}` };
    warnings.push("JAVA_HOME does not contain a valid JRE/JDK");
  } else {
    tools["java"] = await checkTool("java", java, ["-version"], cwd, config);
  }

  const allCriticalFound = tools["adb"]?.found && tools["java"]?.found;

  return {
    ok: !!allCriticalFound,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    tools,
    warnings,
  };
}
