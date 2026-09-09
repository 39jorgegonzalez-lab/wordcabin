import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
    validateSourceManifest,
} from "./source-contract.js";

import {
    validateSourceArtifact,
} from "./validate-source-artifact.js";

function sha256(buffer) {
    return crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex");
}

function createManifest({
    status = "approved",
    sizeBytes,
    sha256Value,
} = {}) {
    return {
        manifestVersion: 1,
        sourceId: "test-lexical-source",
        sourceName: "Test Lexical Source",
        sourceVersion: "1.0.0",
        status,

        roles: ["lexical"],

        evidenceCapabilities: [
            "lexical-existence",
        ],

        claimAuthority: [
            "lexical-validity",
        ],

        acquisition: {
            mode: "manual-download",
            documentedProcedure: "docs/sources/test-source.md",
            credentialReference: null,
        },

        artifacts: [
            {
                artifactId: "primary",
                fileName: "source.txt",
                required: true,
                sha256: sha256Value,
                sizeBytes,
            },
        ],

        license: {
            status: "verified",
            identifier: "TEST-LICENSE",
            reference: "docs/licenses/test-source.md",
            commercialUse: "allowed",
            transformation: "allowed",
            rawRedistribution: "prohibited",
            derivedRedistribution: "allowed",
            attribution: "not-required",
            licenseNotice: "not-required",
            conditions: [],
            reviewedAt: "2026-09-08",
            reviewReferences: [
                "docs/licenses/test-source.md",
            ],
        },

        permittedUses: [
            "canonical-evidence",
            "runtime-generation",
        ],

        profiles: [
            "general-anagram",
        ],

        transformation: {
            pipelineId: "test-lexical",
            pipelineVersion: 1,
            parameters: {},
        },
    };
}

const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "wordcabin-source-contract-")
);

try {
    const goodPath = path.join(tempRoot, "good.txt");
    const corruptPath = path.join(tempRoot, "corrupt.txt");
    const truncatedPath = path.join(tempRoot, "truncated.txt");
    const emptyPath = path.join(tempRoot, "empty.txt");
    const missingPath = path.join(tempRoot, "missing.txt");

    const goodContent = Buffer.from(
        "alpha\nbeta\ngamma\n",
        "utf8"
    );

    const corruptSameSize = Buffer.from(
        "alpha\nzeta\ngamma\n",
        "utf8"
    );

    assert.equal(
        corruptSameSize.length,
        goodContent.length,
        "Corrupt fixture must have the same size as the good fixture."
    );

    fs.writeFileSync(goodPath, goodContent);
    fs.writeFileSync(corruptPath, corruptSameSize);
    fs.writeFileSync(
        truncatedPath,
        goodContent.subarray(0, goodContent.length - 2)
    );
    fs.writeFileSync(emptyPath, Buffer.alloc(0));

    const manifest = createManifest({
        sizeBytes: goodContent.length,
        sha256Value: sha256(goodContent),
    });

    const manifestResult = validateSourceManifest(manifest);

    assert.equal(
        manifestResult.passed,
        true,
        JSON.stringify(manifestResult.errors, null, 2)
    );

    console.log("PASS: valid approved manifest accepted");

    const goodResult = await validateSourceArtifact({
        manifest,
        artifactId: "primary",
        resolvedPath: goodPath,
    });

    assert.equal(goodResult.status, "passed");
    assert.equal(goodResult.artifactIntegrityPassed, true);
    assert.equal(goodResult.parsingAttempted, false);

    assert.equal(
        Object.hasOwn(goodResult, "candidateGenerationAllowed"),
        false
    );

    console.log(
        "PASS: integrity gate does not self-authorize candidate generation"
    );

    console.log("PASS: correct artifact accepted");

    const corruptResult = await validateSourceArtifact({
        manifest,
        artifactId: "primary",
        resolvedPath: corruptPath,
    });

    assert.equal(
        corruptResult.reasonCode,
        "FAIL_SOURCE_CHECKSUM_MISMATCH"
    );

    assert.equal(
        corruptResult.artifactIntegrityPassed,
        false
    );

    assert.equal(corruptResult.parsingAttempted, false);

    assert.notEqual(
        corruptResult.expectedSha256,
        corruptResult.actualSha256
    );

    console.log(
        "PASS: same-size corrupted artifact rejected by SHA-256"
    );

    const truncatedResult = await validateSourceArtifact({
        manifest,
        artifactId: "primary",
        resolvedPath: truncatedPath,
    });

    assert.equal(
        truncatedResult.reasonCode,
        "FAIL_SOURCE_SIZE_MISMATCH"
    );

    assert.equal(truncatedResult.actualSha256, null);
    assert.equal(truncatedResult.parsingAttempted, false);

    console.log(
        "PASS: truncated artifact rejected before hashing/parsing"
    );

    const emptyResult = await validateSourceArtifact({
        manifest,
        artifactId: "primary",
        resolvedPath: emptyPath,
    });

    assert.equal(
        emptyResult.reasonCode,
        "FAIL_SOURCE_EMPTY"
    );

    assert.equal(emptyResult.parsingAttempted, false);

    console.log("PASS: zero-byte artifact rejected");

    const missingResult = await validateSourceArtifact({
        manifest,
        artifactId: "primary",
        resolvedPath: missingPath,
    });

    assert.equal(
        missingResult.reasonCode,
        "FAIL_SOURCE_MISSING"
    );

    assert.equal(missingResult.parsingAttempted, false);

    console.log("PASS: missing artifact rejected");

    const suspendedManifest = createManifest({
        status: "suspended",
        sizeBytes: goodContent.length,
        sha256Value: sha256(goodContent),
    });

    const suspendedResult = await validateSourceArtifact({
        manifest: suspendedManifest,
        artifactId: "primary",
        resolvedPath: goodPath,
    });

    assert.equal(
        suspendedResult.reasonCode,
        "FAIL_SOURCE_NOT_APPROVED"
    );

    assert.equal(suspendedResult.parsingAttempted, false);

    console.log(
        "PASS: suspended source rejected before artifact parsing"
    );

    const badPathManifest = structuredClone(manifest);

    badPathManifest.artifacts[0].fileName =
        "../../outside-source.txt";

    const badPathResult =
        validateSourceManifest(badPathManifest);

    assert.equal(badPathResult.passed, false);

    assert.ok(
        badPathResult.errors.some(
            (error) =>
                error.code ===
                "MANIFEST_UNSAFE_ARTIFACT_PATH"
        )
    );

    console.log(
        "PASS: unsafe artifact path rejected by manifest contract"
    );

    const missingVersionManifest = structuredClone(manifest);
    missingVersionManifest.sourceVersion = null;

    const missingVersionResult =
        validateSourceManifest(missingVersionManifest);

    assert.equal(missingVersionResult.passed, false);

    assert.ok(
        missingVersionResult.errors.some(
            (error) =>
                error.code ===
                "MANIFEST_APPROVED_SOURCE_MISSING_VERSION"
        )
    );

    console.log(
        "PASS: approved source without exact version rejected"
    );

    const missingAcquisitionDocsManifest =
        structuredClone(manifest);

    missingAcquisitionDocsManifest.acquisition.documentedProcedure =
        null;

    const missingAcquisitionDocsResult =
        validateSourceManifest(missingAcquisitionDocsManifest);

    assert.equal(missingAcquisitionDocsResult.passed, false);

    assert.ok(
        missingAcquisitionDocsResult.errors.some(
            (error) =>
                error.code ===
                "MANIFEST_APPROVED_SOURCE_MISSING_ACQUISITION_DOCUMENTATION"
        )
    );

    console.log(
        "PASS: approved source without acquisition documentation rejected"
    );

    const missingLicenseReferenceManifest =
        structuredClone(manifest);

    missingLicenseReferenceManifest.license.reference = null;

    const missingLicenseReferenceResult =
        validateSourceManifest(missingLicenseReferenceManifest);

    assert.equal(missingLicenseReferenceResult.passed, false);

    assert.ok(
        missingLicenseReferenceResult.errors.some(
            (error) =>
                error.code ===
                "MANIFEST_APPROVED_SOURCE_MISSING_LICENSE_REFERENCE"
        )
    );

    console.log(
        "PASS: approved source without license reference rejected"
    );

    const missingLicenseReviewDateManifest =
        structuredClone(manifest);

    missingLicenseReviewDateManifest.license.reviewedAt = null;

    const missingLicenseReviewDateResult =
        validateSourceManifest(missingLicenseReviewDateManifest);

    assert.equal(missingLicenseReviewDateResult.passed, false);

    assert.ok(
        missingLicenseReviewDateResult.errors.some(
            (error) =>
                error.code ===
                "MANIFEST_APPROVED_SOURCE_MISSING_LICENSE_REVIEW_DATE"
        )
    );

    console.log(
        "PASS: approved source without license review date rejected"
    );

    const missingLicenseReviewEvidenceManifest =
        structuredClone(manifest);

    missingLicenseReviewEvidenceManifest.license.reviewReferences =
        [];

    const missingLicenseReviewEvidenceResult =
        validateSourceManifest(
            missingLicenseReviewEvidenceManifest
        );

    assert.equal(
        missingLicenseReviewEvidenceResult.passed,
        false
    );

    assert.ok(
        missingLicenseReviewEvidenceResult.errors.some(
            (error) =>
                error.code ===
                "MANIFEST_APPROVED_SOURCE_MISSING_LICENSE_REVIEW_EVIDENCE"
        )
    );

    console.log(
        "PASS: approved source without license-review evidence rejected"
    );
    console.log(
        "=== SOURCE_CONTRACT_TESTS_COMPLETE ==="
    );
} finally {
    fs.rmSync(tempRoot, {
        recursive: true,
        force: true,
    });
}
