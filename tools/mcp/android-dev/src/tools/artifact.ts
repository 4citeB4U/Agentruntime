/**
 * tools/artifact.ts – android.artifact.verify
 *
 * Verifies APK/AAB artifacts using apksigner, aapt2, and bundletool
 * without modifying any files.
 */

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertAllowedPath, loadConfig, resolveAapt2, resolveApkSigner } from "../config.js";
import { runFormatted } from "../runner.js";

export const ArtifactVerifySchema = z.object({
  artifactPath: z
    .string()
    .describe("Absolute path to the .apk or .aab file to verify"),
  projectPath: z
    .string()
    .optional()
    .describe(
      "Absolute path to the project root (used for the allowlist check when projectPath differs from artifact location)"
    ),
});

export async function artifactVerify(input: z.infer<typeof ArtifactVerifySchema>): Promise<string> {
  const cfg = loadConfig();

  // Validate the artifact path against the allowlist
  const checkPath = input.projectPath ?? path.dirname(input.artifactPath);
  assertAllowedPath(checkPath, cfg);

  const artifactPath = path.resolve(input.artifactPath);
  if (!fs.existsSync(artifactPath)) {
    return `Error: artifact not found: ${artifactPath}`;
  }

  const ext = path.extname(artifactPath).toLowerCase();
  const reports: string[] = [`Artifact verification: ${artifactPath}`, ""];

  // ── APK verification (apksigner + aapt2) ─────────────────────────────────
  if (ext === ".apk") {
    const apkSigner = resolveApkSigner(cfg);
    reports.push("=== apksigner verify ===");
    reports.push(
      await runFormatted(apkSigner, ["verify", "--verbose", artifactPath], {
        timeoutMs: cfg.defaultTimeoutMs,
      })
    );

    const aapt2 = resolveAapt2(cfg);
    reports.push("=== aapt2 dump badging ===");
    reports.push(
      await runFormatted(aapt2, ["dump", "badging", artifactPath], {
        timeoutMs: cfg.defaultTimeoutMs,
      })
    );
  }

  // ── AAB verification (bundletool) ─────────────────────────────────────────
  if (ext === ".aab") {
    if (!cfg.bundletoolJar) {
      reports.push(
        "⚠ bundletoolJar not configured in android-mcp.config.json – skipping AAB validation.\n" +
          "  Download bundletool from https://github.com/google/bundletool/releases and set the bundletoolJar path."
      );
    } else {
      const java = cfg.javaHome
        ? path.join(cfg.javaHome, "bin", "java.exe")
        : "java";
      reports.push("=== bundletool validate ===");
      reports.push(
        await runFormatted(
          java,
          ["-jar", cfg.bundletoolJar, "validate", "--bundle", artifactPath],
          { timeoutMs: cfg.defaultTimeoutMs }
        )
      );
    }
  }

  if (ext !== ".apk" && ext !== ".aab") {
    reports.push(`Unsupported artifact extension "${ext}". Expected .apk or .aab.`);
  }

  return reports.join("\n");
}
