/**
 * tools/deploy.ts — Deployment tools (ADB sideload + optional release pipeline)
 *
 * Covered operations:
 *  - Side-load APK to a connected device via adb
 *  - Invoke a fastlane lane (must be installed locally)
 *  - Invoke Gradle Play Publisher upload task (requires your own service-account key)
 *
 * This module DOES NOT modify any repository source files.
 * All writes go to: Android device filesystem, Play Store, or build output dirs.
 */

import * as fs from "fs";
import * as path from "path";
import {
  ANDROID_PROJECT_ROOT,
  GRADLE_WRAPPER,
  BUILD_TIMEOUT_MS,
  ADB_PATH,
  ADB_TIMEOUT_MS,
} from "../config.js";
import { run } from "../runner.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveProjectRoot(projectRoot?: string): string {
  const root = projectRoot || ANDROID_PROJECT_ROOT;
  if (!fs.existsSync(root)) {
    throw new Error(`Project root not found: "${root}".`);
  }
  return root;
}

function adb(args: string[], cwd: string, timeoutMs = ADB_TIMEOUT_MS) {
  return run(ADB_PATH, args, cwd, timeoutMs);
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * Install an APK directly onto a connected device/emulator.
 * The APK must already have been built; if it doesn't exist the tool errors.
 */
export async function sideloadApk(
  apkPath: string,
  serial?: string,
  reinstall = true
): Promise<string> {
  if (!fs.existsSync(apkPath)) {
    throw new Error(
      `APK not found: "${apkPath}". ` +
        "Use build.assembleApk() first, then pass the resulting path here."
    );
  }
  const flags = reinstall ? ["-r"] : [];
  const serialArgs = serial ? ["-s", serial] : [];
  const result = await adb(
    [...serialArgs, "install", ...flags, apkPath],
    path.dirname(apkPath),
    ADB_TIMEOUT_MS * 4
  );
  if (result.exitCode !== 0) {
    throw new Error(`APK install failed (exit ${result.exitCode}):\n${result.stderr}`);
  }
  return result.stdout || `APK installed successfully: ${path.basename(apkPath)}`;
}

/**
 * Run a fastlane lane.
 * fastlane must be installed in the project (Fastfile must exist).
 * Only the lane name is accepted — no arbitrary shell is executed.
 */
export async function runFastlaneLane(
  lane: string,
  projectRoot?: string
): Promise<string> {
  // Validate lane name: only alphanumeric + underscore
  if (!/^[a-zA-Z0-9_]+$/.test(lane)) {
    throw new Error(
      `Invalid lane name "${lane}". Lane names must be alphanumeric with underscores only.`
    );
  }
  const root = resolveProjectRoot(projectRoot);
  // fastlane executable on Windows may be a Ruby gem (fastlane.bat or bundle exec fastlane)
  const fastlaneExe = fs.existsSync(path.join(root, "Gemfile"))
    ? "bundle"
    : "fastlane";
  const args =
    fastlaneExe === "bundle" ? ["exec", "fastlane", lane] : [lane];
  const result = await run(fastlaneExe, args, root, BUILD_TIMEOUT_MS * 2);
  const combined = [result.stdout, result.stderr ? `STDERR:\n${result.stderr}` : ""]
    .filter(Boolean)
    .join("\n");
  if (result.exitCode !== 0) {
    throw new Error(`fastlane lane "${lane}" failed (exit ${result.exitCode}):\n${combined}`);
  }
  return combined || `fastlane lane "${lane}" completed successfully.`;
}

/**
 * Publish to Google Play via Gradle Play Publisher.
 * The track must be one of: internal | alpha | beta | production.
 * This requires GOOGLE_PLAY_SERVICE_ACCOUNT_JSON to be set in .env.
 */
export async function publishToPlay(
  track: "internal" | "alpha" | "beta" | "production",
  module: string,
  projectRoot?: string
): Promise<string> {
  if (!process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    throw new Error(
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set. " +
        "Add it to your .env file pointing to your Google Play service account key JSON."
    );
  }
  const root = resolveProjectRoot(projectRoot);
  const task = `:${module}:publish${capitalize(track)}Bundle`;
  const result = await run(GRADLE_WRAPPER, [task], root, BUILD_TIMEOUT_MS * 3);
  const combined = [result.stdout, result.stderr ? `STDERR:\n${result.stderr}` : ""]
    .filter(Boolean)
    .join("\n");
  if (result.exitCode !== 0) {
    throw new Error(
      `Play publish to "${track}" failed (exit ${result.exitCode}):\n${combined}`
    );
  }
  return combined || `Published to Play Store track "${track}" successfully.`;
}

/** List available fastlane lanes in the project. */
export async function listFastlaneLanes(projectRoot?: string): Promise<string> {
  const root = resolveProjectRoot(projectRoot);
  const fastfilePath = path.join(root, "fastlane", "Fastfile");
  if (!fs.existsSync(fastfilePath)) {
    return "No Fastfile found. Initialize fastlane in your project first.";
  }
  const content = fs.readFileSync(fastfilePath, "utf8");
  const laneMatches = [...content.matchAll(/^\s*lane\s+:(\w+)/gm)].map(
    (m) => m[1]
  );
  return laneMatches.length
    ? `Available lanes:\n${laneMatches.map((l) => `  - ${l}`).join("\n")}`
    : "No lanes found in Fastfile.";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
