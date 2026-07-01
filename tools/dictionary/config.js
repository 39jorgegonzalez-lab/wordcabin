// WordCabin Dictionary Configuration
// Version 1.0

import path from "path";

const dictionarySources = path.resolve(
    "E:/TODO TRABAJO/Z. WEBSITES/5. WORDCABIN/DICTIONARY_SOURCES"
);

export const config = {
    projectName: "WordCabin",

    dictionarySources,

    sourceDictionaryFile: path.join(
        dictionarySources,
        "wordcabin-generated",
        "wordcabin-us-60-alpha.txt"
    ),

    outputDirectory: path.resolve("./tools/dictionary/output"),

    reportsDirectory: path.resolve("./tools/dictionary/reports"),

    productionDictionary: path.resolve("./src/data/words.js")
};

export default config;