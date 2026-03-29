/**
 * tools/gradle.ts – android.gradle.tasks.list and android.gradle.run
 *
 * Wraps the Gradle wrapper (gradlew.bat) for listing and running tasks.
 * The list of allowed Gradle tasks is strictly limited to read-only / build
 * operations – no source-modifying tasks are permitted.
 */

import path from "node:path";
import { z } from "zod";
import { assertAllowedPath, loadConfig } from "../config.js";
import { runFormatted } from "../runner.js";

/** Tasks that modify source files or VCS state – denied at the tool layer */
const DENIED_GRADLE_TASKS = new Set([
  "spotlessApply",
  "ktlintFormat",
  "updateLintBaseline",
  "generateLicenseReport",   // may write files
  "dependencyUpdates",       // may write files
  "gitPublishPush",
  "publish",
  "publishToMavenLocal",
  "release",
]);

function gradlewPath(projectRoot: string, gradlewName: string): string {
  return path.join(projectRoot, gradlewName);
}

// ─── android.gradle.tasks.list ───────────────────────────────────────────────

export const GradleTasksListSchema = z.object({
  projectPath: z
    .string()
    .describe("Absolute path to the Android project root (where gradlew.bat lives)"),
  subproject: z
    .string()
    .optional()
    .describe("Optional Gradle subproject / module name (e.g. ':app')"),
});

export async function gradleTasksList(
  input: z.infer<typeof GradleTasksListSchema>
): Promise<string> {
  const cfg = loadConfig();
  const root = assertAllowedPath(input.projectPath, cfg);
  const gradlew = gradlewPath(root, cfg.gradlewName);

  const args: string[] = input.subproject
    ? [`${input.subproject.replace(/^:?/, ":")}:tasks`, "--all"]
    : ["tasks", "--all"];

  const env: NodeJS.ProcessEnv = {};
  if (cfg.javaHome) env.JAVA_HOME = cfg.javaHome;

  return runFormatted(gradlew, args, { cwd: root, env, timeoutMs: cfg.defaultTimeoutMs });
}

// ─── android.gradle.run ──────────────────────────────────────────────────────

export const GradleRunSchema = z.object({
  projectPath: z
    .string()
    .describe("Absolute path to the Android project root"),
  task: z
    .string()
    .describe(
      "Gradle task to run, e.g. ':app:assembleDebug', ':app:bundleRelease', ':app:testDebugUnitTest', 'clean'"
    ),
  extraArgs: z
    .array(z.string())
    .optional()
    .describe("Additional Gradle flags, e.g. ['--stacktrace', '-Pbuildkonfig.flavor=staging']"),
});

export async function gradleRun(input: z.infer<typeof GradleRunSchema>): Promise<string> {
  const cfg = loadConfig();
  const root = assertAllowedPath(input.projectPath, cfg);

  // Deny source-modifying tasks
  const taskName = input.task.split(":").pop() ?? input.task;
  if (DENIED_GRADLE_TASKS.has(taskName)) {
    return `Error: Gradle task "${taskName}" is denied by the MCP server policy (it can modify source files).`;
  }

  const gradlew = gradlewPath(root, cfg.gradlewName);
  const args = [input.task, ...(input.extraArgs ?? [])];

  const env: NodeJS.ProcessEnv = {};
  if (cfg.javaHome) env.JAVA_HOME = cfg.javaHome;

  return runFormatted(gradlew, args, { cwd: root, env, timeoutMs: cfg.defaultTimeoutMs });
}
