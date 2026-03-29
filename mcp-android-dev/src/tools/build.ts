/**
 * tools/build.ts — Gradle build tools (read-only output: compile + assemble)
 *
 * Allowed operations: list tasks, assemble APK/AAB, lint, compile only.
 * This tool DOES NOT write any source files; it only invokes Gradle tasks
 * that produce build artifacts under the project's build/ directory.
 */

import * as path from "path";
import * as fs from "fs";
import {
  ANDROID_PROJECT_ROOT,
  GRADLE_WRAPPER,
  BUILD_TIMEOUT_MS,
} from "../config.js";
import { run } from "../runner.js";

// ---------------------------------------------------------------------------
// Allowed Gradle task prefixes (build/assemble/compile only — no source edits)
// ---------------------------------------------------------------------------
const ALLOWED_TASK_PREFIXES = [
  "assemble",
  "bundle",
  "compile",
  "lint",
  "check",
  "test",
  "build",
  "dependencies",
  "projects",
  "tasks",
  "properties",
  "help",
  "androidDependencies",
  "signingReport",
  "sourceSets",
] as const;

/** Validate that a Gradle task name starts with an allowed prefix. */
function assertAllowedTask(task: string): void {
  const lower = task.toLowerCase();
  const allowed = ALLOWED_TASK_PREFIXES.some((prefix) =>
    lower.startsWith(prefix)
  );
  if (!allowed) {
    throw new Error(
      `Task "${task}" is not permitted. Allowed task prefixes: ` +
        ALLOWED_TASK_PREFIXES.join(", ") +
        ". This MCP server is read-only and does not run source-modifying tasks."
    );
  }
}

/** Resolve the project root (param overrides the env-configured default). */
function resolveProjectRoot(projectRoot?: string): string {
  const root = projectRoot || ANDROID_PROJECT_ROOT;
  if (!fs.existsSync(root)) {
    throw new Error(
      `Project root not found: "${root}". ` +
        "Set ANDROID_PROJECT_ROOT in .env or pass projectRoot explicitly."
    );
  }
  return root;
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/** List all Gradle tasks in the project. */
export async function listTasks(projectRoot?: string): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const result = await run(GRADLE_WRAPPER, ["tasks", "--all"], root, BUILD_TIMEOUT_MS);
  if (result.exitCode !== 0) {
    throw new Error(`Gradle tasks failed (exit ${result.exitCode}):\n${result.stderr}`);
  }
  return result.stdout;
}

/** Run an assemble task (debug or release APK). */
export async function assembleApk(
  variant: "debug" | "release",
  module: string,
  projectRoot?: string
): Promise<string> {
  const task = `:${module}:assemble${capitalize(variant)}`;
  assertAllowedTask("assemble");
  const root = resolveProjectRoot(projectRoot);
  const result = await run(GRADLE_WRAPPER, [task, "--stacktrace"], root, BUILD_TIMEOUT_MS);
  const output = formatOutput(result);
  if (result.exitCode !== 0) {
    throw new Error(`assembleApk failed (exit ${result.exitCode}):\n${output}`);
  }
  return output;
}

/** Build an Android App Bundle (AAB). */
export async function bundleAab(
  variant: "debug" | "release",
  module: string,
  projectRoot?: string
): Promise<string> {
  const task = `:${module}:bundle${capitalize(variant)}`;
  assertAllowedTask("bundle");
  const root = resolveProjectRoot(projectRoot);
  const result = await run(GRADLE_WRAPPER, [task, "--stacktrace"], root, BUILD_TIMEOUT_MS);
  const output = formatOutput(result);
  if (result.exitCode !== 0) {
    throw new Error(`bundleAab failed (exit ${result.exitCode}):\n${output}`);
  }
  return output;
}

/** Run Gradle lint. */
export async function runLint(module: string, projectRoot?: string): Promise<string> {
  const task = `:${module}:lint`;
  assertAllowedTask("lint");
  const root = resolveProjectRoot(projectRoot);
  const result = await run(GRADLE_WRAPPER, [task], root, BUILD_TIMEOUT_MS);
  const output = formatOutput(result);
  // Lint may exit non-zero if it finds issues; return output either way
  return `Exit code: ${result.exitCode}\n${output}`;
}

/** Show the dependency tree for a module. */
export async function showDependencies(
  module: string,
  configuration?: string,
  projectRoot?: string
): Promise<string> {
  const task = `:${module}:dependencies`;
  assertAllowedTask("dependencies");
  const args = configuration ? [task, `--configuration=${configuration}`] : [task];
  const root = resolveProjectRoot(projectRoot);
  const result = await run(GRADLE_WRAPPER, args, root, BUILD_TIMEOUT_MS);
  if (result.exitCode !== 0) {
    throw new Error(`dependencies failed (exit ${result.exitCode}):\n${result.stderr}`);
  }
  return result.stdout;
}

/** Show signingReport (key aliases, fingerprints). */
export async function signingReport(projectRoot?: string): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const result = await run(GRADLE_WRAPPER, ["signingReport"], root, BUILD_TIMEOUT_MS);
  if (result.exitCode !== 0) {
    throw new Error(`signingReport failed (exit ${result.exitCode}):\n${result.stderr}`);
  }
  return result.stdout;
}

/** Find built APK/AAB artifacts under the project build directory. */
export async function listArtifacts(projectRoot?: string): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const buildDir = path.join(root, "app", "build", "outputs");
  if (!fs.existsSync(buildDir)) {
    return "No build outputs found yet. Run assemble or bundle first.";
  }
  const artifacts = walkDir(buildDir).filter(
    (f) => f.endsWith(".apk") || f.endsWith(".aab")
  );
  return artifacts.length
    ? artifacts.join("\n")
    : "No APK/AAB files found in build outputs.";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatOutput(result: { stdout: string; stderr: string }): string {
  const parts: string[] = [];
  if (result.stdout) parts.push(result.stdout);
  if (result.stderr) parts.push(`STDERR:\n${result.stderr}`);
  return parts.join("\n");
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}
