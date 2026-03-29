/**
 * Tool: android.artifact.verify
 * Verifies an APK with apksigner and/or a .aab with bundletool.
 */
import path from "path";
import os from "os";
import fs from "fs";
import { McpConfig, safeResolvePath } from "../config";
import { run, RunResult } from "../runner";

function latestBuildToolsDir(config: McpConfig): string | null {
  const btRoot = path.join(config.androidSdkRoot, "build-tools");
  if (!fs.existsSync(btRoot)) return null;
  const versions = fs.readdirSync(btRoot).sort().reverse();
  return versions.length > 0 ? path.join(btRoot, versions[0]) : null;
}

export async function verifyArtifact(
  workDir: string,
  artifactRelPath: string,
  config: McpConfig
): Promise<RunResult> {
  const artifactPath = safeResolvePath(workDir, artifactRelPath);

  if (!fs.existsSync(artifactPath)) {
    return { stdout: "", stderr: `Artifact not found: ${artifactPath}`, exitCode: 1 };
  }

  const ext = path.extname(artifactPath).toLowerCase();

  if (ext === ".apk") {
    const btDir = latestBuildToolsDir(config);
    if (!btDir) {
      return { stdout: "", stderr: "No build-tools found in ANDROID_SDK_ROOT", exitCode: 1 };
    }
    const apksigner = path.join(btDir, os.platform() === "win32" ? "apksigner.bat" : "apksigner");
    return run(apksigner, ["verify", "--verbose", artifactPath], {
      cwd: workDir,
      androidSdkRoot: config.androidSdkRoot,
      javaHome: config.javaHome,
      timeoutMs: 30_000,
    });
  }

  if (ext === ".aab") {
    if (!config.bundletoolJar || !fs.existsSync(config.bundletoolJar)) {
      return {
        stdout: "",
        stderr: "bundletoolJar not configured or not found. Set bundletoolJar in android-dev-mcp.config.json.",
        exitCode: 1,
      };
    }
    const java = path.join(config.javaHome, "bin", os.platform() === "win32" ? "java.exe" : "java");
    return run(java, ["-jar", config.bundletoolJar, "validate", "--bundle", artifactPath], {
      cwd: workDir,
      androidSdkRoot: config.androidSdkRoot,
      javaHome: config.javaHome,
      timeoutMs: 30_000,
    });
  }

  return {
    stdout: "",
    stderr: `Unsupported artifact type: ${ext}. Expected .apk or .aab`,
    exitCode: 1,
  };
}
