import path from "node:path";

export const SOURCE_MANIFEST_VERSION = 1;

export const SOURCE_STATUSES = Object.freeze([
    "candidate",
    "approved",
    "suspended",
    "retired",
]);

export const SOURCE_ROLES = Object.freeze([
    "lexical",
    "familiarity",
    "game-validity",
    "metadata",
    "safety",
    "supplemental-evidence",
]);

export const EVIDENCE_CAPABILITIES = Object.freeze([
    "lexical-existence",
    "general-english-usage",
    "variant-status",
    "register",
    "domain",
    "frequency",
    "familiarity",
    "game-validity",
    "proper-name-status",
    "safety-status",
    "morphology",
]);

export const CLAIM_AUTHORITIES = Object.freeze([
    "lexical-validity",
    "general-english-eligibility",
    "familiarity",
    "game-validity",
    "proper-name-status",
    "safety-status",
    "variant-status",
]);

export const ACQUISITION_MODES = Object.freeze([
    "repository",
    "manual-download",
    "automated-download",
    "authenticated-download",
    "package-manager",
    "generated-from-upstream",
    "external-local",
]);

export const LICENSE_REVIEW_STATES = Object.freeze([
    "pending",
    "verified",
    "blocked",
]);

export const LICENSE_PERMISSION_VALUES = Object.freeze([
    "allowed",
    "prohibited",
    "conditional",
    "unknown",
    "not-applicable",
]);

export const LICENSE_OBLIGATION_VALUES = Object.freeze([
    "required",
    "not-required",
    "unknown",
]);

export const PERMITTED_USES = Object.freeze([
    "canonical-evidence",
    "internal-analysis",
    "internal-qa",
    "profile-classification",
    "runtime-generation",
    "public-runtime",
    "seo-content-support",
]);

const SOURCE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function pushError(errors, code, field, message) {
    errors.push({ code, field, message });
}

function rejectUnknownFields(value, allowedFields, field, errors) {
    if (!isPlainObject(value)) {
        return;
    }

    for (const key of Object.keys(value)) {
        if (!allowedFields.includes(key)) {
            pushError(
                errors,
                "MANIFEST_UNKNOWN_FIELD",
                `${field}.${key}`,
                `Unknown field: ${field}.${key}`
            );
        }
    }
}

function validateEnumArray(value, allowed, field, errors, allowEmpty = false) {
    if (!Array.isArray(value)) {
        pushError(
            errors,
            "MANIFEST_INVALID_TYPE",
            field,
            `${field} must be an array.`
        );
        return;
    }

    if (!allowEmpty && value.length === 0) {
        pushError(
            errors,
            "MANIFEST_EMPTY_ARRAY",
            field,
            `${field} must not be empty.`
        );
    }

    const seen = new Set();

    for (const entry of value) {
        if (typeof entry !== "string" || !allowed.includes(entry)) {
            pushError(
                errors,
                "MANIFEST_INVALID_ENUM_VALUE",
                field,
                `Invalid ${field} value: ${String(entry)}`
            );
            continue;
        }

        if (seen.has(entry)) {
            pushError(
                errors,
                "MANIFEST_DUPLICATE_VALUE",
                field,
                `Duplicate ${field} value: ${entry}`
            );
        }

        seen.add(entry);
    }
}

function validateStringArray(value, field, errors) {
    if (!Array.isArray(value)) {
        pushError(
            errors,
            "MANIFEST_INVALID_TYPE",
            field,
            `${field} must be an array.`
        );
        return;
    }

    const seen = new Set();

    for (const entry of value) {
        if (typeof entry !== "string" || entry.trim().length === 0) {
            pushError(
                errors,
                "MANIFEST_INVALID_STRING",
                field,
                `${field} entries must be non-empty strings.`
            );
            continue;
        }

        if (seen.has(entry)) {
            pushError(
                errors,
                "MANIFEST_DUPLICATE_VALUE",
                field,
                `Duplicate ${field} value: ${entry}`
            );
        }

        seen.add(entry);
    }
}

function isUnsafeRelativePath(value) {
    if (typeof value !== "string" || value.length === 0) {
        return true;
    }

    if (path.isAbsolute(value)) {
        return true;
    }

    if (/^[A-Za-z]:[\\/]/.test(value)) {
        return true;
    }

    const segments = value.replaceAll("\\", "/").split("/");

    return segments.some((segment) => segment === "..");
}

function validateAuthorityRoleRelationships(manifest, errors) {
    const roles = new Set(manifest.roles || []);
    const authorities = new Set(manifest.claimAuthority || []);

    const requirements = new Map([
        ["lexical-validity", ["lexical"]],
        ["general-english-eligibility", ["lexical"]],
        ["familiarity", ["familiarity"]],
        ["game-validity", ["game-validity"]],
        [
            "proper-name-status",
            ["lexical", "metadata", "supplemental-evidence"],
        ],
        ["safety-status", ["safety"]],
        ["variant-status", ["lexical", "metadata"]],
    ]);

    for (const authority of authorities) {
        const acceptableRoles = requirements.get(authority);

        if (!acceptableRoles) {
            continue;
        }

        const hasRequiredRole = acceptableRoles.some((role) =>
            roles.has(role)
        );

        if (!hasRequiredRole) {
            pushError(
                errors,
                "MANIFEST_AUTHORITY_ROLE_MISMATCH",
                "claimAuthority",
                `${authority} is not supported by the declared source roles.`
            );
        }
    }
}

function validateApprovedSourceRequirements(manifest, errors) {
    if (manifest.status !== "approved") {
        return;
    }

    if (
        typeof manifest.sourceVersion !== "string" ||
        manifest.sourceVersion.trim().length === 0
    ) {
        pushError(
            errors,
            "MANIFEST_APPROVED_SOURCE_MISSING_VERSION",
            "sourceVersion",
            "Approved sources require an exact non-empty sourceVersion."
        );
    }

    const documentedProcedure =
        manifest.acquisition?.documentedProcedure;

    if (
        typeof documentedProcedure !== "string" ||
        documentedProcedure.trim().length === 0 ||
        isUnsafeRelativePath(documentedProcedure)
    ) {
        pushError(
            errors,
            "MANIFEST_APPROVED_SOURCE_MISSING_ACQUISITION_DOCUMENTATION",
            "acquisition.documentedProcedure",
            "Approved sources require a documented repository-relative acquisition procedure."
        );
    }

    if (!isPlainObject(manifest.license)) {
        return;
    }

    if (
        typeof manifest.license.reference !== "string" ||
        manifest.license.reference.trim().length === 0
    ) {
        pushError(
            errors,
            "MANIFEST_APPROVED_SOURCE_MISSING_LICENSE_REFERENCE",
            "license.reference",
            "Approved sources require a canonical license reference."
        );
    }

    if (
        typeof manifest.license.reviewedAt !== "string" ||
        !DATE_PATTERN.test(manifest.license.reviewedAt)
    ) {
        pushError(
            errors,
            "MANIFEST_APPROVED_SOURCE_MISSING_LICENSE_REVIEW_DATE",
            "license.reviewedAt",
            "Approved sources require a documented YYYY-MM-DD license review date."
        );
    }

    if (
        !Array.isArray(manifest.license.reviewReferences) ||
        manifest.license.reviewReferences.length === 0
    ) {
        pushError(
            errors,
            "MANIFEST_APPROVED_SOURCE_MISSING_LICENSE_REVIEW_EVIDENCE",
            "license.reviewReferences",
            "Approved sources require at least one license-review evidence reference."
        );
    }
}

export function validateSourceManifest(manifest) {
    const errors = [];

    if (!isPlainObject(manifest)) {
        return {
            passed: false,
            errors: [
                {
                    code: "MANIFEST_INVALID_ROOT",
                    field: "$",
                    message: "Manifest must be a plain object.",
                },
            ],
        };
    }

    rejectUnknownFields(
        manifest,
        [
            "manifestVersion",
            "sourceId",
            "sourceName",
            "sourceVersion",
            "status",
            "roles",
            "evidenceCapabilities",
            "claimAuthority",
            "acquisition",
            "artifacts",
            "license",
            "permittedUses",
            "profiles",
            "transformation",
        ],
        "$",
        errors
    );

    if (manifest.manifestVersion !== SOURCE_MANIFEST_VERSION) {
        pushError(
            errors,
            "MANIFEST_VERSION_UNSUPPORTED",
            "manifestVersion",
            `manifestVersion must equal ${SOURCE_MANIFEST_VERSION}.`
        );
    }

    if (
        typeof manifest.sourceId !== "string" ||
        !SOURCE_ID_PATTERN.test(manifest.sourceId)
    ) {
        pushError(
            errors,
            "MANIFEST_INVALID_SOURCE_ID",
            "sourceId",
            "sourceId must match ^[a-z][a-z0-9-]*$."
        );
    }

    if (
        typeof manifest.sourceName !== "string" ||
        manifest.sourceName.trim().length === 0
    ) {
        pushError(
            errors,
            "MANIFEST_INVALID_SOURCE_NAME",
            "sourceName",
            "sourceName must be a non-empty string."
        );
    }

    if (
        manifest.sourceVersion !== null &&
        (
            typeof manifest.sourceVersion !== "string" ||
            manifest.sourceVersion.trim().length === 0
        )
    ) {
        pushError(
            errors,
            "MANIFEST_INVALID_SOURCE_VERSION",
            "sourceVersion",
            "sourceVersion must be a non-empty string or null."
        );
    }

    if (!SOURCE_STATUSES.includes(manifest.status)) {
        pushError(
            errors,
            "MANIFEST_INVALID_STATUS",
            "status",
            `Invalid source status: ${String(manifest.status)}`
        );
    }

    validateEnumArray(
        manifest.roles,
        SOURCE_ROLES,
        "roles",
        errors
    );

    validateEnumArray(
        manifest.evidenceCapabilities,
        EVIDENCE_CAPABILITIES,
        "evidenceCapabilities",
        errors,
        true
    );

    validateEnumArray(
        manifest.claimAuthority,
        CLAIM_AUTHORITIES,
        "claimAuthority",
        errors,
        true
    );

    validateAuthorityRoleRelationships(manifest, errors);

    if (!isPlainObject(manifest.acquisition)) {
        pushError(
            errors,
            "MANIFEST_INVALID_ACQUISITION",
            "acquisition",
            "acquisition must be an object."
        );
    } else {
        rejectUnknownFields(
            manifest.acquisition,
            [
                "mode",
                "documentedProcedure",
                "credentialReference",
            ],
            "acquisition",
            errors
        );

        if (!ACQUISITION_MODES.includes(manifest.acquisition.mode)) {
            pushError(
                errors,
                "MANIFEST_INVALID_ACQUISITION_MODE",
                "acquisition.mode",
                "Invalid acquisition mode."
            );
        }

        const procedure = manifest.acquisition.documentedProcedure;

        if (
            procedure !== null &&
            (
                typeof procedure !== "string" ||
                isUnsafeRelativePath(procedure)
            )
        ) {
            pushError(
                errors,
                "MANIFEST_UNSAFE_ACQUISITION_PATH",
                "acquisition.documentedProcedure",
                "documentedProcedure must be a safe repository-relative path or null."
            );
        }

        const credential = manifest.acquisition.credentialReference;

        if (
            credential !== null &&
            credential !== undefined &&
            (
                typeof credential !== "string" ||
                !ENV_NAME_PATTERN.test(credential)
            )
        ) {
            pushError(
                errors,
                "MANIFEST_INVALID_CREDENTIAL_REFERENCE",
                "acquisition.credentialReference",
                "credentialReference must be an environment-variable name or null."
            );
        }
    }

    if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
        pushError(
            errors,
            "MANIFEST_INVALID_ARTIFACTS",
            "artifacts",
            "artifacts must be a non-empty array."
        );
    } else {
        const artifactIds = new Set();

        manifest.artifacts.forEach((artifact, index) => {
            const field = `artifacts[${index}]`;

            if (!isPlainObject(artifact)) {
                pushError(
                    errors,
                    "MANIFEST_INVALID_ARTIFACT",
                    field,
                    `${field} must be an object.`
                );
                return;
            }

            rejectUnknownFields(
                artifact,
                [
                    "artifactId",
                    "fileName",
                    "required",
                    "sha256",
                    "sizeBytes",
                ],
                field,
                errors
            );

            if (
                typeof artifact.artifactId !== "string" ||
                !SOURCE_ID_PATTERN.test(artifact.artifactId)
            ) {
                pushError(
                    errors,
                    "MANIFEST_INVALID_ARTIFACT_ID",
                    `${field}.artifactId`,
                    "artifactId must use the source-id format."
                );
            } else if (artifactIds.has(artifact.artifactId)) {
                pushError(
                    errors,
                    "MANIFEST_DUPLICATE_ARTIFACT_ID",
                    `${field}.artifactId`,
                    `Duplicate artifactId: ${artifact.artifactId}`
                );
            } else {
                artifactIds.add(artifact.artifactId);
            }

            if (isUnsafeRelativePath(artifact.fileName)) {
                pushError(
                    errors,
                    "MANIFEST_UNSAFE_ARTIFACT_PATH",
                    `${field}.fileName`,
                    "fileName must be a safe relative path."
                );
            }

            if (typeof artifact.required !== "boolean") {
                pushError(
                    errors,
                    "MANIFEST_INVALID_REQUIRED_FLAG",
                    `${field}.required`,
                    "required must be Boolean."
                );
            }

            if (
                artifact.sha256 !== null &&
                (
                    typeof artifact.sha256 !== "string" ||
                    !SHA256_PATTERN.test(artifact.sha256)
                )
            ) {
                pushError(
                    errors,
                    "MANIFEST_INVALID_SHA256",
                    `${field}.sha256`,
                    "sha256 must be 64 hexadecimal characters or null."
                );
            }

            if (
                artifact.sizeBytes !== null &&
                (
                    !Number.isSafeInteger(artifact.sizeBytes) ||
                    artifact.sizeBytes <= 0
                )
            ) {
                pushError(
                    errors,
                    "MANIFEST_INVALID_SIZE",
                    `${field}.sizeBytes`,
                    "sizeBytes must be a positive safe integer or null."
                );
            }

            if (
                manifest.status === "approved" &&
                artifact.required === true
            ) {
                if (
                    typeof artifact.sha256 !== "string" ||
                    !SHA256_PATTERN.test(artifact.sha256)
                ) {
                    pushError(
                        errors,
                        "MANIFEST_APPROVED_SOURCE_MISSING_SHA256",
                        `${field}.sha256`,
                        "Approved required artifacts need a SHA-256."
                    );
                }

                if (
                    !Number.isSafeInteger(artifact.sizeBytes) ||
                    artifact.sizeBytes <= 0
                ) {
                    pushError(
                        errors,
                        "MANIFEST_APPROVED_SOURCE_MISSING_SIZE",
                        `${field}.sizeBytes`,
                        "Approved required artifacts need exact sizeBytes."
                    );
                }
            }
        });
    }

    if (!isPlainObject(manifest.license)) {
        pushError(
            errors,
            "MANIFEST_INVALID_LICENSE",
            "license",
            "license must be an object."
        );
    } else {
        rejectUnknownFields(
            manifest.license,
            [
                "status",
                "identifier",
                "reference",
                "commercialUse",
                "transformation",
                "rawRedistribution",
                "derivedRedistribution",
                "attribution",
                "licenseNotice",
                "conditions",
                "reviewedAt",
                "reviewReferences",
            ],
            "license",
            errors
        );

        if (!LICENSE_REVIEW_STATES.includes(manifest.license.status)) {
            pushError(
                errors,
                "MANIFEST_INVALID_LICENSE_STATUS",
                "license.status",
                "Invalid license review status."
            );
        }

        for (const field of [
            "commercialUse",
            "transformation",
            "rawRedistribution",
            "derivedRedistribution",
        ]) {
            if (
                !LICENSE_PERMISSION_VALUES.includes(
                    manifest.license[field]
                )
            ) {
                pushError(
                    errors,
                    "MANIFEST_INVALID_LICENSE_PERMISSION",
                    `license.${field}`,
                    `Invalid license permission: ${field}`
                );
            }
        }

        for (const field of ["attribution", "licenseNotice"]) {
            if (
                !LICENSE_OBLIGATION_VALUES.includes(
                    manifest.license[field]
                )
            ) {
                pushError(
                    errors,
                    "MANIFEST_INVALID_LICENSE_OBLIGATION",
                    `license.${field}`,
                    `Invalid license obligation: ${field}`
                );
            }
        }

        validateStringArray(
            manifest.license.conditions,
            "license.conditions",
            errors
        );

        validateStringArray(
            manifest.license.reviewReferences,
            "license.reviewReferences",
            errors
        );

        const hasConditionalPermission = [
            "commercialUse",
            "transformation",
            "rawRedistribution",
            "derivedRedistribution",
        ].some(
            (field) => manifest.license[field] === "conditional"
        );

        if (
            hasConditionalPermission &&
            Array.isArray(manifest.license.conditions) &&
            manifest.license.conditions.length === 0
        ) {
            pushError(
                errors,
                "MANIFEST_CONDITIONAL_LICENSE_WITHOUT_CONDITIONS",
                "license.conditions",
                "Conditional permissions require documented conditions."
            );
        }

        if (
            manifest.license.reviewedAt !== null &&
            (
                typeof manifest.license.reviewedAt !== "string" ||
                !DATE_PATTERN.test(manifest.license.reviewedAt)
            )
        ) {
            pushError(
                errors,
                "MANIFEST_INVALID_LICENSE_REVIEW_DATE",
                "license.reviewedAt",
                "reviewedAt must be YYYY-MM-DD or null."
            );
        }

        if (manifest.status === "approved") {
            if (manifest.license.status !== "verified") {
                pushError(
                    errors,
                    "MANIFEST_APPROVED_SOURCE_LICENSE_NOT_VERIFIED",
                    "license.status",
                    "Approved sources require verified license review."
                );
            }

            for (const field of [
                "commercialUse",
                "transformation",
                "rawRedistribution",
                "derivedRedistribution",
            ]) {
                if (manifest.license[field] === "unknown") {
                    pushError(
                        errors,
                        "MANIFEST_APPROVED_SOURCE_UNKNOWN_PERMISSION",
                        `license.${field}`,
                        `Approved source has unresolved permission: ${field}`
                    );
                }
            }

            for (const field of ["attribution", "licenseNotice"]) {
                if (manifest.license[field] === "unknown") {
                    pushError(
                        errors,
                        "MANIFEST_APPROVED_SOURCE_UNKNOWN_OBLIGATION",
                        `license.${field}`,
                        `Approved source has unresolved obligation: ${field}`
                    );
                }
            }
        }
    }

    validateEnumArray(
        manifest.permittedUses,
        PERMITTED_USES,
        "permittedUses",
        errors,
        manifest.status !== "approved"
    );

    validateStringArray(
        manifest.profiles,
        "profiles",
        errors
    );

    if (!isPlainObject(manifest.transformation)) {
        pushError(
            errors,
            "MANIFEST_INVALID_TRANSFORMATION",
            "transformation",
            "transformation must be an object."
        );
    } else {
        rejectUnknownFields(
            manifest.transformation,
            ["pipelineId", "pipelineVersion", "parameters"],
            "transformation",
            errors
        );

        if (
            typeof manifest.transformation.pipelineId !== "string" ||
            !SOURCE_ID_PATTERN.test(
                manifest.transformation.pipelineId
            )
        ) {
            pushError(
                errors,
                "MANIFEST_INVALID_PIPELINE_ID",
                "transformation.pipelineId",
                "pipelineId must use the source-id format."
            );
        }

        if (
            !Number.isSafeInteger(
                manifest.transformation.pipelineVersion
            ) ||
            manifest.transformation.pipelineVersion < 1
        ) {
            pushError(
                errors,
                "MANIFEST_INVALID_PIPELINE_VERSION",
                "transformation.pipelineVersion",
                "pipelineVersion must be a positive integer."
            );
        }

        if (!isPlainObject(manifest.transformation.parameters)) {
            pushError(
                errors,
                "MANIFEST_INVALID_PIPELINE_PARAMETERS",
                "transformation.parameters",
                "parameters must be a plain object."
            );
        }
    }

    validateApprovedSourceRequirements(manifest, errors);

    return {
        passed: errors.length === 0,
        errors,
    };
}
