/**
 * tools/project.ts – android.project.detect
 *
 * Detects Android project structure: modules, flavors, build variants,
 * app IDs, signing configs, and Gradle wrapper presence.
 */

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertAllowedPath, loadConfig } from "../config.js";

export const ProjectDetectSchema = z.object({
  projectPath: z
    .string()
    .describe("Absolute path to the root of the Android project (where settings.gradle lives)"),
});

export async function projectDetect(
  input: z.infer<typeof ProjectDetectSchema>
): Promise<string> {
  const cfg = loadConfig();
  const root = assertAllowedPath(input.projectPath, cfg);

  if (!fs.existsSync(root)) {
    return `Error: directory does not exist: ${root}`;
  }

  const report: string[] = [`Android project report for: ${root}`, ""];

  // ── Gradle wrapper ───────────────────────────────────────────────────────
  const gradlew = path.join(root, cfg.gradlewName);
  const hasGradlew = fs.existsSync(gradlew);
  report.push(`Gradle wrapper (${cfg.gradlewName}): ${hasGradlew ? "✔ found" : "✘ missing"}`);

  const gradlePropsPath = path.join(root, "gradle", "wrapper", "gradle-wrapper.properties");
  if (fs.existsSync(gradlePropsPath)) {
    const props = fs.readFileSync(gradlePropsPath, "utf-8");
    const match = props.match(/distributionUrl=(.+)/);
    if (match) report.push(`Gradle version: ${match[1].trim()}`);
  }
  report.push("");

  // ── settings.gradle / settings.gradle.kts ───────────────────────────────
  const settingsFiles = ["settings.gradle", "settings.gradle.kts"];
  let settingsContent = "";
  for (const sf of settingsFiles) {
    const sfPath = path.join(root, sf);
    if (fs.existsSync(sfPath)) {
      settingsContent = fs.readFileSync(sfPath, "utf-8");
      report.push(`Settings file: ${sf}`);
      break;
    }
  }

  // Extract included modules
  const moduleMatches = [...settingsContent.matchAll(/include\s*['":]+([^'")\s]+)/g)];
  const modules = moduleMatches.map((m) => m[1]);
  if (modules.length > 0) {
    report.push(`Modules: ${modules.join(", ")}`);
  }
  report.push("");

  // ── App-level build.gradle ───────────────────────────────────────────────
  const appBuildFiles = [
    path.join(root, "app", "build.gradle"),
    path.join(root, "app", "build.gradle.kts"),
  ];
  for (const abf of appBuildFiles) {
    if (!fs.existsSync(abf)) continue;
    const content = fs.readFileSync(abf, "utf-8");
    report.push(`App build file: ${path.relative(root, abf)}`);

    const appId = content.match(/applicationId\s+["']([^"']+)["']/);
    if (appId) report.push(`Application ID: ${appId[1]}`);

    const compileSdk = content.match(/compileSdk[Vv]ersion\s+(\d+)/);
    if (compileSdk) report.push(`compileSdkVersion: ${compileSdk[1]}`);

    const minSdk = content.match(/minSdk[Vv]ersion\s+(\d+)/);
    if (minSdk) report.push(`minSdkVersion: ${minSdk[1]}`);

    const targetSdk = content.match(/targetSdk[Vv]ersion\s+(\d+)/);
    if (targetSdk) report.push(`targetSdkVersion: ${targetSdk[1]}`);

    const versionName = content.match(/versionName\s+["']([^"']+)["']/);
    if (versionName) report.push(`versionName: ${versionName[1]}`);

    // Flavors
    const flavors = [...content.matchAll(/(\w+)\s*\{[\s\S]*?applicationIdSuffix/g)].map((m) => m[1]);
    if (flavors.length > 0) report.push(`Flavors (detected): ${flavors.join(", ")}`);

    // Build types
    const buildTypes = [...content.matchAll(/(\w+)\s*\{[\s\S]*?minifyEnabled/g)].map((m) => m[1]);
    if (buildTypes.length > 0) report.push(`Build types (with minify): ${buildTypes.join(", ")}`);

    // Signing configs
    const signingConfigs = [...content.matchAll(/signingConfig\s+signingConfigs\.(\w+)/g)].map(
      (m) => m[1]
    );
    if (signingConfigs.length > 0)
      report.push(`Signing configs referenced: ${[...new Set(signingConfigs)].join(", ")}`);

    report.push("");
    break;
  }

  // ── Local properties ─────────────────────────────────────────────────────
  const localProps = path.join(root, "local.properties");
  if (fs.existsSync(localProps)) {
    const lp = fs.readFileSync(localProps, "utf-8");
    const sdkDir = lp.match(/sdk\.dir=(.+)/);
    if (sdkDir) report.push(`local.properties sdk.dir: ${sdkDir[1].trim()}`);
  }

  return report.join("\n");
}
