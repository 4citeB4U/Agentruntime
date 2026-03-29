import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { AndroidMcpConfig } from "../config.js";
import { run, formatResult } from "../runner.js";

// ── List tasks ────────────────────────────────────────────────────────────────

export const listTasksSchema = z.object({
  projectDir: z.string().describe("Absolute path to the Android project root"),
  module: z
    .string()
    .optional()
    .describe("Optional Gradle module name (e.g. 'app'). Defaults to root."),
  filter: z
    .string()
    .optional()
    .describe("Optional filter string to search task names"),
});

export type ListTasksInput = z.infer<typeof listTasksSchema>;

export async function listGradleTasks(
  input: ListTasksInput,
  config: AndroidMcpConfig
): Promise<string> {
  const root = path.resolve(input.projectDir);
  const gradlew = resolveGradlew(root, config);

  const args = ["tasks", "--all"];
  if (input.module) args.unshift(`:${input.module}:`);

  const result = await run(gradlew, args, config, {
    cwd: root,
    timeoutMs: 120_000,
  });

  let output = formatResult(result);
  if (input.filter) {
    const filterLower = input.filter.toLowerCase();
    const lines = output.split("\n");
    const filtered = lines.filter(
      (l) =>
        l.toLowerCase().includes(filterLower) ||
        l.startsWith("-") ||
        l.trim() === ""
    );
    output = filtered.join("\n");
  }
  return output;
}

// ── Run task ──────────────────────────────────────────────────────────────────

export const runTaskSchema = z.object({
  projectDir: z.string().describe("Absolute path to the Android project root"),
  task: z
    .string()
    .describe(
      "Gradle task to run (e.g. ':app:assembleDebug', 'clean', 'test')"
    ),
  args: z
    .array(z.string())
    .optional()
    .describe("Additional arguments to pass to Gradle (e.g. ['--info'])"),
});

export type RunTaskInput = z.infer<typeof runTaskSchema>;

export async function runGradleTask(
  input: RunTaskInput,
  config: AndroidMcpConfig
): Promise<string> {
  const root = path.resolve(input.projectDir);
  const gradlew = resolveGradlew(root, config);

  const args = [input.task, ...(input.args ?? [])];
  const result = await run(gradlew, args, config, { cwd: root });
  return formatResult(result);
}

// ── Build APK ─────────────────────────────────────────────────────────────────

export const buildApkSchema = z.object({
  projectDir: z.string().describe("Absolute path to the Android project root"),
  module: z.string().default("app").describe("Gradle module (default: 'app')"),
  variant: z
    .string()
    .default("debug")
    .describe("Build variant (default: 'debug')"),
});

export type BuildApkInput = z.infer<typeof buildApkSchema>;

export async function buildApk(
  input: BuildApkInput,
  config: AndroidMcpConfig
): Promise<string> {
  const root = path.resolve(input.projectDir);
  const gradlew = resolveGradlew(root, config);
  const variantCapitalized =
    input.variant.charAt(0).toUpperCase() + input.variant.slice(1);
  const task = `:${input.module}:assemble${variantCapitalized}`;

  const result = await run(gradlew, [task], config, { cwd: root });
  const formatted = formatResult(result);

  if (result.exitCode === 0) {
    const apkDir = path.join(
      root,
      input.module,
      "build",
      "outputs",
      "apk",
      input.variant
    );
    const apks = fs.existsSync(apkDir)
      ? fs.readdirSync(apkDir).filter((f) => f.endsWith(".apk"))
      : [];
    const apkList =
      apks.length > 0
        ? `\n\nOutput APKs in ${apkDir}:\n` + apks.map((a) => `  ${a}`).join("\n")
        : "";
    return formatted + apkList;
  }
  return formatted;
}

// ── Build AAB ─────────────────────────────────────────────────────────────────

export const buildAabSchema = z.object({
  projectDir: z.string().describe("Absolute path to the Android project root"),
  module: z.string().default("app").describe("Gradle module (default: 'app')"),
  variant: z
    .string()
    .default("release")
    .describe("Build variant (default: 'release')"),
});

export type BuildAabInput = z.infer<typeof buildAabSchema>;

export async function buildAab(
  input: BuildAabInput,
  config: AndroidMcpConfig
): Promise<string> {
  const root = path.resolve(input.projectDir);
  const gradlew = resolveGradlew(root, config);
  const variantCapitalized =
    input.variant.charAt(0).toUpperCase() + input.variant.slice(1);
  const task = `:${input.module}:bundle${variantCapitalized}`;

  const result = await run(gradlew, [task], config, { cwd: root });
  const formatted = formatResult(result);

  if (result.exitCode === 0) {
    const aabDir = path.join(
      root,
      input.module,
      "build",
      "outputs",
      "bundle",
      input.variant
    );
    const aabs = fs.existsSync(aabDir)
      ? fs.readdirSync(aabDir).filter((f) => f.endsWith(".aab"))
      : [];
    const aabList =
      aabs.length > 0
        ? `\n\nOutput AABs in ${aabDir}:\n` + aabs.map((a) => `  ${a}`).join("\n")
        : "";
    return formatted + aabList;
  }
  return formatted;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function resolveGradlew(root: string, config: AndroidMcpConfig): string {
  // Prefer config.gradlew if it's an absolute path
  if (path.isAbsolute(config.gradlew) && fs.existsSync(config.gradlew)) {
    return config.gradlew;
  }
  // Relative: resolve against project root
  const unix = path.join(root, "gradlew");
  const win = path.join(root, "gradlew.bat");
  if (fs.existsSync(unix)) return unix;
  if (fs.existsSync(win)) return win;
  // Fall back to the config value (e.g. system 'gradle')
  return config.gradlew;
}
