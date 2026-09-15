export const PRODUCTION_WRITE_CONFIRMATION = "WORDCABIN_PRODUCTION_WRITE_APPROVED";

export function assertProductionWriteAuthorized(environment = process.env) {
    if (environment.WORDCABIN_ALLOW_PRODUCTION_DICTIONARY_WRITE !== PRODUCTION_WRITE_CONFIRMATION) {
        throw new Error(
            "Production dictionary generation is locked. Complete source approval and set WORDCABIN_ALLOW_PRODUCTION_DICTIONARY_WRITE=WORDCABIN_PRODUCTION_WRITE_APPROVED only for an authorized production rebuild."
        );
    }
}
