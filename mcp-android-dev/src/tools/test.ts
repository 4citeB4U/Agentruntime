/**
 * tools/test.ts — Test execution tools (read-only: runs tests, collects reports)
 *
 * Allowed: unit tests, instrumentation tests, report collection.
 * This tool DOES NOT write source files; it only runs existing test suites
 * and collects their output artifacts.
 */

import * as path from "path";
import * as fs from "fs";
import {
  ANDROID_PROJECT_ROOT,
  GRADLE_WRAPPER,
  BUILD_TIMEOUT_MS,
} from "../config.js";
import { run } from "../runner.js";

/** Run unit tests for a module variant. */
export async function runUnitTests(
  module: string,
  variant: "debug" | "release" = "debug",
  projectRoot?: string
): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const task = `:${module}:test${capitalize(variant)}UnitTest`;
  const result = await run(GRADLE_WRAPPER, [task, "--continue"], root, BUILD_TIMEOUT_MS);
  const output = formatOutput(result);
  return `Unit test exit code: ${result.exitCode}\n${output}`;
}

/** Run connected/instrumentation tests on an attached device or emulator. */
export async function runInstrumentationTests(
  module: string,
  testRunner?: string,
  projectRoot?: string
): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const task = `:${module}:connectedDebugAndroidTest`;
  const extraArgs = testRunner
    ? [`-Pandroid.testInstrumentationRunnerArguments.runner=${testRunner}`]
    : [];
  const result = await run(
    GRADLE_WRAPPER,
    [task, "--continue", ...extraArgs],
    root,
    BUILD_TIMEOUT_MS
  );
  const output = formatOutput(result);
  return `Instrumentation test exit code: ${result.exitCode}\n${output}`;
}

/** Collect test reports from the build output directory. */
export async function collectTestReports(projectRoot?: string): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const reportsBase = path.join(root, "app", "build", "reports");
  if (!fs.existsSync(reportsBase)) {
    return "No test reports found. Run tests first.";
  }
  const reports = walkDir(reportsBase).filter(
    (f) => f.endsWith(".html") || f.endsWith(".xml") || f.endsWith(".json")
  );
  return reports.length
    ? `Found ${reports.length} report file(s):\n` + reports.join("\n")
    : "No report files (.html/.xml/.json) found in build/reports/.";
}

/** Show Gradle test task options/help. */
export async function testHelp(projectRoot?: string): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const result = await run(
    GRADLE_WRAPPER,
    ["help", "--task", "test"],
    root,
    BUILD_TIMEOUT_MS
  );
  return result.stdout || result.stderr;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
