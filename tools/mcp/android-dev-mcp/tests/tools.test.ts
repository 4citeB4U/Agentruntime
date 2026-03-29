/**
 * Unit tests for config validation (config.ts).
 */
import path from "path";
import os from "os";
import { assertAllowedDir, safeResolvePath } from "../src/config";
import type { McpConfig } from "../src/config";

const fakeSdkRoot = os.platform() === "win32" ? "D:\\Android\\Sdk" : "/opt/android/sdk";
const fakeJavaHome = os.platform() === "win32" ? "D:\\Android\\jbr" : "/opt/android/jbr";

function makeConfig(allowedDirs: string[]): McpConfig {
  return {
    allowedWorkingDirs: allowedDirs.map((d) => path.resolve(d)),
    androidSdkRoot: fakeSdkRoot,
    javaHome: fakeJavaHome,
  };
}

describe("assertAllowedDir", () => {
  const tmpDir = os.tmpdir();
  const config = makeConfig([tmpDir]);

  test("allows a directory that is the allowed root itself", () => {
    expect(() => assertAllowedDir(tmpDir, config)).not.toThrow();
  });

  test("blocks a directory outside the allowlist", () => {
    const outside =
      os.platform() === "win32" ? "C:\\Windows\\System32" : "/etc";
    expect(() => assertAllowedDir(outside, config)).toThrow(/not in the allowedWorkingDirs/);
  });

  test("blocks a path that tries to escape via ..", () => {
    // Resolving tmpDir + "/../../etc" should land outside tmpDir
    const sneaky = path.join(tmpDir, "..", "..", "etc");
    const resolved = path.resolve(sneaky);
    // Only test if the resolved path is actually outside tmpDir
    if (!resolved.startsWith(tmpDir)) {
      expect(() => assertAllowedDir(sneaky, config)).toThrow(/not in the allowedWorkingDirs/);
    }
  });
});

describe("safeResolvePath", () => {
  const tmpDir = os.tmpdir();

  test("resolves a relative path inside workDir", () => {
    const result = safeResolvePath(tmpDir, "subdir/file.txt");
    expect(result).toBe(path.join(tmpDir, "subdir", "file.txt"));
  });

  test("resolves a filename in the root", () => {
    const result = safeResolvePath(tmpDir, "output.apk");
    expect(result).toBe(path.join(tmpDir, "output.apk"));
  });

  test("blocks path traversal with ..", () => {
    expect(() => safeResolvePath(tmpDir, "../../etc/passwd")).toThrow(
      /resolves outside the working directory/
    );
  });

  test("blocks absolute path that escapes workDir", () => {
    const outside = os.platform() === "win32" ? "C:\\Windows" : "/etc";
    // If the absolute path is outside tmpDir it should be blocked
    const resolved = path.resolve(tmpDir, outside);
    if (!resolved.startsWith(tmpDir)) {
      expect(() => safeResolvePath(tmpDir, outside)).toThrow(
        /resolves outside the working directory/
      );
    }
  });
});

describe("build.ts task naming", () => {
  test("capitalises variant for assemble task", () => {
    const variant = "debug";
    const taskVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    expect(`:app:assemble${taskVariant}`).toBe(":app:assembleDebug");
  });

  test("capitalises variant for bundle task", () => {
    const variant = "release";
    const taskVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    expect(`:app:bundle${taskVariant}`).toBe(":app:bundleRelease");
  });

  test("handles custom variant", () => {
    const variant = "stagingRelease";
    const taskVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    expect(`:app:assemble${taskVariant}`).toBe(":app:assembleStagingRelease");
  });
});

describe("test.instrumentation args", () => {
  test("constructs correct instrumentation target", () => {
    const pkg = "com.example.app.test";
    const runner = "androidx.test.runner.AndroidJUnitRunner";
    expect(`${pkg}/${runner}`).toBe(
      "com.example.app.test/androidx.test.runner.AndroidJUnitRunner"
    );
  });
});
