/**
 * Tools: android.gradle.tasks.list, android.gradle.run
 */
import path from "path";
import os from "os";
import { McpConfig, assertAllowedDir } from "../config";
import { run, RunResult } from "../runner";

function gradlewExecutable(projectRoot: string): string {
  const bat = path.join(projectRoot, "gradlew.bat");
  const sh = path.join(projectRoot, "gradlew");
  if (os.platform() === "win32") {
    return bat;
  }
  return sh;
}

export async function listGradleTasks(
  projectDir: string,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(projectDir, config);
  const gradlew = gradlewExecutable(cwd);
  return run(gradlew, ["tasks", "--all", "--no-daemon"], {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 90_000,
  });
}

export async function runGradleTask(
  projectDir: string,
  task: string,
  extraArgs: string[],
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(projectDir, config);
  const gradlew = gradlewExecutable(cwd);

  // Extra safety: block write-modifying Gradle tasks by name
  const BLOCKED_TASKS = [
    "spotlessApply",
    "ktlintFormat",
    "formatKotlin",
    "checkstyleMain",
    "generateCode",
    "release",
  ];
  const lowerTask = task.toLowerCase();
  for (const blocked of BLOCKED_TASKS) {
    if (lowerTask.includes(blocked.toLowerCase())) {
      throw new Error(
        `Gradle task "${task}" is blocked by the read-only MCP policy.`
      );
    }
  }

  return run(gradlew, [task, "--no-daemon", ...extraArgs], {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 300_000, // 5 min for builds
  });
}
