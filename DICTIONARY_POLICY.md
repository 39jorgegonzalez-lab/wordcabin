# WordCabin Dictionary Inclusion Policy

**Version:** 1.0
**Status:** Active

---

# Purpose

The WordCabin dictionary exists to provide the most trustworthy, useful, and educational word database for word games, vocabulary discovery, and language learning.

The objective is **not** to contain the largest number of words.

The objective is to contain the **highest quality collection of words** for our users.

When quality and quantity conflict, quality always wins.

---

# Core Principles

Every word included in WordCabin should improve one or more of the following:

* User trust
* Search quality
* Educational value
* Word-game usefulness
* Long-term maintainability

Words are included because they provide value—not simply because they exist.

---

# Primary Sources

WordCabin should generate its production dictionary from trusted, well-maintained sources.

Primary sources include:

* SCOWL / English Speller Database (ESDB)
* wordfreq frequency data

Additional sources may be considered only after review.

No source should be added solely to increase word count.

---

# Include

The production dictionary should include:

## General English

* Common English vocabulary
* Everyday language
* Academic vocabulary
* Educational vocabulary

## Word Game Vocabulary

* Scrabble-valid words (where appropriate)
* Wordle-compatible words
* Common anagrams
* Frequently searched puzzle words

## Grammar

* Singular nouns
* Plural nouns
* Verb forms
* Adjectives
* Adverbs
* Common participles

## Length

Words between:

**2 and 15 letters**

unless future products require otherwise.

---

# Exclude

The production dictionary should exclude content that reduces trust or usefulness.

Unless there is a compelling reason, exclude:

* Personal names
* First names
* Last names
* Cities
* Countries
* Companies
* Brands
* Product names
* Domain names
* URLs
* Email addresses
* Abbreviations
* Acronyms
* Chemical formulas
* Hyphenated words
* Apostrophes
* Numbers
* Roman numerals
* Symbols
* File extensions

---

# Sensitive Content

WordCabin is intended to be useful for families, schools, students, and the general public.

By default, exclude:

* Hate speech
* Racial slurs
* Extreme profanity
* Explicit sexual terms
* Harassment terms

Mild profanity may be reviewed separately if needed for word-game compatibility.

User trust takes priority.

---

# Obsolete and Extremely Rare Words

Not every valid dictionary word belongs in WordCabin.

Words that are:

* obsolete
* archaic
* historically obscure
* extremely rare

should only be included if they provide meaningful value for word-game users.

Frequency data should guide these decisions.

---

# International English

Support both:

* American English
* British English

where practical.

Document major spelling differences.

Examples:

* color / colour
* organize / organise
* theater / theatre

---

# Metadata Requirements

Every production word should contain metadata.

Minimum fields:

```json
{
  "w": "triangle",
  "common": true,
  "length": 8,
  "score": 9,
  "rank": 14822
}
```

Future metadata may include:

* frequency percentile
* part of speech
* source
* language variant
* difficulty level

---

# Quality Standards

Every generated dictionary must:

* remove duplicates
* normalize case
* contain letters only
* filter invalid entries
* generate metadata
* produce QA reports

Generation must be reproducible.

---

# Benchmark Validation

Every production build should successfully return expected results for benchmark inputs.

Examples include:

* triangle
* listen
* silent
* education
* mortgage
* calculator
* cabinet

Failure to satisfy benchmark tests blocks deployment.

---

# SEO Principles

WordCabin's dictionary directly affects search quality.

The dictionary should support:

* accurate search results
* high-quality landing pages
* educational content
* topical authority

Artificially increasing word count without user value is prohibited.

---

# Monetization Principles

Revenue should never determine whether a word is included.

Dictionary quality exists to:

* improve user trust
* increase return visitors
* strengthen search rankings
* support premium features
* increase long-term business value

The dictionary is a strategic asset—not merely a data file.

---

# Review Policy

Major changes to inclusion rules require review before implementation.

Every significant change should document:

* reason
* expected impact
* affected users
* testing performed

---

# Guiding Principle

WordCabin is committed to publishing the highest-quality practical English word database possible.

Every word should make the product more useful.

No word should reduce user trust.
