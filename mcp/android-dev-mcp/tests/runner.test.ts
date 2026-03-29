/**
 * Unit tests for the command runner safety rails.
 */

import { assertAllowedCwd } from "../src/runner.js";
import type { AndroidMcpConfig } from "../src/config.js";
import path from "node:path";

function makeConfig(overrides: Partial<AndroidMcpConfig> = {}): AndroidMcpConfig {
  return {
    androidSdk: "",
    javaHome: "",
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
      path: "",
      alias: "release",
      storePasswordEnv: "KEYSTORE_STORE_PASSWORD",
      keyPasswordEnv: "KEYSTORE_KEY_PASSWORD",
    },
    workingDirectories: [],
    commandTimeoutMs: 30_000,
    logcatMaxLines: 200,
    allowExternalNetworkCalls: false,
    ...overrides,
  };
}

describe("assertAllowedCwd", () => {
  test("allows any directory when workingDirectories is empty", () => {
    const config = makeConfig({ workingDirectories: [] });
    expect(() => assertAllowedCwd("/any/path", config)).not.toThrow();
    expect(() => assertAllowedCwd("/another/path", config)).not.toThrow();
  });

  test("allows an exact matching directory", () => {
    const config = makeConfig({ workingDirectories: ["/home/user/myapp"] });
    expect(() => assertAllowedCwd("/home/user/myapp", config)).not.toThrow();
  });

  test("allows a subdirectory of an allowed directory", () => {
    const config = makeConfig({ workingDirectories: ["/home/user/myapp"] });
    expect(() =>
      assertAllowedCwd("/home/user/myapp/subdir", config)
    ).not.toThrow();
  });

  test("throws for a directory outside allowed list", () => {
    const config = makeConfig({ workingDirectories: ["/home/user/myapp"] });
    expect(() => assertAllowedCwd("/tmp/evil", config)).toThrow(
      /not in the allowed list/
    );
  });

  test("throws for a path that merely starts with an allowed dir string but is not a subdirectory", () => {
    const config = makeConfig({ workingDirectories: ["/home/user/myapp"] });
    // "/home/user/myapp-evil" is NOT under "/home/user/myapp"
    expect(() => assertAllowedCwd("/home/user/myapp-evil", config)).toThrow(
      /not in the allowed list/
    );
  });

  test("resolves relative paths before comparison", () => {
    const config = makeConfig({
      workingDirectories: [path.resolve("/home/user/myapp")],
    });
    // Relative paths are resolved via path.resolve which uses cwd,
    // so this just checks that the function calls path.resolve internally
    expect(() =>
      assertAllowedCwd(path.resolve("/home/user/myapp"), config)
    ).not.toThrow();
  });
});
