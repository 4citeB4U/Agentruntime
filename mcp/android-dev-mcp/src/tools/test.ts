import { z } from "zod";
import { AndroidMcpConfig } from "../config.js";
import { run, formatResult } from "../runner.js";

// ── Instrumentation test run ──────────────────────────────────────────────────

export const instrumentationTestSchema = z.object({
  deviceId: z
    .string()
    .optional()
    .describe("Target device serial (from 'adb devices'). Uses default if omitted."),
  packageName: z
    .string()
    .describe(
      "Test package name (e.g. 'com.example.app.test'). Combined with testRunner to form the instrumentation component: packageName/testRunner."
    ),
  testRunner: z
    .string()
    .default("androidx.test.runner.AndroidJUnitRunner")
    .describe("Instrumentation test runner class"),
  testClass: z
    .string()
    .optional()
    .describe("Specific test class to run (e.g. 'com.example.app.ExampleTest')"),
  testMethod: z
    .string()
    .optional()
    .describe("Specific test method to run (e.g. 'testLogin'). Requires testClass."),
  extraArgs: z
    .record(z.string())
    .optional()
    .describe("Extra key=value arguments to pass to am instrument"),
});

export type InstrumentationTestInput = z.infer<typeof instrumentationTestSchema>;

export async function runInstrumentationTests(
  input: InstrumentationTestInput,
  config: AndroidMcpConfig
): Promise<string> {
  const adb = config.adb || "adb";
  const args: string[] = [];

  if (input.deviceId) args.push("-s", input.deviceId);

  const component = `${input.packageName}/${input.testRunner}`;
  args.push("shell", "am", "instrument", "-w");

  if (input.testClass) {
    const specifier = input.testMethod
      ? `${input.testClass}#${input.testMethod}`
      : input.testClass;
    args.push("-e", "class", specifier);
  }

  if (input.extraArgs) {
    for (const [key, value] of Object.entries(input.extraArgs)) {
      args.push("-e", key, value);
    }
  }

  args.push(component);

  const result = await run(adb, args, config, {
    timeoutMs: config.commandTimeoutMs,
  });
  return formatResult(result);
}

// ── Maestro flow (optional) ───────────────────────────────────────────────────

export const maestroTestSchema = z.object({
  flowPath: z
    .string()
    .describe("Absolute path to the Maestro .yaml flow file to run"),
  deviceId: z.string().optional().describe("Target device serial"),
});

export type MaestroTestInput = z.infer<typeof maestroTestSchema>;

export async function runMaestroFlow(
  input: MaestroTestInput,
  config: AndroidMcpConfig
): Promise<string> {
  const maestro = config.maestro || "maestro";

  const args = ["test", input.flowPath];
  if (input.deviceId) args.push("--device", input.deviceId);

  const result = await run(maestro, args, config);
  return formatResult(result);
}
