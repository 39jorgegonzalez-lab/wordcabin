import path from "node:path";

import {
    PERMITTED_USES,
    validateSourceManifest,
} from "./source-contract.js";

const INTERNAL_EVALUATION_USES = new Set([
    "internal-analysis",
    "internal-qa",
]);

const PROFILE_REQUIRED_USES = new Set([
    "profile-classification",
    "runtime-generation",
    "public-runtime",
]);

const TRANSFORMATION_REQUIRED_USES = new Set([
    "canonical-evidence",
    "profile-classification",
    "runtime-generation",
    "public-runtime",
    "seo-content-support",
]);

const DERIVED_REDISTRIBUTION_REQUIRED_USES = new Set([
    "public-runtime",
    "seo-content-support",
]);

const SATISFIABLE_OBLIGATIONS = new Set([
    "attribution",
    "licenseNotice",
]);

const PRODUCT_VALUE_STATES = new Set([
    "pending",
    "passed",
    "failed",
]);

const SIGNIFICANT_IMPROVEMENT_STATES = new Set([
    "not-applicable",
    "pending",
    "passed",
    "failed",
]);

const PROFILE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function isPlainObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function isSafeRelativePath(value) {
    if (
        typeof value !== "string" ||
        value.trim().length === 0 ||
        path.isAbsolute(value) ||
        /^[A-Za-z]:[\\/]/.test(value)
    ) {
        return false;
    }

    return !value
        .replaceAll("\\", "/")
        .split("/")
        .some((segment) => segment === "..");
}

function failed({
    manifest,
    requestedUse,
    profile,
    reasonCode,
    details = null,
}) {
    return {
        sourceId: manifest?.sourceId ?? null,
        stage: "source-eligibility",
        status: "failed",
        requestedUse: requestedUse ?? null,
        profile: profile ?? null,
        reasonCode,
        details,
        eligibleForRequestedUse: false,
    };
}

function licensePermissionPassed(value) {
    return value === "allowed";
}

function validateArtifactSet({
    manifest,
    artifactValidations,
    requestedUse,
    profile,
}) {
    if (!Array.isArray(artifactValidations)) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_ARTIFACT_VALIDATION_SET_INVALID",
        });
    }

    const requiredArtifacts = manifest.artifacts.filter(
        (artifact) => artifact.required === true
    );

    if (requiredArtifacts.length === 0) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_REQUIRED_ARTIFACT_SET_EMPTY",
        });
    }

    const seen = new Set();

    for (const validation of artifactValidations) {
        if (!isPlainObject(validation)) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode: "FAIL_ARTIFACT_VALIDATION_INVALID",
            });
        }

        if (validation.sourceId !== manifest.sourceId) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_ARTIFACT_VALIDATION_SOURCE_MISMATCH",
                details: {
                    expectedSourceId: manifest.sourceId,
                    actualSourceId:
                        validation.sourceId ?? null,
                },
            });
        }

        if (
            typeof validation.artifactId !== "string" ||
            validation.artifactId.length === 0
        ) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_ARTIFACT_VALIDATION_INVALID",
            });
        }

        if (seen.has(validation.artifactId)) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_ARTIFACT_VALIDATION_DUPLICATE",
                details: {
                    artifactId: validation.artifactId,
                },
            });
        }

        seen.add(validation.artifactId);
    }

    for (const artifact of requiredArtifacts) {
        const validation = artifactValidations.find(
            (entry) =>
                entry.artifactId === artifact.artifactId
        );

        if (!validation) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_REQUIRED_ARTIFACT_VALIDATION_MISSING",
                details: {
                    artifactId: artifact.artifactId,
                },
            });
        }

        if (
            validation.status !== "passed" ||
            validation.artifactIntegrityPassed !== true
        ) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_REQUIRED_ARTIFACT_INTEGRITY_NOT_PASSED",
                details: {
                    artifactId: artifact.artifactId,
                    validationStatus:
                        validation.status ?? null,
                },
            });
        }

        const validationBoundToManifest =
            validation.stage === "artifact-integrity" &&
            validation.reasonCode === null &&
            validation.expectedSizeBytes ===
                artifact.sizeBytes &&
            validation.actualSizeBytes ===
                artifact.sizeBytes &&
            typeof artifact.sha256 === "string" &&
            typeof validation.expectedSha256 === "string" &&
            typeof validation.actualSha256 === "string" &&
            validation.expectedSha256.toLowerCase() ===
                artifact.sha256.toLowerCase() &&
            validation.actualSha256.toLowerCase() ===
                artifact.sha256.toLowerCase();

        if (!validationBoundToManifest) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_REQUIRED_ARTIFACT_VALIDATION_NOT_BOUND_TO_MANIFEST",
                details: {
                    artifactId: artifact.artifactId,
                },
            });
        }
    }

    return null;
}

function validateObligations({
    manifest,
    licenseObligationEvidence,
    requestedUse,
    profile,
}) {
    if (!Array.isArray(licenseObligationEvidence)) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_LICENSE_OBLIGATION_CONTEXT_INVALID",
        });
    }

    const seen = new Map();

    for (const evidence of licenseObligationEvidence) {
        if (!isPlainObject(evidence)) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_LICENSE_OBLIGATION_CONTEXT_INVALID",
            });
        }

        const keys = Object.keys(evidence);

        if (
            keys.length !== 2 ||
            !keys.includes("obligation") ||
            !keys.includes("evidenceReference")
        ) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_LICENSE_OBLIGATION_CONTEXT_INVALID",
            });
        }

        if (
            !SATISFIABLE_OBLIGATIONS.has(
                evidence.obligation
            )
        ) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_LICENSE_OBLIGATION_CONTEXT_INVALID",
                details: {
                    obligation:
                        evidence.obligation ?? null,
                },
            });
        }

        if (seen.has(evidence.obligation)) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_LICENSE_OBLIGATION_CONTEXT_INVALID",
                details: {
                    obligation: evidence.obligation,
                    issue: "duplicate",
                },
            });
        }

        if (
            !isSafeRelativePath(
                evidence.evidenceReference
            )
        ) {
            return failed({
                manifest,
                requestedUse,
                profile,
                reasonCode:
                    "FAIL_LICENSE_OBLIGATION_EVIDENCE_INVALID",
                details: {
                    obligation: evidence.obligation,
                },
            });
        }

        seen.set(
            evidence.obligation,
            evidence.evidenceReference
        );
    }

    if (
        manifest.license.attribution === "required" &&
        !seen.has("attribution")
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_LICENSE_ATTRIBUTION_UNSATISFIED",
        });
    }

    if (
        manifest.license.licenseNotice === "required" &&
        !seen.has("licenseNotice")
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_LICENSE_NOTICE_UNSATISFIED",
        });
    }

    return null;
}
function validateValueReview({
    manifest,
    valueReview,
    requestedUse,
    profile,
}) {
    if (!isPlainObject(valueReview)) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PRODUCT_VALUE_REVIEW_REQUIRED",
        });
    }

    if (!PRODUCT_VALUE_STATES.has(valueReview.status)) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PRODUCT_VALUE_REVIEW_INVALID",
        });
    }

    if (valueReview.status !== "passed") {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PRODUCT_VALUE_REVIEW_NOT_PASSED",
            details: {
                status: valueReview.status,
            },
        });
    }

    if (typeof valueReview.paidSource !== "boolean") {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PRODUCT_VALUE_REVIEW_INVALID",
        });
    }

    if (
        !SIGNIFICANT_IMPROVEMENT_STATES.has(
            valueReview.significantImprovement
        )
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PRODUCT_VALUE_REVIEW_INVALID",
        });
    }

    if (!isSafeRelativePath(valueReview.reviewReference)) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PRODUCT_VALUE_REVIEW_REFERENCE_INVALID",
        });
    }

    if (
        valueReview.paidSource === true &&
        valueReview.significantImprovement !== "passed"
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PAID_SOURCE_SIGNIFICANT_IMPROVEMENT_NOT_PASSED",
            details: {
                significantImprovement:
                    valueReview.significantImprovement,
            },
        });
    }

    if (
        valueReview.paidSource === false &&
        valueReview.significantImprovement !==
            "not-applicable"
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_PRODUCT_VALUE_REVIEW_INVALID",
            details: {
                significantImprovement:
                    valueReview.significantImprovement,
            },
        });
    }

    return null;
}

export function evaluateSourceEligibility({
    manifest,
    artifactValidations,
    requestedUse,
    profile = null,
    licenseObligationEvidence = [],
    valueReview,
}) {
    const manifestResult = validateSourceManifest(manifest);

    if (!manifestResult.passed) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_MANIFEST_SCHEMA",
            details: manifestResult.errors,
        });
    }

    const internalEvaluation =
        INTERNAL_EVALUATION_USES.has(requestedUse);

    if (
        manifest.status !== "approved" &&
        !(
            manifest.status === "candidate" &&
            internalEvaluation
        )
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_SOURCE_NOT_APPROVED",
        });
    }

    if (!PERMITTED_USES.includes(requestedUse)) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_REQUESTED_USE_INVALID",
        });
    }

    if (!manifest.permittedUses.includes(requestedUse)) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_USE_NOT_AUTHORIZED",
        });
    }

    if (
        PROFILE_REQUIRED_USES.has(requestedUse) &&
        (
            typeof profile !== "string" ||
            !PROFILE_ID_PATTERN.test(profile)
        )
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_PROFILE_REQUIRED",
        });
    }

    if (
        profile !== null &&
        (
            typeof profile !== "string" ||
            !PROFILE_ID_PATTERN.test(profile)
        )
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_PROFILE_INVALID",
        });
    }

    if (
        profile !== null &&
        !manifest.profiles.includes(profile)
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_PROFILE_NOT_AUTHORIZED",
        });
    }

    const artifactFailure = validateArtifactSet({
        manifest,
        artifactValidations,
        requestedUse,
        profile,
    });

    if (artifactFailure) {
        return artifactFailure;
    }

    if (manifest.license.status !== "verified") {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode: "FAIL_LICENSE_UNVERIFIED",
        });
    }

    if (
        !licensePermissionPassed(
            manifest.license.commercialUse
        )
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_LICENSE_COMMERCIAL_USE_NOT_CLEARED",
            details: {
                permission:
                    manifest.license.commercialUse,
            },
        });
    }

    if (
        TRANSFORMATION_REQUIRED_USES.has(requestedUse) &&
        !licensePermissionPassed(
            manifest.license.transformation
        )
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_LICENSE_TRANSFORMATION_NOT_CLEARED",
            details: {
                permission:
                    manifest.license.transformation,
            },
        });
    }

    if (
        DERIVED_REDISTRIBUTION_REQUIRED_USES.has(
            requestedUse
        ) &&
        !licensePermissionPassed(
            manifest.license.derivedRedistribution
        )
    ) {
        return failed({
            manifest,
            requestedUse,
            profile,
            reasonCode:
                "FAIL_LICENSE_DERIVED_REDISTRIBUTION_NOT_CLEARED",
            details: {
                permission:
                    manifest.license.derivedRedistribution,
            },
        });
    }

    const obligationFailure = validateObligations({
        manifest,
        licenseObligationEvidence,
        requestedUse,
        profile,
    });

    if (obligationFailure) {
        return obligationFailure;
    }

    if (!internalEvaluation) {
        const valueFailure = validateValueReview({
            manifest,
            valueReview,
            requestedUse,
            profile,
        });

        if (valueFailure) {
            return valueFailure;
        }
    }

    return {
        sourceId: manifest.sourceId,
        stage: "source-eligibility",
        status: "passed",
        requestedUse,
        profile,
        reasonCode: null,
        valueReviewReference:
            internalEvaluation
                ? null
                : valueReview.reviewReference,
        eligibleForRequestedUse: true,
    };
}
