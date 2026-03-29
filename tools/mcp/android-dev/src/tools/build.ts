/**
 * tools/build.ts – android.build.apk and android.build.aab
 *
 * Convenience wrappers around the Gradle wrapper that build APK or AAB
 * artifacts for a given module, flavor, and build type.
 */

import { z } from "zod";
import { gradleRun } from "./gradle.js";

// ─── android.build.apk ───────────────────────────────────────────────────────

export const BuildApkSchema = z.object({
  projectPath: z
    .string()
    .describe("Absolute path to the Android project root"),
  module: z
    .string()
    .default(":app")
    .describe("Gradle module path, e.g. ':app' or ':feature:login'"),
  flavor: z
    .string()
    .optional()
    .describe("Product flavor name (case-sensitive), e.g. 'staging', 'prod'"),
  buildType: z
    .string()
    .default("debug")
    .describe("Build type: 'debug' or 'release'"),
  extraArgs: z
    .array(z.string())
    .optional()
    .describe("Extra Gradle arguments"),
});

export async function buildApk(input: z.infer<typeof BuildApkSchema>): Promise<string> {
  const { flavor, buildType, module } = input;

  // Construct Gradle task name: :app:assembleDebug, :app:assembleStagingRelease …
  const variantPart = flavor
    ? `${capitalize(flavor)}${capitalize(buildType)}`
    : capitalize(buildType);
  const task = `${module}:assemble${variantPart}`;

  return gradleRun({
    projectPath: input.projectPath,
    task,
    extraArgs: input.extraArgs,
  });
}

// ─── android.build.aab ───────────────────────────────────────────────────────

export const BuildAabSchema = z.object({
  projectPath: z
    .string()
    .describe("Absolute path to the Android project root"),
  module: z
    .string()
    .default(":app")
    .describe("Gradle module path"),
  flavor: z
    .string()
    .optional()
    .describe("Product flavor name"),
  buildType: z
    .string()
    .default("release")
    .describe("Build type (usually 'release' for AAB)"),
  extraArgs: z
    .array(z.string())
    .optional()
    .describe("Extra Gradle arguments"),
});

export async function buildAab(input: z.infer<typeof BuildAabSchema>): Promise<string> {
  const { flavor, buildType, module } = input;
  const variantPart = flavor
    ? `${capitalize(flavor)}${capitalize(buildType)}`
    : capitalize(buildType);
  const task = `${module}:bundle${variantPart}`;

  return gradleRun({
    projectPath: input.projectPath,
    task,
    extraArgs: input.extraArgs,
  });
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
