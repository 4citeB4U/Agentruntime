import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { AndroidMcpConfig } from "../config.js";
import { run, formatResult } from "../runner.js";

export const detectProjectSchema = z.object({
  projectDir: z
    .string()
    .describe(
      "Absolute path to the Android project root (must contain settings.gradle or settings.gradle.kts)"
    ),
});

export type DetectProjectInput = z.infer<typeof detectProjectSchema>;

interface ModuleInfo {
  name: string;
  path: string;
  hasBuildGradle: boolean;
  isApplication: boolean;
}

function findModules(root: string): ModuleInfo[] {
  const modules: ModuleInfo[] = [];
  try {
    const settingsFile =
      fs.existsSync(path.join(root, "settings.gradle.kts"))
        ? fs.readFileSync(path.join(root, "settings.gradle.kts"), "utf-8")
        : fs.existsSync(path.join(root, "settings.gradle"))
        ? fs.readFileSync(path.join(root, "settings.gradle"), "utf-8")
        : "";

    const includePattern = /include\s*\(?['":]+([^'")\s]+)/g;
    let m: RegExpExecArray | null;
    while ((m = includePattern.exec(settingsFile)) !== null) {
      const modName = m[1].replace(/^:/, "");
      const modPath = path.join(root, ...modName.split(":"));
      const buildFile =
        fs.existsSync(path.join(modPath, "build.gradle.kts")) ||
        fs.existsSync(path.join(modPath, "build.gradle"));

      let isApplication = false;
      for (const bf of [
        path.join(modPath, "build.gradle.kts"),
        path.join(modPath, "build.gradle"),
      ]) {
        if (fs.existsSync(bf)) {
          const content = fs.readFileSync(bf, "utf-8");
          isApplication =
            content.includes("com.android.application") &&
            !content.includes("com.android.application.") &&
            (content.includes("apply plugin") ||
              content.includes("id(") ||
              content.includes("id '") ||
              content.includes('id "'));
          break;
        }
      }

      modules.push({
        name: modName,
        path: modPath,
        hasBuildGradle: buildFile,
        isApplication,
      });
    }
  } catch {
    // Ignore parse failures; caller gets partial results
  }
  return modules;
}

function detectBuildVariants(root: string): string[] {
  const variants: string[] = [];
  try {
    for (const bf of [
      path.join(root, "app", "build.gradle.kts"),
      path.join(root, "app", "build.gradle"),
    ]) {
      if (!fs.existsSync(bf)) continue;
      const content = fs.readFileSync(bf, "utf-8");
      const flavorPattern = /productFlavors\s*\{([^}]+)\}/s;
      const fm = flavorPattern.exec(content);
      if (fm) {
        const names = [...fm[1].matchAll(/^\s+(\w+)\s*\{/gm)].map(
          (x) => x[1]
        );
        variants.push(...names);
      }
      break;
    }
  } catch {
    // Ignore
  }
  return variants;
}

export async function detectProject(
  input: DetectProjectInput,
  config: AndroidMcpConfig
): Promise<string> {
  const root = path.resolve(input.projectDir);

  if (!fs.existsSync(root)) {
    return `Error: directory not found: ${root}`;
  }

  const hasSettings =
    fs.existsSync(path.join(root, "settings.gradle")) ||
    fs.existsSync(path.join(root, "settings.gradle.kts"));

  if (!hasSettings) {
    return `Error: no settings.gradle[.kts] found in ${root}. Is this an Android project root?`;
  }

  const modules = findModules(root);
  const flavors = detectBuildVariants(root);

  // Detect Gradle version
  const gradlePropPath = path.join(root, "gradle", "wrapper", "gradle-wrapper.properties");
  let gradleVersion = "unknown";
  if (fs.existsSync(gradlePropPath)) {
    const content = fs.readFileSync(gradlePropPath, "utf-8");
    const vm = /gradle-([0-9.]+)-/.exec(content);
    if (vm) gradleVersion = vm[1];
  }

  // Detect local.properties (SDK path)
  const localProps = path.join(root, "local.properties");
  let sdkInLocalProps = "";
  if (fs.existsSync(localProps)) {
    const content = fs.readFileSync(localProps, "utf-8");
    const sm = /sdk\.dir\s*=\s*(.+)/.exec(content);
    if (sm) sdkInLocalProps = sm[1].trim();
  }

  const result: string[] = [
    `✅ Android project detected at: ${root}`,
    `Gradle version: ${gradleVersion}`,
    `SDK path (local.properties): ${sdkInLocalProps || "not set"}`,
    ``,
    `Modules (${modules.length}):`,
    ...modules.map(
      (m) =>
        `  • :${m.name} ${m.isApplication ? "[app]" : "[lib]"} — ${m.path}`
    ),
  ];

  if (flavors.length > 0) {
    result.push(``, `Product flavors: ${flavors.join(", ")}`);
  }

  // Check for gradlew
  const gradlew = path.join(root, "gradlew");
  const gradlewBat = path.join(root, "gradlew.bat");
  result.push(
    ``,
    `gradlew present: ${
      fs.existsSync(gradlew) || fs.existsSync(gradlewBat) ? "yes" : "no"
    }`
  );

  // List top-level .gradle or .kts config files
  const configFiles = fs
    .readdirSync(root)
    .filter((f) => f.endsWith(".gradle") || f.endsWith(".gradle.kts") || f === "gradle.properties")
    .slice(0, 10);
  if (configFiles.length > 0) {
    result.push(`Build files: ${configFiles.join(", ")}`);
  }

  // Run ./gradlew projects to get a proper module listing if gradlew exists
  if (fs.existsSync(gradlew) || fs.existsSync(gradlewBat)) {
    const gwResult = await run(
      fs.existsSync(gradlew) ? gradlew : gradlewBat,
      ["projects", "--quiet"],
      config,
      { cwd: root, timeoutMs: 60_000 }
    );
    if (gwResult.exitCode === 0 && gwResult.stdout.trim()) {
      result.push(``, `Gradle projects output:`, gwResult.stdout.trim());
    }
  }

  return result.join("\n");
}
