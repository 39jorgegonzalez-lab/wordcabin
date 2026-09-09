import assert from "node:assert/strict";

import {
    evaluateSourceEligibility,
} from "./source-eligibility.js";

function createManifest() {
    return {
        manifestVersion: 1,
        sourceId: "test-lexical-source",
        sourceName: "Test Lexical Source",
        sourceVersion: "1.0.0",
        status: "approved",

        roles: ["lexical"],

        evidenceCapabilities: [
            "lexical-existence",
        ],

        claimAuthority: [
            "lexical-validity",
        ],

        acquisition: {
            mode: "manual-download",
            documentedProcedure:
                "docs/sources/test-source.md",
            credentialReference: null,
        },

        artifacts: [
            {
                artifactId: "primary",
                fileName: "source.txt",
                required: true,
                sha256: "a".repeat(64),
                sizeBytes: 100,
            },
            {
                artifactId: "metadata",
                fileName: "metadata.txt",
                required: true,
                sha256: "b".repeat(64),
                sizeBytes: 50,
            },
        ],

        license: {
            status: "verified",
            identifier: "TEST-LICENSE",
            reference:
                "docs/licenses/test-source.md",
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
            "profile-classification",
            "runtime-generation",
            "public-runtime",
            "seo-content-support",
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

function createArtifactValidations() {
    return [
        {
            sourceId: "test-lexical-source",
            artifactId: "primary",
            stage: "artifact-integrity",
            status: "passed",
            reasonCode: null,
            expectedSizeBytes: 100,
            actualSizeBytes: 100,
            expectedSha256: "a".repeat(64),
            actualSha256: "a".repeat(64),
            parsingAttempted: false,
            artifactIntegrityPassed: true,
        },
        {
            sourceId: "test-lexical-source",
            artifactId: "metadata",
            stage: "artifact-integrity",
            status: "passed",
            reasonCode: null,
            expectedSizeBytes: 50,
            actualSizeBytes: 50,
            expectedSha256: "b".repeat(64),
            actualSha256: "b".repeat(64),
            parsingAttempted: false,
            artifactIntegrityPassed: true,
        },
    ];
}
function createValueReview({
    paidSource = false,
    significantImprovement = "not-applicable",
    status = "passed",
} = {}) {
    return {
        status,
        paidSource,
        significantImprovement,
        reviewReference:
            "docs/source-reviews/test-source-value.md",
    };
}

function evaluate({
    manifest = createManifest(),
    artifactValidations =
        createArtifactValidations(),
    requestedUse = "runtime-generation",
    profile = "general-anagram",
    licenseObligationEvidence = [],
    valueReview = createValueReview(),
} = {}) {
    return evaluateSourceEligibility({
        manifest,
        artifactValidations,
        requestedUse,
        profile,
        licenseObligationEvidence,
        valueReview,
    });
}

const goodResult = evaluate();

assert.equal(goodResult.status, "passed");
assert.equal(
    goodResult.eligibleForRequestedUse,
    true
);

console.log(
    "PASS: fully authorized source eligible for requested use"
);

const forgedArtifactValidations =
    createArtifactValidations();

forgedArtifactValidations[0] = {
    sourceId: "test-lexical-source",
    artifactId: "primary",
    status: "passed",
    artifactIntegrityPassed: true,
};

const forgedArtifactResult = evaluate({
    artifactValidations:
        forgedArtifactValidations,
});

assert.equal(
    forgedArtifactResult.reasonCode,
    "FAIL_REQUIRED_ARTIFACT_VALIDATION_NOT_BOUND_TO_MANIFEST"
);

console.log(
    "PASS: bare artifact PASS assertion cannot bypass manifest binding"
);
const failedArtifactValidations =
    createArtifactValidations();

failedArtifactValidations[0] = {
    ...failedArtifactValidations[0],
    status: "failed",
    artifactIntegrityPassed: false,
};

const failedArtifactResult = evaluate({
    artifactValidations:
        failedArtifactValidations,
});

assert.equal(
    failedArtifactResult.reasonCode,
    "FAIL_REQUIRED_ARTIFACT_INTEGRITY_NOT_PASSED"
);

console.log(
    "PASS: failed artifact integrity blocks eligibility"
);

const missingArtifactResult = evaluate({
    artifactValidations: [
        createArtifactValidations()[0],
    ],
});

assert.equal(
    missingArtifactResult.reasonCode,
    "FAIL_REQUIRED_ARTIFACT_VALIDATION_MISSING"
);

console.log(
    "PASS: missing required artifact validation blocks eligibility"
);

const sourceMismatchValidations =
    createArtifactValidations();

sourceMismatchValidations[0] = {
    ...sourceMismatchValidations[0],
    sourceId: "different-source",
};

const sourceMismatchResult = evaluate({
    artifactValidations:
        sourceMismatchValidations,
});

assert.equal(
    sourceMismatchResult.reasonCode,
    "FAIL_ARTIFACT_VALIDATION_SOURCE_MISMATCH"
);

console.log(
    "PASS: artifact validation cannot be reused across sources"
);

const noRequiredArtifactsManifest =
    createManifest();

noRequiredArtifactsManifest.artifacts =
    noRequiredArtifactsManifest.artifacts.map(
        (artifact) => ({
            ...artifact,
            required: false,
        })
    );

const noRequiredArtifactsResult = evaluate({
    manifest: noRequiredArtifactsManifest,
});

assert.equal(
    noRequiredArtifactsResult.reasonCode,
    "FAIL_REQUIRED_ARTIFACT_SET_EMPTY"
);

console.log(
    "PASS: approved source cannot bypass integrity with zero required artifacts"
);

const unauthorizedUseManifest =
    createManifest();

unauthorizedUseManifest.permittedUses =
    unauthorizedUseManifest.permittedUses.filter(
        (use) => use !== "runtime-generation"
    );

const unauthorizedUseResult = evaluate({
    manifest: unauthorizedUseManifest,
});

assert.equal(
    unauthorizedUseResult.reasonCode,
    "FAIL_USE_NOT_AUTHORIZED"
);

console.log(
    "PASS: unauthorized requested use blocked"
);

const unauthorizedProfileResult = evaluate({
    profile: "word-game",
});

assert.equal(
    unauthorizedProfileResult.reasonCode,
    "FAIL_PROFILE_NOT_AUTHORIZED"
);

console.log(
    "PASS: unauthorized profile blocked"
);

const candidateManifest = createManifest();
candidateManifest.status = "candidate";

const candidateResult = evaluate({
    manifest: candidateManifest,
});

assert.equal(
    candidateResult.reasonCode,
    "FAIL_SOURCE_NOT_APPROVED"
);

console.log(
    "PASS: candidate source cannot participate in approved build"
);

const unverifiedLicenseManifest =
    createManifest();

unverifiedLicenseManifest.license.status =
    "pending";

const unverifiedLicenseResult = evaluate({
    manifest: unverifiedLicenseManifest,
});

assert.equal(
    unverifiedLicenseResult.reasonCode,
    "FAIL_MANIFEST_SCHEMA"
);

assert.ok(
    unverifiedLicenseResult.details.some(
        (error) =>
            error.code ===
            "MANIFEST_APPROVED_SOURCE_LICENSE_NOT_VERIFIED"
    )
);

console.log(
    "PASS: unverified license blocks approved source"
);

const unknownCommercialManifest =
    createManifest();

unknownCommercialManifest.license.commercialUse =
    "unknown";

const unknownCommercialResult = evaluate({
    manifest: unknownCommercialManifest,
});

assert.equal(
    unknownCommercialResult.reasonCode,
    "FAIL_MANIFEST_SCHEMA"
);

assert.ok(
    unknownCommercialResult.details.some(
        (error) =>
            error.code ===
            "MANIFEST_APPROVED_SOURCE_UNKNOWN_PERMISSION"
    )
);

console.log(
    "PASS: unknown commercial permission blocks approved source"
);

const prohibitedCommercialManifest =
    createManifest();

prohibitedCommercialManifest.license.commercialUse =
    "prohibited";

const prohibitedCommercialResult = evaluate({
    manifest: prohibitedCommercialManifest,
});

assert.equal(
    prohibitedCommercialResult.reasonCode,
    "FAIL_LICENSE_COMMERCIAL_USE_NOT_CLEARED"
);

console.log(
    "PASS: prohibited commercial use blocks WordCabin eligibility"
);

const prohibitedTransformationManifest =
    createManifest();

prohibitedTransformationManifest.license.transformation =
    "prohibited";

const prohibitedTransformationResult = evaluate({
    manifest:
        prohibitedTransformationManifest,
});

assert.equal(
    prohibitedTransformationResult.reasonCode,
    "FAIL_LICENSE_TRANSFORMATION_NOT_CLEARED"
);

console.log(
    "PASS: transformation permission required for runtime generation"
);

const prohibitedRedistributionManifest =
    createManifest();

prohibitedRedistributionManifest.license.derivedRedistribution =
    "prohibited";

const prohibitedRedistributionResult = evaluate({
    manifest:
        prohibitedRedistributionManifest,
    requestedUse: "public-runtime",
});

assert.equal(
    prohibitedRedistributionResult.reasonCode,
    "FAIL_LICENSE_DERIVED_REDISTRIBUTION_NOT_CLEARED"
);

console.log(
    "PASS: public runtime requires cleared derived redistribution"
);

const attributionManifest = createManifest();

attributionManifest.license.attribution =
    "required";

const missingAttributionResult = evaluate({
    manifest: attributionManifest,
});

assert.equal(
    missingAttributionResult.reasonCode,
    "FAIL_LICENSE_ATTRIBUTION_UNSATISFIED"
);

console.log(
    "PASS: required attribution must be satisfied explicitly"
);

const bareAttributionAssertionResult = evaluate({
    manifest: attributionManifest,
    licenseObligationEvidence: [
        "attribution",
    ],
});

assert.equal(
    bareAttributionAssertionResult.reasonCode,
    "FAIL_LICENSE_OBLIGATION_CONTEXT_INVALID"
);

console.log(
    "PASS: bare attribution assertion cannot satisfy license obligation"
);
const satisfiedAttributionResult = evaluate({
    manifest: attributionManifest,
    licenseObligationEvidence: [
        {
            obligation: "attribution",
            evidenceReference:
                "docs/licenses/test-source-attribution.md",
        },
    ],
});

assert.equal(
    satisfiedAttributionResult.status,
    "passed"
);

console.log(
    "PASS: documented attribution satisfaction permits continued evaluation"
);

const noticeManifest = createManifest();

noticeManifest.license.licenseNotice =
    "required";

const missingNoticeResult = evaluate({
    manifest: noticeManifest,
});

assert.equal(
    missingNoticeResult.reasonCode,
    "FAIL_LICENSE_NOTICE_UNSATISFIED"
);

console.log(
    "PASS: required license notice must be satisfied explicitly"
);

const pendingValueResult = evaluate({
    valueReview: createValueReview({
        status: "pending",
    }),
});

assert.equal(
    pendingValueResult.reasonCode,
    "FAIL_PRODUCT_VALUE_REVIEW_NOT_PASSED"
);

console.log(
    "PASS: pending product-value review blocks eligibility"
);

const paidMarginalResult = evaluate({
    valueReview: createValueReview({
        paidSource: true,
        significantImprovement: "failed",
    }),
});

assert.equal(
    paidMarginalResult.reasonCode,
    "FAIL_PAID_SOURCE_SIGNIFICANT_IMPROVEMENT_NOT_PASSED"
);

console.log(
    "PASS: paid source rejected without significant measured improvement"
);

const paidStrongResult = evaluate({
    valueReview: createValueReview({
        paidSource: true,
        significantImprovement: "passed",
    }),
});

assert.equal(
    paidStrongResult.status,
    "passed"
);

assert.equal(
    paidStrongResult.eligibleForRequestedUse,
    true
);

console.log(
    "PASS: paid source can pass only with significant-improvement review"
);

const candidateInternalManifest =
    createManifest();

candidateInternalManifest.status = "candidate";

candidateInternalManifest.permittedUses.push(
    "internal-analysis"
);

const candidateInternalResult = evaluate({
    manifest: candidateInternalManifest,
    requestedUse: "internal-analysis",
    profile: null,
    valueReview: undefined,
});

assert.equal(
    candidateInternalResult.status,
    "passed"
);

assert.equal(
    candidateInternalResult.eligibleForRequestedUse,
    true
);

console.log(
    "PASS: candidate source may undergo cleared internal analysis before approval"
);

const candidateProductionManifest =
    createManifest();

candidateProductionManifest.status = "candidate";

const candidateProductionResult = evaluate({
    manifest: candidateProductionManifest,
    requestedUse: "runtime-generation",
});

assert.equal(
    candidateProductionResult.reasonCode,
    "FAIL_SOURCE_NOT_APPROVED"
);

console.log(
    "PASS: candidate source remains blocked from runtime generation"
);
console.log(
    "=== SOURCE_ELIGIBILITY_TESTS_COMPLETE ==="
);
