/**
 * Tool: test.instrumentation.run
 * Runs Android instrumentation tests via adb.
 */
import path from "path";
import os from "os";
import { McpConfig, assertAllowedDir } from "../config";
import { run, RunResult } from "../runner";

function adbPath(config: McpConfig): string {
  return path.join(
    config.androidSdkRoot,
    "platform-tools",
    os.platform() === "win32" ? "adb.exe" : "adb"
  );
}

export interface InstrumentationOptions {
  /** e.g. "com.example.app" */
  packageName: string;
  /** e.g. "com.example.app.test" */
  testPackageName: string;
  /** e.g. "androidx.test.runner.AndroidJUnitRunner" */
  runner: string;
  /** Optional specific test class/method: "com.example.MyTest#testFoo" */
  testClass?: string;
  /** Extra -e key value pairs */
  extras?: Record<string, string>;
  deviceSerial?: string;
}

export async function runInstrumentationTests(
  workDir: string,
  opts: InstrumentationOptions,
  config: McpConfig
): Promise<RunResult> {
  const cwd = assertAllowedDir(workDir, config);
  const adb = adbPath(config);

  const instrumentationTarget = `${opts.testPackageName}/${opts.runner}`;
  const args: string[] = [];

  if (opts.deviceSerial) {
    args.push("-s", opts.deviceSerial);
  }

  args.push("shell", "am", "instrument", "-w", "-r");

  if (opts.testClass) {
    args.push("-e", "class", opts.testClass);
  }

  if (opts.extras) {
    for (const [k, v] of Object.entries(opts.extras)) {
      args.push("-e", k, v);
    }
  }

  args.push(instrumentationTarget);

  return run(adb, args, {
    cwd,
    androidSdkRoot: config.androidSdkRoot,
    javaHome: config.javaHome,
    timeoutMs: 600_000, // 10 min for test suites
  });
}
