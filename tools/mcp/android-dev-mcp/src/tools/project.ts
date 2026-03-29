/**
 * Tools: android.project.detect
 * Detects an Android Gradle project in a given directory.
 */
import fs from "fs";
import path from "path";
import { McpConfig, assertAllowedDir } from "../config";

export interface ProjectInfo {
  projectRoot: string;
  hasGradleWrapper: boolean;
  gradlewPath: string;
  settingsFile?: string;
  appModules: string[];
  buildVariants: string[];
}

/**
 * Detects an Android project starting from `startDir`.
 * Walks up the directory tree if needed to find the Gradle root.
 */
export function detectProject(startDir: string, config: McpConfig): ProjectInfo {
  const resolvedDir = assertAllowedDir(startDir, config);

  // Look for gradlew / gradlew.bat walking upward from startDir
  let current = resolvedDir;
  let projectRoot: string | null = null;

  for (let i = 0; i < 8; i++) {
    const hasGradlew =
      fs.existsSync(path.join(current, "gradlew.bat")) ||
      fs.existsSync(path.join(current, "gradlew"));
    if (hasGradlew) {
      projectRoot = current;
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  if (!projectRoot) {
    return {
      projectRoot: resolvedDir,
      hasGradleWrapper: false,
      gradlewPath: "",
      appModules: [],
      buildVariants: [],
    };
  }

  const gradlewPath = fs.existsSync(path.join(projectRoot, "gradlew.bat"))
    ? path.join(projectRoot, "gradlew.bat")
    : path.join(projectRoot, "gradlew");

  const settingsFile =
    fs.existsSync(path.join(projectRoot, "settings.gradle.kts"))
      ? path.join(projectRoot, "settings.gradle.kts")
      : fs.existsSync(path.join(projectRoot, "settings.gradle"))
      ? path.join(projectRoot, "settings.gradle")
      : undefined;

  // Find sub-modules that look like Android app modules (have a build.gradle with android plugin)
  const appModules: string[] = [];
  if (fs.existsSync(projectRoot)) {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const modDir = path.join(projectRoot, entry.name);
      const buildGradle =
        fs.existsSync(path.join(modDir, "build.gradle.kts"))
          ? path.join(modDir, "build.gradle.kts")
          : fs.existsSync(path.join(modDir, "build.gradle"))
          ? path.join(modDir, "build.gradle")
          : null;
      if (!buildGradle) continue;
      const content = fs.readFileSync(buildGradle, "utf-8");
      if (/com\.android\.(application|library)/.test(content)) {
        appModules.push(entry.name);
      }
    }
  }

  // Attempt to detect build variants from app/build.gradle
  const buildVariants: string[] = [];
  if (appModules.length > 0) {
    const ktsGradle = path.join(projectRoot, appModules[0], "build.gradle.kts");
    const groovyGradle = path.join(projectRoot, appModules[0], "build.gradle");
    const primaryBuildGradle = fs.existsSync(ktsGradle)
      ? ktsGradle
      : fs.existsSync(groovyGradle)
      ? groovyGradle
      : null;
    if (primaryBuildGradle) {
      const content = fs.readFileSync(primaryBuildGradle, "utf-8");
      // Extract buildTypes
      const btMatch = content.match(/buildTypes\s*\{([^}]+)\}/s);
      if (btMatch) {
        const btBlock = btMatch[1];
        const types = [...btBlock.matchAll(/^\s{4,8}(\w+)\s*[\{(]/gm)].map((m) => m[1]);
        buildVariants.push(...types.filter((t) => !["getByName", "create"].includes(t)));
      }
      if (buildVariants.length === 0) {
        buildVariants.push("debug", "release");
      }
    }
  }

  return {
    projectRoot,
    hasGradleWrapper: true,
    gradlewPath,
    settingsFile,
    appModules,
    buildVariants: buildVariants.length > 0 ? buildVariants : ["debug", "release"],
  };
}
