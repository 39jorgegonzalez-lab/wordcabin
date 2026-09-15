import { buildCandidate } from "./build-candidate.js";

function optionsFromArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new Error(`Invalid argument near ${String(flag)}.`);
    }
    options[flag.slice(2)] = value;
  }
  return options;
}

try {
  const args = optionsFromArgs(process.argv.slice(2));
  const result = await buildCandidate({
    manifestPath: args.manifest,
    artifactId: args.artifact,
    buildId: args.build,
    requestedUse: args.use || "internal-analysis",
    profile: args.profile || null,
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  if (error.details) console.error(JSON.stringify(error.details, null, 2));
  console.error(
    "Usage: npm run candidate:build -- --manifest <path> --artifact <id> --build <id> [--use internal-analysis] [--profile general-anagram]",
  );
  process.exitCode = 1;
}
