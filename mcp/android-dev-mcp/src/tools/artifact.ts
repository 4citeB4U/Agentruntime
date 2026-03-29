import { z } from "zod";
import { AndroidMcpConfig } from "../config.js";
import { run, formatResult } from "../runner.js";

// ── Sign artifact ─────────────────────────────────────────────────────────────

export const signArtifactSchema = z.object({
  artifactPath: z
    .string()
    .describe("Absolute path to the APK or AAB to sign"),
  outputPath: z
    .string()
    .optional()
    .describe(
      "Optional output path. If omitted the artifact is signed in-place (apksigner default for APKs)."
    ),
  keystorePath: z
    .string()
    .optional()
    .describe("Override the keystore path from config"),
  keystoreAlias: z
    .string()
    .optional()
    .describe("Override the keystore alias from config"),
});

export type SignArtifactInput = z.infer<typeof signArtifactSchema>;

export async function signArtifact(
  input: SignArtifactInput,
  config: AndroidMcpConfig
): Promise<string> {
  const apksigner = config.apksigner || "apksigner";
  const keystorePath = input.keystorePath ?? config.keystore.path;
  const keystoreAlias = input.keystoreAlias ?? config.keystore.alias;

  if (!keystorePath) {
    return "Error: keystore path is not configured. Set it in the config file or pass keystorePath.";
  }

  const storePass =
    process.env[config.keystore.storePasswordEnv] ?? "";
  const keyPass =
    process.env[config.keystore.keyPasswordEnv] ?? storePass;

  if (!storePass) {
    return `Error: store password not found. Set env var: ${config.keystore.storePasswordEnv}`;
  }

  const args = [
    "sign",
    "--ks",
    keystorePath,
    "--ks-key-alias",
    keystoreAlias,
    "--ks-pass",
    `pass:${storePass}`,
    "--key-pass",
    `pass:${keyPass}`,
  ];

  if (input.outputPath) {
    args.push("--out", input.outputPath);
  }

  args.push(input.artifactPath);

  const result = await run(apksigner, args, config);
  return formatResult(result);
}

// ── Verify artifact ───────────────────────────────────────────────────────────

export const verifyArtifactSchema = z.object({
  artifactPath: z
    .string()
    .describe("Absolute path to the APK or AAB to verify"),
  verbose: z
    .boolean()
    .optional()
    .default(false)
    .describe("Show detailed certificate information"),
});

export type VerifyArtifactInput = z.infer<typeof verifyArtifactSchema>;

export async function verifyArtifact(
  input: VerifyArtifactInput,
  config: AndroidMcpConfig
): Promise<string> {
  const apksigner = config.apksigner || "apksigner";

  const args = ["verify", "--print-certs"];
  if (input.verbose) args.push("--verbose");
  args.push(input.artifactPath);

  const result = await run(apksigner, args, config);
  return formatResult(result);
}
