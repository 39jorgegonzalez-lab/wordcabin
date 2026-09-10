import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
    fileURLToPath,
} from "node:url";

import config from "./config.js";

import {
    buildCandidate,
    CANDIDATE_OUTPUT_ROOT,
    CANDIDATE_REPORT_ROOT,
} from "./build-candidate.js";

const DICTIONARY_DIRECTORY =
    path.dirname(
        fileURLToPath(import.meta.url)
    );

const REPOSITORY_ROOT =
    path.resolve(
        DICTIONARY_DIRECTORY,
        "..",
        ".."
    );

const FIXTURE_ROOT =
    path.join(
        DICTIONARY_DIRECTORY,
        "fixtures",
        "candidate"
    );

const FIXTURE_MANIFEST_PATH =
    path.join(
        FIXTURE_ROOT,
        "manifest.json"
    );

const FIXTURE_SOURCE_PATH =
    path.join(
        FIXTURE_ROOT,
        "source.txt"
    );

const PRODUCTION_DICTIONARY_PATH =
    path.join(
        REPOSITORY_ROOT,
        "src",
        "data",
        "words.js"
    );

const EXPECTED_PRODUCTION_HASH =
    "CB9BE5D9EAE5C7427B134A1A90C3C9867A245D1F03DCC97F93C997E0E74B734B";

function sha256File(filePath) {
    return crypto
        .createHash("sha256")
        .update(
            fs.readFileSync(filePath)
        )
        .digest("hex")
        .toUpperCase();
}

function readJson(filePath) {
    return JSON.parse(
        fs.readFileSync(
            filePath,
            "utf8"
        )
    );
}

function writeJson(filePath, value) {
    fs.writeFileSync(
        filePath,
        `${JSON.stringify(value, null, 2)}\n`,
        "utf8"
    );
}

const tempRoot =
    fs.mkdtempSync(
        path.join(
            os.tmpdir(),
            "wordcabin-build-candidate-"
        )
    );

const originalDictionarySources =
    config.dictionarySources;

const successBuildId =
    `candidate-pipeline-success-${process.pid}`;

const unauthorizedBuildId =
    `candidate-pipeline-unauthorized-${process.pid}`;

const badChecksumBuildId =
    `candidate-pipeline-bad-checksum-${process.pid}`;

const pathEscapeBuildId =
    `candidate-pipeline-path-escape-${process.pid}`;

const buildIds = [
    successBuildId,
    unauthorizedBuildId,
    badChecksumBuildId,
    pathEscapeBuildId,
];

function removeCandidateBuild(buildId) {
    fs.rmSync(
        path.join(
            CANDIDATE_OUTPUT_ROOT,
            buildId
        ),
        {
            recursive: true,
            force: true,
        }
    );

    fs.rmSync(
        path.join(
            CANDIDATE_REPORT_ROOT,
            buildId
        ),
        {
            recursive: true,
            force: true,
        }
    );
}

try {
    // ---------------------------------------------------------
    // Fixture preconditions
    // ---------------------------------------------------------

    assert.equal(
        fs.existsSync(
            FIXTURE_MANIFEST_PATH
        ),
        true
    );

    assert.equal(
        fs.existsSync(
            FIXTURE_SOURCE_PATH
        ),
        true
    );

    const fixtureManifest =
        readJson(
            FIXTURE_MANIFEST_PATH
        );

    assert.equal(
        fixtureManifest.status,
        "candidate"
    );

    assert.deepEqual(
        fixtureManifest.permittedUses,
        [
            "internal-analysis",
        ]
    );

    console.log(
        "PASS: candidate build fixture loaded"
    );

    // ---------------------------------------------------------
    // Production dictionary baseline
    // ---------------------------------------------------------

    const productionHashBefore =
        sha256File(
            PRODUCTION_DICTIONARY_PATH
        );

    assert.equal(
        productionHashBefore,
        EXPECTED_PRODUCTION_HASH
    );

    console.log(
        "PASS: production dictionary baseline verified"
    );

    // ---------------------------------------------------------
    // Successful end-to-end candidate build
    // ---------------------------------------------------------

    config.dictionarySources =
        FIXTURE_ROOT;

    const result =
        await buildCandidate({
            manifestPath:
                FIXTURE_MANIFEST_PATH,
            artifactId:
                "primary",
            buildId:
                successBuildId,
            requestedUse:
                "internal-analysis",
            profile:
                null,
        });

    assert.equal(
        result.buildId,
        successBuildId
    );

    assert.equal(
        result.sourceId,
        "candidate-pipeline-fixture"
    );

    assert.equal(
        result.artifactId,
        "primary"
    );

    assert.equal(
        result.candidateWordCount,
        5
    );

    assert.equal(
        path.dirname(
            result.candidateArtifactPath
        ),
        path.join(
            CANDIDATE_OUTPUT_ROOT,
            successBuildId
        )
    );

    assert.equal(
        result.reportDirectory,
        path.join(
            CANDIDATE_REPORT_ROOT,
            successBuildId
        )
    );

    assert.equal(
        fs.readFileSync(
            result.candidateArtifactPath,
            "utf8"
        ),
        [
            "apple",
            "cat",
            "dog",
            "pear",
            "tea",
            "",
        ].join("\n")
    );

    const expectedReports = [
        "artifact-integrity.json",
        "source-eligibility.json",
        "extraction.json",
        "normalization.json",
        "candidate-qa.json",
        "build-summary.json",
    ];

    for (
        const reportFile
        of expectedReports
    ) {
        assert.equal(
            fs.existsSync(
                path.join(
                    result.reportDirectory,
                    reportFile
                )
            ),
            true,
            `Missing report: ${reportFile}`
        );
    }

    const integrityReport =
    readJson(
        path.join(
            result.reportDirectory,
            "artifact-integrity.json"
        )
    );

const extractionReport =
    readJson(
        path.join(
            result.reportDirectory,
            "extraction.json"
        )
    );

const primaryIntegrityValidation =
    integrityReport
        .artifactValidations
        .find(
            (validation) =>
                validation.artifactId ===
                "primary"
        );

assert.ok(
    primaryIntegrityValidation,
    "Primary artifact integrity validation missing"
);

assert.equal(
    extractionReport.artifactId,
    "primary"
);

assert.equal(
    extractionReport.sizeBytes,
    primaryIntegrityValidation.actualSizeBytes
);

assert.equal(
    extractionReport.sha256.toLowerCase(),
    primaryIntegrityValidation.actualSha256.toLowerCase()
);

assert.equal(
    extractionReport.sizeBytes,
    fs.readFileSync(
        FIXTURE_SOURCE_PATH
    ).length
);

assert.equal(
    extractionReport.sha256,
    sha256File(
        FIXTURE_SOURCE_PATH
    )
);

console.log(
    "PASS: extraction bytes remain bound to validated artifact integrity"
);
    const summary =
        readJson(
            path.join(
                result.reportDirectory,
                "build-summary.json"
            )
        );

    assert.equal(
        summary.buildId,
        successBuildId
    );

    assert.equal(
        summary.sourceStatus,
        "candidate"
    );

    assert.equal(
        summary.requestedUse,
        "internal-analysis"
    );

    assert.equal(
        summary.candidateWordCount,
        5
    );

    console.log(
        "PASS: candidate pipeline builds artifact and reports end-to-end"
    );

    // ---------------------------------------------------------
    // Unauthorized candidate use
    //
    // The builder permits internal-qa as a candidate-pipeline
    // operation, but this fixture manifest authorizes only
    // internal-analysis.
    // ---------------------------------------------------------

    await assert.rejects(
        () =>
            buildCandidate({
                manifestPath:
                    FIXTURE_MANIFEST_PATH,
                artifactId:
                    "primary",
                buildId:
                    unauthorizedBuildId,
                requestedUse:
                    "internal-qa",
                profile:
                    null,
            }),
        (error) => {
            assert.equal(
                error.name,
                "CandidateBuildError"
            );

            assert.equal(
                error.stage,
                "source-eligibility"
            );

            return true;
        }
    );

    assert.equal(
        fs.existsSync(
            path.join(
                CANDIDATE_OUTPUT_ROOT,
                unauthorizedBuildId
            )
        ),
        false
    );

    assert.equal(
        fs.existsSync(
            path.join(
                CANDIDATE_REPORT_ROOT,
                unauthorizedBuildId
            )
        ),
        false
    );

    console.log(
        "PASS: unauthorized candidate use rejected before output"
    );

    // ---------------------------------------------------------
    // Bad checksum
    // ---------------------------------------------------------

    const badChecksumManifest =
        structuredClone(
            fixtureManifest
        );

    badChecksumManifest
        .artifacts[0]
        .sha256 =
        "0".repeat(64);

    const badChecksumManifestPath =
        path.join(
            tempRoot,
            "bad-checksum-manifest.json"
        );

    writeJson(
        badChecksumManifestPath,
        badChecksumManifest
    );

    await assert.rejects(
        () =>
            buildCandidate({
                manifestPath:
                    badChecksumManifestPath,
                artifactId:
                    "primary",
                buildId:
                    badChecksumBuildId,
                requestedUse:
                    "internal-analysis",
                profile:
                    null,
            }),
        (error) => {
            assert.equal(
                error.name,
                "CandidateBuildError"
            );

            assert.equal(
                error.stage,
                "artifact-integrity"
            );

            return true;
        }
    );

    assert.equal(
        fs.existsSync(
            path.join(
                CANDIDATE_OUTPUT_ROOT,
                badChecksumBuildId
            )
        ),
        false
    );

    assert.equal(
        fs.existsSync(
            path.join(
                CANDIDATE_REPORT_ROOT,
                badChecksumBuildId
            )
        ),
        false
    );

    console.log(
        "PASS: bad candidate checksum rejected before output"
    );

    // ---------------------------------------------------------
    // Real-path escape through symlink / junction
    // ---------------------------------------------------------

    const escapeSourceRoot =
        path.join(
            tempRoot,
            "escape-source-root"
        );

    const outsideSourceRoot =
        path.join(
            tempRoot,
            "outside-source-root"
        );

    fs.mkdirSync(
        escapeSourceRoot
    );

    fs.mkdirSync(
        outsideSourceRoot
    );

    const outsideSourcePath =
        path.join(
            outsideSourceRoot,
            "source.txt"
        );

    fs.copyFileSync(
        FIXTURE_SOURCE_PATH,
        outsideSourcePath
    );

    const linkedDirectory =
        path.join(
            escapeSourceRoot,
            "linked"
        );

    fs.symlinkSync(
        outsideSourceRoot,
        linkedDirectory,
        process.platform === "win32"
            ? "junction"
            : "dir"
    );

    const escapeManifest =
        structuredClone(
            fixtureManifest
        );

    escapeManifest
        .artifacts[0]
        .fileName =
        "linked/source.txt";

    const escapeManifestPath =
        path.join(
            tempRoot,
            "path-escape-manifest.json"
        );

    writeJson(
        escapeManifestPath,
        escapeManifest
    );

    config.dictionarySources =
        escapeSourceRoot;

    await assert.rejects(
        () =>
            buildCandidate({
                manifestPath:
                    escapeManifestPath,
                artifactId:
                    "primary",
                buildId:
                    pathEscapeBuildId,
                requestedUse:
                    "internal-analysis",
                profile:
                    null,
            }),
        (error) => {
            assert.equal(
                error.name,
                "CandidateBuildError"
            );

            assert.equal(
                error.stage,
                "artifact-path"
            );

            return true;
        }
    );

    assert.equal(
        fs.existsSync(
            path.join(
                CANDIDATE_OUTPUT_ROOT,
                pathEscapeBuildId
            )
        ),
        false
    );

    assert.equal(
        fs.existsSync(
            path.join(
                CANDIDATE_REPORT_ROOT,
                pathEscapeBuildId
            )
        ),
        false
    );

    console.log(
        "PASS: candidate source real-path escape rejected"
    );

    // ---------------------------------------------------------
    // Production dictionary invariant
    // ---------------------------------------------------------

    const productionHashAfter =
        sha256File(
            PRODUCTION_DICTIONARY_PATH
        );

    assert.equal(
        productionHashAfter,
        productionHashBefore
    );

    assert.equal(
        productionHashAfter,
        EXPECTED_PRODUCTION_HASH
    );

    console.log(
        "PASS: production dictionary unchanged by candidate pipeline tests"
    );

    console.log(
        "=== BUILD_CANDIDATE_TESTS_COMPLETE ==="
    );
} finally {
    config.dictionarySources =
        originalDictionarySources;

    for (
        const buildId
        of buildIds
    ) {
        removeCandidateBuild(
            buildId
        );
    }

    fs.rmSync(
        tempRoot,
        {
            recursive: true,
            force: true,
        }
    );
}