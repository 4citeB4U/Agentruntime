/**
 * Unit tests for command argument building in gradle tools.
 * These are pure unit tests — no child processes are spawned.
 */

import type { AndroidMcpConfig } from "../src/config.js";

function makeConfig(overrides: Partial<AndroidMcpConfig> = {}): AndroidMcpConfig {
  return {
    androidSdk: "/sdk",
    javaHome: "/java",
    adb: "adb",
    gradlew: "./gradlew",
    bundletool: "",
    apksigner: "apksigner",
    aapt2: "aapt2",
    emulator: "",
    avdmanager: "",
    maestro: "",
    fastlane: "",
    keystore: {
      path: "/keys/release.jks",
      alias: "release",
      storePasswordEnv: "KS_STORE",
      keyPasswordEnv: "KS_KEY",
    },
    workingDirectories: [],
    commandTimeoutMs: 30_000,
    logcatMaxLines: 100,
    allowExternalNetworkCalls: false,
    ...overrides,
  };
}

// ── Gradle task name derivation ───────────────────────────────────────────────

function assembleTaskName(module: string, variant: string): string {
  const v = variant.charAt(0).toUpperCase() + variant.slice(1);
  return `:${module}:assemble${v}`;
}

function bundleTaskName(module: string, variant: string): string {
  const v = variant.charAt(0).toUpperCase() + variant.slice(1);
  return `:${module}:bundle${v}`;
}

describe("Gradle task name derivation", () => {
  test("assembleDebug task for app module", () => {
    expect(assembleTaskName("app", "debug")).toBe(":app:assembleDebug");
  });

  test("assembleRelease task for app module", () => {
    expect(assembleTaskName("app", "release")).toBe(":app:assembleRelease");
  });

  test("assemble task for custom module and variant", () => {
    expect(assembleTaskName("feature_login", "staging")).toBe(
      ":feature_login:assembleStaging"
    );
  });

  test("bundleRelease task for app module", () => {
    expect(bundleTaskName("app", "release")).toBe(":app:bundleRelease");
  });

  test("bundleDebug task for library module", () => {
    expect(bundleTaskName("lib_core", "debug")).toBe(":lib_core:bundleDebug");
  });
});

// ── ADB argument building ─────────────────────────────────────────────────────

function buildAdbInstallArgs(
  apkPath: string,
  deviceId?: string,
  reinstall = false,
  grantPermissions = true
): string[] {
  const args: string[] = [];
  if (deviceId) args.push("-s", deviceId);
  args.push("install");
  if (reinstall) args.push("-r");
  if (grantPermissions) args.push("-g");
  args.push(apkPath);
  return args;
}

describe("ADB install argument building", () => {
  test("basic install without device id", () => {
    const args = buildAdbInstallArgs("/path/to/app.apk");
    expect(args).toEqual(["install", "-g", "/path/to/app.apk"]);
  });

  test("install with device serial", () => {
    const args = buildAdbInstallArgs(
      "/path/to/app.apk",
      "emulator-5554"
    );
    expect(args).toEqual([
      "-s",
      "emulator-5554",
      "install",
      "-g",
      "/path/to/app.apk",
    ]);
  });

  test("reinstall keeps -r flag", () => {
    const args = buildAdbInstallArgs(
      "/path/to/app.apk",
      undefined,
      true
    );
    expect(args).toContain("-r");
  });

  test("no grant flag when grantPermissions=false", () => {
    const args = buildAdbInstallArgs(
      "/path/to/app.apk",
      undefined,
      false,
      false
    );
    expect(args).not.toContain("-g");
  });
});

// ── Logcat argument building ──────────────────────────────────────────────────

function buildLogcatArgs(
  deviceId?: string,
  dumpAndExit = true,
  filter?: string,
  pid?: number
): string[] {
  const args: string[] = [];
  if (deviceId) args.push("-s", deviceId);
  args.push("logcat");
  if (dumpAndExit) args.push("-d");
  if (pid !== undefined) args.push("--pid", String(pid));
  if (filter) args.push(...filter.split(" ").filter(Boolean));
  return args;
}

describe("ADB logcat argument building", () => {
  test("dump and exit is default", () => {
    const args = buildLogcatArgs();
    expect(args).toContain("-d");
  });

  test("streaming mode omits -d", () => {
    const args = buildLogcatArgs(undefined, false);
    expect(args).not.toContain("-d");
  });

  test("filter is split and appended", () => {
    const args = buildLogcatArgs(undefined, true, "MyTag:D *:S");
    expect(args).toContain("MyTag:D");
    expect(args).toContain("*:S");
  });

  test("pid filter is included when provided", () => {
    const args = buildLogcatArgs(undefined, true, undefined, 1234);
    expect(args).toContain("--pid");
    expect(args).toContain("1234");
  });

  test("device serial is first argument pair", () => {
    const args = buildLogcatArgs("emulator-5554");
    expect(args[0]).toBe("-s");
    expect(args[1]).toBe("emulator-5554");
  });
});

// ── Instrumentation test argument building ────────────────────────────────────

function buildInstrumentArgs(
  packageName: string,
  testRunner: string,
  testClass?: string,
  testMethod?: string,
  deviceId?: string
): string[] {
  const args: string[] = [];
  if (deviceId) args.push("-s", deviceId);
  const component = `${packageName}/${testRunner}`;
  args.push("shell", "am", "instrument", "-w");
  if (testClass) {
    const specifier = testMethod
      ? `${testClass}#${testMethod}`
      : testClass;
    args.push("-e", "class", specifier);
  }
  args.push(component);
  return args;
}

describe("Instrumentation test argument building", () => {
  const PKG = "com.example.app.test";
  const RUNNER = "androidx.test.runner.AndroidJUnitRunner";

  test("full component is packageName/runner", () => {
    const args = buildInstrumentArgs(PKG, RUNNER);
    expect(args[args.length - 1]).toBe(`${PKG}/${RUNNER}`);
  });

  test("class filter is added with -e class", () => {
    const args = buildInstrumentArgs(PKG, RUNNER, "com.example.app.LoginTest");
    expect(args).toContain("-e");
    expect(args).toContain("class");
    expect(args).toContain("com.example.app.LoginTest");
  });

  test("method specifier uses # separator", () => {
    const args = buildInstrumentArgs(
      PKG,
      RUNNER,
      "com.example.app.LoginTest",
      "testLogin"
    );
    expect(args).toContain("com.example.app.LoginTest#testLogin");
  });

  test("no -e class when testClass is undefined", () => {
    const args = buildInstrumentArgs(PKG, RUNNER);
    expect(args).not.toContain("class");
  });
});

// ── Secret redaction ──────────────────────────────────────────────────────────

import { redactSecrets } from "../src/config.js";

describe("redactSecrets", () => {
  const config = makeConfig();

  test("redacts store password from output", () => {
    process.env["KS_STORE"] = "supersecret123";
    const output = "Signed with pass:supersecret123 ok";
    const redacted = redactSecrets(output, config);
    expect(redacted).not.toContain("supersecret123");
    expect(redacted).toContain("[REDACTED]");
    delete process.env["KS_STORE"];
  });

  test("does not redact when env var is not set", () => {
    delete process.env["KS_STORE"];
    const output = "normal output";
    const redacted = redactSecrets(output, config);
    expect(redacted).toBe("normal output");
  });

  test("does not redact short secrets (< 4 chars)", () => {
    process.env["KS_STORE"] = "abc";
    const output = "Signed with pass:abc ok";
    const redacted = redactSecrets(output, config);
    expect(redacted).toBe("Signed with pass:abc ok");
    delete process.env["KS_STORE"];
  });
});
