/**
 * tools/test.ts – test.instrumentation.run
 *
 * Runs Android instrumentation tests via Gradle (preferred) or ADB directly.
 */

import { z } from "zod";
import { assertAllowedPath, loadConfig, resolveAdb } from "../config.js";
import { runFormatted } from "../runner.js";
import { gradleRun } from "./gradle.js";

// ─── test.instrumentation.run ────────────────────────────────────────────────

export const TestInstrumentationRunSchema = z.object({
  projectPath: z
    .string()
    .describe("Absolute path to the Android project root"),
  module: z
    .string()
    .default(":app")
    .describe("Gradle module, e.g. ':app' or ':feature:login'"),
  flavor: z
    .string()
    .optional()
    .describe("Product flavor (if any)"),
  buildType: z
    .string()
    .default("debug")
    .describe("Build type for the test variant"),
  testClass: z
    .string()
    .optional()
    .describe(
      "Fully-qualified test class or method to run, e.g. 'com.example.LoginTest#testLogin'"
    ),
  deviceId: z
    .string()
    .optional()
    .describe(
      "ADB device serial to target (Gradle will use it via -Pandroid.testInstrumentationRunnerArguments.serial)"
    ),
  useAdb: z
    .boolean()
    .default(false)
    .describe(
      "Use ADB directly (requires the test APK to already be installed). Default: use Gradle."
    ),
  runner: z
    .string()
    .optional()
    .describe(
      "Test runner class (ADB mode only). Default: androidx.test.runner.AndroidJUnitRunner"
    ),
  packageName: z
    .string()
    .optional()
    .describe("App package name (ADB mode only)"),
  extraArgs: z
    .array(z.string())
    .optional()
    .describe("Extra Gradle flags or ADB extra args"),
});

export async function testInstrumentationRun(
  input: z.infer<typeof TestInstrumentationRunSchema>
): Promise<string> {
  const cfg = loadConfig();
  assertAllowedPath(input.projectPath, cfg);

  // ── ADB-direct mode ────────────────────────────────────────────────────────
  if (input.useAdb) {
    if (!input.packageName) {
      return "Error: 'packageName' is required when useAdb=true.";
    }
    const adb = resolveAdb(cfg);
    const testPackage = `${input.packageName}.test`;
    const runner =
      input.runner ?? "androidx.test.runner.AndroidJUnitRunner";

    const adbArgs: string[] = [];
    if (input.deviceId) adbArgs.push("-s", input.deviceId);
    adbArgs.push("shell", "am", "instrument", "-w", "-r");
    if (input.testClass) {
      adbArgs.push("-e", "class", input.testClass);
    }
    adbArgs.push(`${testPackage}/${runner}`);

    return runFormatted(adb, adbArgs, { timeoutMs: cfg.defaultTimeoutMs });
  }

  // ── Gradle connectedCheck mode ─────────────────────────────────────────────
  const variant = input.flavor
    ? `${capitalize(input.flavor)}${capitalize(input.buildType)}`
    : capitalize(input.buildType);
  const task = `${input.module}:connected${variant}AndroidTest`;

  const extraArgs = [...(input.extraArgs ?? [])];
  if (input.testClass) {
    extraArgs.push(
      `-Pandroid.testInstrumentationRunnerArguments.class=${input.testClass}`
    );
  }
  if (input.deviceId) {
    extraArgs.push(
      `-Pandroid.testInstrumentationRunnerArguments.serial=${input.deviceId}`
    );
  }

  return gradleRun({ projectPath: input.projectPath, task, extraArgs });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
