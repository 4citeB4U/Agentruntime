/**
 * Unit tests for the safe command runner (runner.ts).
 */
import { assertCommandAllowed } from "../src/runner";

describe("assertCommandAllowed", () => {
  // ── Explicitly denied executables ──────────────────────────────────────────
  test.each([
    ["git", ["commit", "-m", "msg"]],
    ["git", ["push"]],
    ["rm", ["-rf", "/some/path"]],
    ["del", ["/s", "*.kt"]],
    ["powershell", ["-Command", "rm -r ."]],
    ["bash", ["-c", "echo hi"]],
    ["python", ["script.py"]],
    ["npm", ["install"]],
    ["wget", ["http://evil.com"]],
    ["curl", ["-O", "http://evil.com"]],
  ])("blocks denied executable: %s %s", (exe, args) => {
    expect(() => assertCommandAllowed(exe, args)).toThrow();
  });

  // ── Allowed executables ────────────────────────────────────────────────────
  test.each([
    ["adb", ["devices"]],
    ["adb", ["-s", "emulator-5554", "install", "-r", "app.apk"]],
    ["gradlew", ["assembleDebug", "--no-daemon"]],
    ["gradlew.bat", [":app:lint", "--no-daemon"]],
    ["emulator", ["-avd", "Pixel_6_API_33", "-no-window"]],
    ["apksigner", ["verify", "--verbose", "app.apk"]],
    ["apksigner.bat", ["verify", "app.apk"]],
    ["aapt2", ["dump", "badging", "app.apk"]],
    ["maestro", ["test", "flow.yaml"]],
  ])("allows safe executable: %s %s", (exe, args) => {
    expect(() => assertCommandAllowed(exe, args)).not.toThrow();
  });

  // ── Case-insensitive executable blocking ──────────────────────────────────
  test("blocks GIT (uppercase)", () => {
    expect(() => assertCommandAllowed("GIT", ["push"])).toThrow();
  });

  test("blocks git.exe on Windows-style path", () => {
    expect(() =>
      assertCommandAllowed("C:\\Program Files\\Git\\bin\\git.exe", ["commit"])
    ).toThrow();
  });

  // ── Denied arg patterns ────────────────────────────────────────────────────
  test("blocks adb shell rm", () => {
    expect(() =>
      assertCommandAllowed("adb", ["shell", "rm", "-rf", "/data/data"])
    ).toThrow();
  });

  test("blocks gradlew spotlessApply", () => {
    expect(() =>
      assertCommandAllowed("gradlew", ["spotlessApply"])
    ).toThrow();
  });

  test("blocks gradlew.bat ktlintFormat", () => {
    expect(() =>
      assertCommandAllowed("gradlew.bat", ["ktlintFormat"])
    ).toThrow();
  });

  test("allows adb shell logcat (safe adb shell usage)", () => {
    expect(() =>
      assertCommandAllowed("adb", ["shell", "logcat", "-d", "-t", "100"])
    ).not.toThrow();
  });

  test("allows adb shell am start", () => {
    expect(() =>
      assertCommandAllowed("adb", ["shell", "am", "start", "-n", "com.example/.MainActivity"])
    ).not.toThrow();
  });

  test("allows gradlew assembleDebug", () => {
    expect(() =>
      assertCommandAllowed("gradlew", ["assembleDebug", "--no-daemon"])
    ).not.toThrow();
  });
});
