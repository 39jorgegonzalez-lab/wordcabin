// --------------------------------------------------
// WordCabin Dictionary Discovery Module
// --------------------------------------------------

import fs from "fs";
import path from "path";

export function discoverDictionary(sourcePath) {

    console.log("");
    console.log("=================================");
    console.log("Dictionary Discovery");
    console.log("=================================");

    const items = fs.readdirSync(sourcePath);
    const report = {
    root: "",
    folders: [],
    files: []
};

    console.log("");
    console.log(`Found ${items.length} item(s):`);
    console.log("");

    items.forEach(item => {
        console.log("- " + item);
    });

const wordlistFolder = items.find(item => item === "wordlist-2");

if (wordlistFolder) {

    console.log("");
    console.log("Entering wordlist-2...");
    console.log("");

    const wordlistPath = path.join(sourcePath, wordlistFolder);

    let currentPath = wordlistPath;
let contents = fs.readdirSync(currentPath);

// Automatically step through wrapper folders
while (contents.length === 1) {

    const onlyItem = contents[0];
    const nextPath = path.join(currentPath, onlyItem);

    if (!fs.statSync(nextPath).isDirectory()) {
        break;
    }

    console.log("");
    console.log(`Entering ${onlyItem}...`);

    currentPath = nextPath;
    contents = fs.readdirSync(currentPath);

}

report.root = currentPath;

    contents.forEach(item => {

    const fullPath = path.join(currentPath, item);

    if (fs.statSync(fullPath).isDirectory()) {

        report.folders.push(item);

        console.log("📁 " + item);

    } else {

        report.files.push(item);

        console.log("📄 " + item);

    }

});

}

return report;

}