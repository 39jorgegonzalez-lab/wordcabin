import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import config from "./config.js";
import { normalizeWords } from "./normalize.js";
import { validateSourceManifest } from "./source-contract.js";
import { evaluateSourceEligibility } from "./source-eligibility.js";
import { validateSourceArtifact } from "./validate-source-artifact.js";
import { extractSourceFile } from "./extract-source-file.js";
import { runCandidateStructuralQA } from "./candidate-qa.js";

const DICTIONARY_TOOLS_DIRECTORY = path.dirname(
    fileURLToPath(import.meta.url)
);

export const CANDIDATE_OUTPUT_ROOT = path.join(
    DICTIONARY_TOOLS_DIRECTORY,
    "output",
    "candidates"
);

export const CANDIDATE_REPORT_ROOT = path.join(
    DICTIONARY_TOOLS_DIRECTORY,
    "reports",
    "candidates"
);

const CANDIDATE_ALLOWED_USES = new Set([
    "internal-analysis",
    "internal-qa",
]);

const BUILD_ID_PATTERN =
    /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

function fail(stage, message, details = null) {
    const error = new Error(message);

    error.name = "CandidateBuildError";
    error.stage = stage;
    error.details = details;

    throw error;
}

function isPathInside(rootPath, targetPath) {
    const relative = path.relative(rootPath, targetPath);

    return (
        relative !== "" &&
        relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)
    );
}

function assertSafeBuildId(buildId) {
    if (
        typeof buildId !== "string" ||
        !BUILD_ID_PATTERN.test(buildId)
    ) {
        fail(
            "configuration",
            "Candidate build failed: buildId must contain only lowercase letters, digits, and internal hyphens."
        );
    }
}

function readManifest(manifestPath) {
    if (
        typeof manifestPath !== "string" ||
        manifestPath.trim().length === 0
    ) {
        fail(
            "manifest",
            "Candidate build failed: manifestPath is required."
        );
    }

    const resolvedManifestPath = path.resolve(manifestPath);

    let stats;

    try {
        stats = fs.statSync(resolvedManifestPath);
    } catch (error) {
        if (error?.code === "ENOENT") {
            fail(
                "manifest",
                `Candidate build failed: manifest not found at ${resolvedManifestPath}`
            );
        }

        throw error;
    }

    if (!stats.isFile()) {
        fail(
            "manifest",
            `Candidate build failed: manifestPath is not a file: ${resolvedManifestPath}`
        );
    }

    let manifest;

    try {
        const rawManifest = fs
            .readFileSync(resolvedManifestPath, "utf8")
            .replace(/^\uFEFF/, "");

        manifest = JSON.parse(rawManifest);
    } catch (error) {
        fail(
            "manifest",
            `Candidate build failed: manifest could not be parsed as JSON: ${resolvedManifestPath}`,
            {
                message: error instanceof Error
                    ? error.message
                    : String(error),
            }
        );
    }

    return {
        manifest,
        resolvedManifestPath,
    };
}

function validateConfiguredSourceRoot(sourceRoot) {
    if (
        typeof sourceRoot !== "string" ||
        !path.isAbsolute(sourceRoot)
    ) {
        fail(
            "configuration",
            "Candidate build failed: sourceRoot must be an absolute path."
        );
    }

    let stats;

    try {
        stats = fs.statSync(sourceRoot);
    } catch (error) {
        if (error?.code === "ENOENT") {
            fail(
                "configuration",
                `Candidate build failed: sourceRoot does not exist: ${sourceRoot}`
            );
        }

        throw error;
    }

    if (!stats.isDirectory()) {
        fail(
            "configuration",
            `Candidate build failed: sourceRoot is not a directory: ${sourceRoot}`
        );
    }
}

function resolveArtifactPath({
    sourceRoot,
    fileName,
}) {
    const portableFileName = fileName
        .replaceAll("\\", path.sep)
        .replaceAll("/", path.sep);

    const resolvedSourceRoot = path.resolve(sourceRoot);
    const resolvedArtifactPath = path.resolve(
        resolvedSourceRoot,
        portableFileName
    );

    if (
        !isPathInside(
            resolvedSourceRoot,
            resolvedArtifactPath
        )
    ) {
        fail(
            "artifact-path",
            `Candidate build failed: artifact path escapes configured source root: ${fileName}`
        );
    }

    /*
     * Lexical containment is insufficient when a path inside sourceRoot
     * contains a symlink pointing outside sourceRoot.
     *
     * If the artifact exists, compare its real path against the real
     * configured source root before any parsing occurs.
     */
    if (fs.existsSync(resolvedArtifactPath)) {
        const realSourceRoot =
            fs.realpathSync(resolvedSourceRoot);
        const realArtifactPath =
            fs.realpathSync(resolvedArtifactPath);

        if (
            !isPathInside(
                realSourceRoot,
                realArtifactPath
            )
        ) {
            fail(
                "artifact-path",
                `Candidate build failed: artifact resolves outside configured source root: ${fileName}`
            );
        }
    }

    return resolvedArtifactPath;
}

function ensureNoSymlinkComponents({
    baseDirectory,
    targetDirectory,
    stage,
}) {
    const relative = path.relative(
        baseDirectory,
        targetDirectory
    );

    if (
        relative === "" ||
        relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
    ) {
        fail(
            stage,
            "Candidate build failed: output directory is outside the dictionary tools directory."
        );
    }

    let currentPath = baseDirectory;

    for (
        const segment of relative
            .split(path.sep)
            .filter(Boolean)
    ) {
        currentPath = path.join(currentPath, segment);

        /*
         * Missing components are safe at this stage because mkdirSync()
         * may create them later. Existing components must never be links.
         */
        if (!fs.existsSync(currentPath)) {
            break;
        }

        const stats = fs.lstatSync(currentPath);

        if (stats.isSymbolicLink()) {
            fail(
                stage,
                `Candidate build failed: output path contains a symbolic link or junction: ${currentPath}`
            );
        }
    }
}

function prepareCandidateRoot(rootDirectory, stage) {
    /*
     * Check all existing ancestors before mkdirSync() can traverse them.
     */
    ensureNoSymlinkComponents({
        baseDirectory: DICTIONARY_TOOLS_DIRECTORY,
        targetDirectory: rootDirectory,
        stage,
    });

    fs.mkdirSync(rootDirectory, {
        recursive: true,
    });

    /*
     * Re-check after creation and verify the resolved filesystem path
     * still remains beneath the dictionary tools directory.
     */
    ensureNoSymlinkComponents({
        baseDirectory: DICTIONARY_TOOLS_DIRECTORY,
        targetDirectory: rootDirectory,
        stage,
    });

    const realBaseDirectory =
        fs.realpathSync(DICTIONARY_TOOLS_DIRECTORY);

    const realRootDirectory =
        fs.realpathSync(rootDirectory);

    if (
        !isPathInside(
            realBaseDirectory,
            realRootDirectory
        )
    ) {
        fail(
            stage,
            "Candidate build failed: resolved output directory escapes the dictionary tools directory."
        );
    }
}

function writeJson(filePath, value) {
    fs.writeFileSync(
        filePath,
        `${JSON.stringify(value, null, 2)}\n`,
        {
            encoding: "utf8",
            flag: "wx",
        }
    );
}

function createExtractionReport({
    extractionResult,
    artifactId,
}) {
    return {
        artifactId,
        sourceFileName:
            extractionResult.sourceFileName ?? null,
        sizeBytes:
    extractionResult.sizeBytes ?? null,
sha256:
    extractionResult.sha256 ?? null,
wordCount:
            extractionResult.wordCount ?? null,
        sampleWords:
            Array.isArray(extractionResult.sampleWords)
                ? extractionResult.sampleWords
                : [],
    };
}

function createNormalizationReport(normalizedResult) {
    return {
        inputWordCount:
            normalizedResult.inputWordCount,
        acceptedWordCount:
            normalizedResult.acceptedWordCount,
        rejectedWordCount:
            normalizedResult.rejectedWordCount,
        duplicateCount:
            normalizedResult.duplicateCount,
        sampleWords:
            normalizedResult.sampleWords,
        sampleRejectedWords:
            normalizedResult.sampleRejectedWords,
    };
}

export async function buildCandidate({
    manifestPath,
    artifactId,
    buildId,
    requestedUse = "internal-qa",
    profile = null,
    licenseObligationEvidence = [],
} = {}) {
    assertSafeBuildId(buildId);

    const sourceRoot = config.dictionarySources;

    /*
     * Candidate builds are intentionally incapable of requesting
     * runtime-generation, public-runtime, SEO publication, or other
     * production-oriented eligibility.
     */
    if (!CANDIDATE_ALLOWED_USES.has(requestedUse)) {
        fail(
            "configuration",
            `Candidate build failed: requestedUse "${String(
                requestedUse
            )}" is not permitted for the candidate-only pipeline.`
        );
    }

    if (
        typeof artifactId !== "string" ||
        artifactId.trim().length === 0
    ) {
        fail(
            "configuration",
            "Candidate build failed: artifactId is required. No source artifact may be selected implicitly."
        );
    }

    validateConfiguredSourceRoot(sourceRoot);

    // ---------------------------------------------------------
    // Stage 1: manifest loading + schema validation
    // ---------------------------------------------------------

    const {
        manifest,
        resolvedManifestPath,
    } = readManifest(manifestPath);

    const manifestValidation =
        validateSourceManifest(manifest);

    if (!manifestValidation.passed) {
        fail(
            "manifest",
            "Candidate build failed: source manifest validation failed.",
            manifestValidation.errors
        );
    }

    const selectedArtifact =
        manifest.artifacts.find(
            (artifact) =>
                artifact.artifactId === artifactId
        );

    if (!selectedArtifact) {
        fail(
            "artifact-selection",
            `Candidate build failed: artifact "${artifactId}" is not declared by source manifest "${manifest.sourceId}".`
        );
    }

    /*
     * Validate every required artifact plus the explicitly selected
     * extraction artifact. There is no fallback to another artifact.
     */
    const artifactIdsToValidate = new Set(
        manifest.artifacts
            .filter(
                (artifact) =>
                    artifact.required === true
            )
            .map(
                (artifact) =>
                    artifact.artifactId
            )
    );

    artifactIdsToValidate.add(artifactId);

    const artifactPaths = new Map();
    const artifactValidations = [];

    // ---------------------------------------------------------
    // Stage 2: exact artifact resolution + integrity
    // ---------------------------------------------------------

    for (const currentArtifactId of artifactIdsToValidate) {
        const artifact = manifest.artifacts.find(
            (entry) =>
                entry.artifactId === currentArtifactId
        );

        const resolvedPath = resolveArtifactPath({
            sourceRoot,
            fileName: artifact.fileName,
        });

        artifactPaths.set(
            currentArtifactId,
            resolvedPath
        );

        const validation =
            await validateSourceArtifact({
                manifest,
                artifactId: currentArtifactId,
                resolvedPath,
            });

        artifactValidations.push(validation);

        if (
            validation.status !== "passed" ||
            validation.artifactIntegrityPassed !== true
        ) {
            fail(
                "artifact-integrity",
                `Candidate build failed: artifact integrity validation failed for "${currentArtifactId}".`,
                validation
            );
        }
    }

    // ---------------------------------------------------------
    // Stage 3: source eligibility
    // ---------------------------------------------------------

    const eligibilityResult =
        evaluateSourceEligibility({
            manifest,
            artifactValidations,
            requestedUse,
            profile,
            licenseObligationEvidence,
        });

    if (
        eligibilityResult.status !== "passed" ||
        eligibilityResult.eligibleForRequestedUse !== true
    ) {
        fail(
            "source-eligibility",
            "Candidate build failed: source is not eligible for the requested candidate use.",
            eligibilityResult
        );
    }

    // ---------------------------------------------------------
    // Stage 4: explicit extraction
    // ---------------------------------------------------------

    const selectedArtifactPath =
        artifactPaths.get(artifactId);

    const extractionResult =
        await extractSourceFile(
            selectedArtifactPath
        );

    /*
     * Defensive assertion against accidental future fallback behavior.
     * Extraction must report the exact artifact we explicitly supplied.
     */
    if (
        !extractionResult ||
        typeof extractionResult.sourceFile !== "string" ||
        path.resolve(extractionResult.sourceFile) !==
            path.resolve(selectedArtifactPath)
    ) {
        fail(
            "extraction",
            "Candidate build failed: extractor did not return the explicitly selected source artifact."
        );
    }

    const selectedArtifactValidation =
    artifactValidations.find(
        (validation) =>
            validation.artifactId === artifactId
    );

if (!selectedArtifactValidation) {
    fail(
        "artifact-integrity",
        "Candidate build failed: selected artifact has no integrity validation result."
    );
}

const extractedSha256 =
    typeof extractionResult.sha256 === "string"
        ? extractionResult.sha256.toLowerCase()
        : null;

const validatedSha256 =
    typeof selectedArtifactValidation.actualSha256 === "string"
        ? selectedArtifactValidation.actualSha256.toLowerCase()
        : null;

if (
    extractionResult.sizeBytes !==
        selectedArtifactValidation.actualSizeBytes ||
    extractedSha256 !== validatedSha256
) {
    fail(
        "artifact-integrity",
        "Candidate build failed: selected source artifact changed between integrity validation and extraction.",
        {
            validatedSizeBytes:
                selectedArtifactValidation.actualSizeBytes,
            extractedSizeBytes:
                extractionResult.sizeBytes ?? null,
            validatedSha256:
                selectedArtifactValidation.actualSha256 ?? null,
            extractedSha256:
                extractionResult.sha256 ?? null,
        }
    );
}
    // ---------------------------------------------------------
    // Stage 5: normalization
    // ---------------------------------------------------------

    const normalizedResult =
        normalizeWords(extractionResult);

    if (
        !normalizedResult ||
        !Array.isArray(normalizedResult.words)
    ) {
        fail(
            "normalization",
            "Candidate build failed: normalization did not return a words array."
        );
    }

    // ---------------------------------------------------------
    // Stage 6: candidate structural QA
    // ---------------------------------------------------------

    const qaResult =
        await runCandidateStructuralQA(
            normalizedResult
        );

    if (
        !qaResult ||
        qaResult.passed !== true
    ) {
        fail(
            "candidate-qa",
            "Candidate build failed: candidate structural QA did not pass.",
            qaResult ?? null
        );
    }

    // ---------------------------------------------------------
    // Stage 7: candidate-only output
    //
    // Nothing above this point writes any build artifact.
    // Nothing in this module imports or calls generateDictionary().
    // ---------------------------------------------------------

    prepareCandidateRoot(
        CANDIDATE_OUTPUT_ROOT,
        "candidate-output"
    );

    prepareCandidateRoot(
        CANDIDATE_REPORT_ROOT,
        "candidate-report"
    );

    const outputBuildDirectory = path.join(
        CANDIDATE_OUTPUT_ROOT,
        buildId
    );

    const reportBuildDirectory = path.join(
        CANDIDATE_REPORT_ROOT,
        buildId
    );

    /*
     * Never overwrite an existing build. A build ID is immutable once
     * created.
     */
    if (
        fs.existsSync(outputBuildDirectory) ||
        fs.existsSync(reportBuildDirectory)
    ) {
        fail(
            "candidate-output",
            `Candidate build failed: buildId "${buildId}" already exists.`
        );
    }

    let outputDirectoryCreated = false;
    let reportDirectoryCreated = false;

    try {
        fs.mkdirSync(outputBuildDirectory);
        outputDirectoryCreated = true;

        fs.mkdirSync(reportBuildDirectory);
        reportDirectoryCreated = true;

        const candidateArtifactPath = path.join(
            outputBuildDirectory,
            "candidate-words.txt"
        );

        const integrityReportPath = path.join(
            reportBuildDirectory,
            "artifact-integrity.json"
        );

        const eligibilityReportPath = path.join(
            reportBuildDirectory,
            "source-eligibility.json"
        );

        const extractionReportPath = path.join(
            reportBuildDirectory,
            "extraction.json"
        );

        const normalizationReportPath = path.join(
            reportBuildDirectory,
            "normalization.json"
        );

        const qaReportPath = path.join(
            reportBuildDirectory,
            "candidate-qa.json"
        );

        const summaryReportPath = path.join(
            reportBuildDirectory,
            "build-summary.json"
        );

        fs.writeFileSync(
            candidateArtifactPath,
            `${normalizedResult.words.join("\n")}\n`,
            {
                encoding: "utf8",
                flag: "wx",
            }
        );

        writeJson(
            integrityReportPath,
            {
                sourceId: manifest.sourceId,
                artifactValidations,
            }
        );

        writeJson(
            eligibilityReportPath,
            eligibilityResult
        );

        writeJson(
            extractionReportPath,
            createExtractionReport({
                extractionResult,
                artifactId,
            })
        );

        writeJson(
            normalizationReportPath,
            createNormalizationReport(
                normalizedResult
            )
        );

        writeJson(
            qaReportPath,
            qaResult
        );

        const summary = {
            buildId,
            sourceId: manifest.sourceId,
            sourceName: manifest.sourceName,
            sourceVersion: manifest.sourceVersion,
            sourceStatus: manifest.status,
            manifestVersion:
                manifest.manifestVersion,
            manifestFile:
                path.basename(resolvedManifestPath),
            requestedUse,
            profile,
            artifactId,
            transformation:
                manifest.transformation,
            candidateWordCount:
                normalizedResult.words.length,
            candidateArtifact:
                "candidate-words.txt",
            reports: [
                "artifact-integrity.json",
                "source-eligibility.json",
                "extraction.json",
                "normalization.json",
                "candidate-qa.json",
                "build-summary.json",
            ],
        };

        writeJson(
            summaryReportPath,
            summary
        );

        return {
            buildId,
            sourceId: manifest.sourceId,
            artifactId,
            candidateWordCount:
                normalizedResult.words.length,
            candidateArtifactPath,
            reportDirectory:
                reportBuildDirectory,
            summary,
        };
    } catch (error) {
        /*
         * A failed write must not leave a partially completed candidate
         * build that could later be mistaken for a valid build.
         */
        if (outputDirectoryCreated) {
            fs.rmSync(
                outputBuildDirectory,
                {
                    recursive: true,
                    force: true,
                }
            );
        }

        if (reportDirectoryCreated) {
            fs.rmSync(
                reportBuildDirectory,
                {
                    recursive: true,
                    force: true,
                }
            );
        }

        throw error;
    }
}