import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function extractSourceFile(sourceFile) {
    if (
        typeof sourceFile !== "string" ||
        sourceFile.trim().length === 0
    ) {
        throw new Error(
            "Source extraction failed: sourceFile is required."
        );
    }

    if (!path.isAbsolute(sourceFile)) {
        throw new Error(
            "Source extraction failed: sourceFile must be absolute."
        );
    }

    if (!fs.existsSync(sourceFile)) {
        throw new Error(
            `Source extraction failed: file not found at ${sourceFile}`
        );
    }

    const stats = fs.statSync(sourceFile);

    if (!stats.isFile()) {
        throw new Error(
            `Source extraction failed: expected a regular file at ${sourceFile}`
        );
    }

    const sourceBytes =
    fs.readFileSync(sourceFile);

if (sourceBytes.length === 0) {
    throw new Error(
        "Source extraction failed: source file is empty."
    );
}

const sha256 =
    crypto
        .createHash("sha256")
        .update(sourceBytes)
        .digest("hex")
        .toUpperCase();

const content =
    sourceBytes.toString("utf8");

    const words = content
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (words.length === 0) {
        throw new Error(
            "Source extraction failed: source contains no non-empty records."
        );
    }

    return {
        sourceFile,
        sourceFileName: path.basename(sourceFile),
        sizeBytes: sourceBytes.length,
        sha256,
        wordCount: words.length,
        sampleWords: words.slice(0, 40),
        words,
    };
}
