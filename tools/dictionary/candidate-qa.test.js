import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
    extractSourceFile,
} from "./extract-source-file.js";

import {
    normalizeWords,
} from "./normalize.js";

import {
    runCandidateStructuralQA,
} from "./candidate-qa.js";

const tempRoot = fs.mkdtempSync(
    path.join(
        os.tmpdir(),
        "wordcabin-candidate-qa-"
    )
);

try {
    const sourcePath =
        path.join(tempRoot, "source.txt");

    fs.writeFileSync(
        sourcePath,
        "beta\nalpha\nalpha\ngamma\n",
        "utf8"
    );

    const extracted =
        extractSourceFile(sourcePath);

    assert.equal(
        extracted.wordCount,
        4
    );
assert.equal(
    extracted.sizeBytes,
    Buffer.byteLength(
        "beta\nalpha\nalpha\ngamma\n",
        "utf8"
    )
);

const expectedExtractedSha256 =
    crypto
        .createHash("sha256")
        .update(
            Buffer.from(
                "beta\nalpha\nalpha\ngamma\n",
                "utf8"
            )
        )
        .digest("hex")
        .toUpperCase();

assert.equal(
    extracted.sha256,
    expectedExtractedSha256
);

console.log(
    "PASS: extraction reports exact source byte size and SHA-256"
);
    assert.deepEqual(
        extracted.words,
        [
            "beta",
            "alpha",
            "alpha",
            "gamma",
        ]
    );

    console.log(
        "PASS: explicit source file extracted"
    );

    assert.throws(
        () => extractSourceFile("relative.txt"),
        /must be absolute/
    );

    console.log(
        "PASS: relative source path rejected"
    );

    const normalized =
        normalizeWords(extracted);

    assert.deepEqual(
        normalized.words,
        [
            "alpha",
            "beta",
            "gamma",
        ]
    );

    console.log(
        "PASS: existing normalization produces deterministic unique ordering"
    );

    const goodQa =
        runCandidateStructuralQA(normalized);

    assert.equal(goodQa.passed, true);
    assert.equal(goodQa.wordCount, 3);
    assert.equal(goodQa.invalidWordCount, 0);
    assert.equal(goodQa.duplicateWordCount, 0);
    assert.equal(
        goodQa.sortedAlphabetically,
        true
    );

    console.log(
        "PASS: normalized candidate passes structural QA"
    );

    const duplicateQa =
        runCandidateStructuralQA({
            words: [
                "alpha",
                "alpha",
                "beta",
            ],
        });

    assert.equal(
        duplicateQa.passed,
        false
    );

    assert.equal(
        duplicateQa.duplicateWordCount,
        1
    );

    console.log(
        "PASS: duplicate candidate words fail structural QA"
    );

    const invalidQa =
        runCandidateStructuralQA({
            words: [
                "alpha",
                "Beta",
            ],
        });

    assert.equal(
        invalidQa.passed,
        false
    );

    assert.equal(
        invalidQa.invalidWordCount,
        1
    );

    console.log(
        "PASS: invalid candidate word fails structural QA"
    );

    const unsortedQa =
        runCandidateStructuralQA({
            words: [
                "beta",
                "alpha",
            ],
        });

    assert.equal(
        unsortedQa.passed,
        false
    );

    assert.equal(
        unsortedQa.sortedAlphabetically,
        false
    );

    console.log(
        "PASS: unsorted candidate fails structural QA"
    );

    const emptyQa =
        runCandidateStructuralQA({
            words: [],
        });

    assert.equal(
        emptyQa.passed,
        false
    );

    assert.equal(
        emptyQa.emptyWordSet,
        true
    );

    console.log(
        "PASS: empty candidate fails structural QA"
    );

    assert.throws(
        () =>
            runCandidateStructuralQA(
                null
            ),
        /words array/
    );

    console.log(
        "PASS: malformed QA input rejected"
    );

    console.log(
        "=== CANDIDATE_QA_TESTS_COMPLETE ==="
    );
} finally {
    fs.rmSync(
        tempRoot,
        {
            recursive: true,
            force: true,
        }
    );
}
