import fs from "node:fs";
import crypto from "node:crypto";

import { validateSourceManifest } from "./source-contract.js";

async function sha256File(filePath) {
    return await new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(filePath);

        stream.on("error", reject);
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}

function failure({
    manifest,
    artifactId,
    reasonCode,
    stage,
    expectedSizeBytes = null,
    actualSizeBytes = null,
    expectedSha256 = null,
    actualSha256 = null,
    details = null,
}) {
    return {
        sourceId: manifest?.sourceId ?? null,
        artifactId,
        stage,
        status: "failed",
        reasonCode,
        expectedSizeBytes,
        actualSizeBytes,
        expectedSha256,
        actualSha256,
        details,
        parsingAttempted: false,
        artifactIntegrityPassed: false,
    };
}

export async function validateSourceArtifact({
    manifest,
    artifactId,
    resolvedPath,
}) {
    const manifestResult = validateSourceManifest(manifest);

    if (!manifestResult.passed) {
        return failure({
            manifest,
            artifactId,
            stage: "manifest",
            reasonCode: "FAIL_MANIFEST_SCHEMA",
            details: manifestResult.errors,
        });
    }

    if (manifest.status !== "approved") {
        return failure({
            manifest,
            artifactId,
            stage: "governance",
            reasonCode: "FAIL_SOURCE_NOT_APPROVED",
        });
    }

    const artifact = manifest.artifacts.find(
        (entry) => entry.artifactId === artifactId
    );

    if (!artifact) {
        return failure({
            manifest,
            artifactId,
            stage: "artifact-integrity",
            reasonCode: "FAIL_ARTIFACT_NOT_DECLARED",
        });
    }

    let stats;

    try {
        stats = fs.statSync(resolvedPath);
    } catch (error) {
        if (error?.code === "ENOENT") {
            return failure({
                manifest,
                artifactId,
                stage: "artifact-integrity",
                reasonCode: "FAIL_SOURCE_MISSING",
                expectedSizeBytes: artifact.sizeBytes,
                expectedSha256: artifact.sha256,
            });
        }

        throw error;
    }

    if (!stats.isFile()) {
        return failure({
            manifest,
            artifactId,
            stage: "artifact-integrity",
            reasonCode: "FAIL_SOURCE_NOT_FILE",
            expectedSizeBytes: artifact.sizeBytes,
            actualSizeBytes: stats.size,
            expectedSha256: artifact.sha256,
        });
    }

    if (stats.size === 0) {
        return failure({
            manifest,
            artifactId,
            stage: "artifact-integrity",
            reasonCode: "FAIL_SOURCE_EMPTY",
            expectedSizeBytes: artifact.sizeBytes,
            actualSizeBytes: 0,
            expectedSha256: artifact.sha256,
        });
    }

    if (stats.size !== artifact.sizeBytes) {
        return failure({
            manifest,
            artifactId,
            stage: "artifact-integrity",
            reasonCode: "FAIL_SOURCE_SIZE_MISMATCH",
            expectedSizeBytes: artifact.sizeBytes,
            actualSizeBytes: stats.size,
            expectedSha256: artifact.sha256,
        });
    }

    const actualSha256 = await sha256File(resolvedPath);

    if (
        actualSha256.toLowerCase() !==
        artifact.sha256.toLowerCase()
    ) {
        return failure({
            manifest,
            artifactId,
            stage: "artifact-integrity",
            reasonCode: "FAIL_SOURCE_CHECKSUM_MISMATCH",
            expectedSizeBytes: artifact.sizeBytes,
            actualSizeBytes: stats.size,
            expectedSha256: artifact.sha256,
            actualSha256,
        });
    }

    return {
        sourceId: manifest.sourceId,
        artifactId,
        stage: "artifact-integrity",
        status: "passed",
        reasonCode: null,
        expectedSizeBytes: artifact.sizeBytes,
        actualSizeBytes: stats.size,
        expectedSha256: artifact.sha256,
        actualSha256,
        parsingAttempted: false,
        artifactIntegrityPassed: true,
    };
}
