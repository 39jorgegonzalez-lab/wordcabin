import assert from "node:assert/strict";
import { assertProductionWriteAuthorized, PRODUCTION_WRITE_CONFIRMATION } from "./production-write-guard.js";

assert.throws(() => assertProductionWriteAuthorized({}), /generation is locked/);
assert.throws(() => assertProductionWriteAuthorized({ WORDCABIN_ALLOW_PRODUCTION_DICTIONARY_WRITE: "yes" }), /generation is locked/);
assert.doesNotThrow(() => assertProductionWriteAuthorized({
    WORDCABIN_ALLOW_PRODUCTION_DICTIONARY_WRITE: PRODUCTION_WRITE_CONFIRMATION,
}));
console.log("PASS: production dictionary writes fail closed without exact authorization");
