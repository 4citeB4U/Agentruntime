/**
 * Tools: android.build.apk, android.build.aab
 */
import path from "path";
import os from "os";
import { McpConfig, assertAllowedDir } from "../config";
import { run, RunResult } from "../runner";

function gradlewExecutable(projectRoot: string): string {
  if (os.platform() === "win32") {
    return path.join(projectRoot, "gradlew.bat");
  }
  return path.join(projectRoot, "gradlew");
}

/**
 * Builds a debug or release APK using the Gradle wrapper.
 * @param projectDir - root of the Android Gradle project
 * @param module     - Gradle module name (e.g. "app")
 * @param variant    - build variant: "debug" | "release" | custom
 */
export async function buildApk(
  projectDir: string,
  module: string,
  variant: string,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(projectDir, config);
  const gradlew = gradlewExecutable(cwd);

  // Capitalize variant for Gradle task name: debug -> assembleDebug
  const taskVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
  const task = `:${module}:assemble${taskVariant}`;

  return run(gradlew, [task, "--no-daemon"], {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 600_000, // 10 min
  });
}

/**
 * Builds an Android App Bundle (.aab) using the Gradle wrapper.
 */
export async function buildAab(
  projectDir: string,
  module: string,
  variant: string,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(projectDir, config);
  const gradlew = gradlewExecutable(cwd);

  const taskVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
  const task = `:${module}:bundle${taskVariant}`;

  return run(gradlew, [task, "--no-daemon"], {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 600_000,
  });
}
