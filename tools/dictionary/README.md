# WordCabin Dictionary System

## Purpose

This folder contains the tools used to generate WordCabin's production dictionary.

The dictionary is NOT maintained manually.

It is generated automatically from vetted sources.

## Goals

- Professional-quality vocabulary
- 150,000–250,000 words
- Fast performance
- Consistent output
- Easy future updates
- Minimal maintenance

## Planned Sources

### SCOWL
- Primary vocabulary backbone
- Clean English word lists
- Size target: 70–80

### wordfreq
- Frequency ranking
- Identifies common words
- Allows prioritization of useful vocabulary

## Include

- Common English words
- Educational vocabulary
- Word-game vocabulary
- Plurals
- Verb forms
- 2–15 letter words
- Scrabble support
- Wordle support

## Exclude

- Names
- Cities
- Brands
- Heavy slang
- Apostrophes
- Hyphenated words
- Extremely obscure junk

## Final Word Format

Example:

{
    w: "triangle",
    common: true,
    length: 8,
    score: 9,
    rank: 14822
}

## Generation Process

1. Import source lists.
2. Normalize to lowercase letters.
3. Filter to 2–15 letters.
4. Remove duplicates.
5. Remove junk.
6. Add metadata.
7. Export src/data/words.js.
8. Produce QA reports.

## Benchmark Tests

Expected words should include examples such as:

Input: triangle
- triangle
- integral
- altering
- alerting
- retain
- retina
- linear
- tailer

Additional tests:
- listen
- silent
- education
- mortgage
- calculator
- cabinet