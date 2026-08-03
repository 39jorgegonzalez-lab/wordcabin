# ADR-002: General-Anagram Profile Policy

**Status:** Accepted
**Decision date:** 2026-08-02
**Scope:** Dictionary Modernization - Phase 2

## Context

ADR-001 established that WordCabin will generate product-specific runtime
dictionary profiles from one shared canonical lexical dataset.

The first profile requiring a precise policy is `general-anagram`.

The current production dictionary combines familiar words with rare,
technical, regional, dialectal, archaic, one-letter, and longer-than-
documented entries.

A binary included-or-excluded policy would create two unacceptable risks:

- obscure vocabulary could dominate ordinary solver results;
- aggressive filtering could remove valid and useful vocabulary.

The profile therefore requires classifications that improve default result
quality without destructively discarding defensible words.

## Decision

The `general-anagram` profile will generate three classifications:

- `core`
- `extended`
- `excluded`

These are generated profile outcomes from one canonical lexical dataset.
They are not separately maintained word lists.

The required architecture is:

    canonical lexical data
    + versioned source manifests
    + approved source evidence
    + deterministic profile configuration
    + centralized reviewed overrides
    -> generated core / extended / excluded classifications
    -> general-anagram runtime profile

## Core

A word is `core` when it:

- passes structural, lexical-evidence, and profile eligibility rules;
- has a supported lowercase lexical meaning;
- represents modern general English, everyday or educational vocabulary,
  a common inflection, or a reviewed US or UK variant;
- is suitable for prominent default solver presentation.

`core` controls default prominence. It does not define all lexical validity.

## Extended

A word is `extended` when it:

- passes structural, lexical-evidence, and profile eligibility rules;
- has defensible lexical support;
- is valid but comparatively rare, specialist, technical, regional,
  dialectal, archaic, or less familiar;
- should remain available without dominating ordinary default results.

`extended` is a first-class runtime classification.

An `extended` word must:

- remain in the generated runtime profile;
- remain searchable and returnable by the solver;
- remain explicitly distinguishable from `core`;
- support ranking, filtering, grouping, and labeling;
- retain traceable evidence and classification reasons;
- be protected against accidental removal during generation.

`extended` is not:

- a hidden holding area;
- a temporary rejection category;
- an alias for `excluded`;
- a list awaiting eventual deletion.

When lexical validity is supported but familiarity is uncertain, the
conservative fallback classification is `extended`.

## Excluded

A word is `excluded` from `general-anagram` when it:

- fails structural validation;
- lacks sufficient approved lexical evidence;
- is abbreviation-only or acronym-only under the approved policy;
- is proper-noun-only under approved evidence;
- contains unsupported symbols, numbers, hyphens, or apostrophes;
- falls outside the configured profile length range;
- fails another deterministic profile rule;
- is excluded by a valid centralized reviewed override.

`excluded` is a profile result. It does not require deletion from canonical
lexical data.

Every exclusion must retain supporting evidence and a stable,
machine-readable reason code.

## Decision Precedence

Classification must follow this precedence:

1. canonical record and structural validity;
2. approved source authorization and lexical evidence;
3. mandatory profile eligibility rules;
4. centralized reviewed overrides;
5. generated familiarity, register, and domain signals;
6. separate presentation-safety handling;
7. conservative fallback behavior.

Malformed records, invalid canonical identities, unapproved sources, and
failed source verification cannot be repaired by an ordinary word override.

Mandatory profile rules must be changed through reviewed configuration, not
through scattered word-specific exceptions.

Source disagreements must not be resolved silently. Candidate artifacts must
record the relevant evidence, applied rule, and final classification.

Supported lexical validity with uncertain familiarity defaults to
`extended`.

Insufficient lexical evidence results in `excluded` with an explicit
unresolved-evidence reason.

## Configurable Length Rule

The initial `general-anagram` runtime range is:

    minimum length: 2
    maximum length: 15
    bounds: inclusive

This is a configurable profile rule, not a universal canonical-data rule.

Valid one-letter words and valid words longer than 15 letters may remain in
canonical data for other profiles and future products.

Out-of-range exclusions must use explicit reason codes such as:

    PROFILE_LENGTH_BELOW_MINIMUM
    PROFILE_LENGTH_ABOVE_MAXIMUM

Changing the range requires reviewed profile configuration and new candidate
validation. It must not require editing canonical source data.

## Proper-Name Policy

A lowercase word must not be excluded merely because it can also be:

- a personal name;
- a surname;
- a place name;
- a brand name.

It is excluded only when approved evidence supports proper-noun-only usage
and does not support an eligible lowercase common meaning.

Capitalization alone is insufficient evidence.

## Individual-Word Policy

No disputed word, including `qi`, will be hard-coded as included or excluded
merely because a particular word game accepts or rejects it.

Membership must follow approved lexical evidence, deterministic profile
rules, and documented centralized overrides.

Game-specific validity alone is insufficient for `general-anagram`.

## Familiarity Policy

Familiarity may help distinguish `core` from `extended`, but this decision
does not approve a frequency source, band, threshold, or cutoff.

Those decisions remain deferred until:

- licensing and redistribution rights are verified;
- source coverage is measured;
- representative vocabulary is tested;
- regional and specialist bias is evaluated;
- missing-frequency behavior is defined;
- classification stability is measured.

Frequency must not be the sole test of lexical validity.

The inherited production `common` Boolean may remain temporarily for
compatibility, but it is not the long-term authoritative classification
source.

## Presentation Safety

Lexical validity and presentation safety are separate dimensions.

Sensitive vocabulary must not be destructively removed from canonical data
solely because it may require restricted presentation.

Future presentation outcomes may include:

- allowed normally;
- hidden in family-safe presentation;
- shown with a warning;
- restricted to a particular profile or mode.

Safety metadata and rules must remain centralized and independently
auditable.

A presentation-safety decision must not silently rewrite lexical evidence.

## Centralized Overrides

All word-level overrides must live in one version-controlled and
machine-validated configuration source.

Each override must include:

    word
    profile
    resulting classification
    reason code
    human-readable explanation
    supporting evidence or source reference
    date added
    reviewer
    optional review or expiry date

Validation must reject:

- duplicate overrides;
- contradictory overrides;
- unknown profiles or classifications;
- missing reasons or required evidence;
- overrides for invalid canonical identities;
- scattered word-specific rules in solver or generator code.

Overrides change profile outcomes. They must not conceal or rewrite source
evidence.

Repeated overrides sharing the same cause indicate that the governing rule
must be reviewed instead of expanding the exception list indefinitely.

## Runtime Compatibility

Both `core` and `extended` must be emitted as valid runtime results.

The runtime system must preserve a queryable distinction between them so
future UX and ranking decisions can use the classification.

The current production compatibility shape remains:

    {
      w: "triangle",
      common: true
    }

A separately validated compatibility phase may temporarily map:

    core     -> common: true
    extended -> common: false
    excluded -> not emitted

That temporary mapping is acceptable only while:

- every valid `extended` word remains emitted;
- candidate artifacts retain the explicit classification;
- classification evidence is not lost;
- solver behavior remains regression-tested;
- migration remains reversible.

This ADR does not authorize a production runtime-schema change.

A permanent replacement for `common` requires a separate tested decision.

## SEO and Product Boundaries

Preserving valid `extended` vocabulary supports:

- broader solver coverage;
- educational vocabulary discovery;
- specialist and advanced-user use cases;
- future product profiles;
- defensible long-tail lexical opportunities.

Dictionary membership does not automatically authorize an indexable SEO
page.

Indexing decisions remain subject to separate content-quality, uniqueness,
search-intent, and internal-linking requirements.

## Consequences

### Benefits

- familiar words can receive stronger default prominence;
- valid uncommon vocabulary remains available;
- exclusions become explainable and auditable;
- destructive over-filtering is avoided;
- future ranking and filtering gain reliable classification data;
- canonical data can support products with different length limits;
- future profiles do not require duplicated word lists;
- solver coverage and future product flexibility are preserved.

### Costs

- candidate artifacts require richer metadata;
- classification reasons require durable reporting;
- overrides require governance and validation;
- familiarity calibration requires later source research;
- runtime compatibility requires a controlled migration;
- first-class `extended` support requires future UX decisions.

These costs are accepted because they create a more reliable and scalable
system than either one undifferentiated dictionary or aggressive permanent
removal.

## Deferred Decisions

This ADR does not approve:

- a frequency dataset or exact familiarity thresholds;
- a permanent replacement for `common`;
- final sensitive-word presentation defaults;
- a production runtime-schema change;
- a solver ranking change;
- production dictionary regeneration;
- final source adoption or licensing contracts;
- separately maintained profile word lists;
- unexplained individual-word exceptions;
- direct production output from candidate generation.

## Implementation Constraint

Approval of this ADR changes policy only.

It does not authorize:

- editing `src/data/words.js`;
- regenerating the production dictionary;
- changing solver ranking;
- changing wildcard scoring;
- modifying the production runtime contract;
- promoting candidate output to production.

The first implementation must generate candidate artifacts separately and
preserve exact rollback to the previous production dictionary.

## Acceptance Criteria

D2 is correctly implemented only when:

- `core`, `extended`, and `excluded` are generated deterministically;
- separately maintained profile word lists do not exist;
- every emitted word has a valid canonical identity;
- every exclusion has a stable reason code;
- every classification is traceable to evidence and rules;
- `extended` remains emitted, searchable, and distinguishable;
- valid familiarity-uncertain words default to `extended`;
- the 2-15 range is profile configuration;
- out-of-range words can remain canonical;
- proper-noun-only decisions use approved evidence;
- sensitive status remains separate from lexical validity;
- overrides are centralized, validated, and evidence-backed;
- duplicate and contradictory overrides fail QA;
- source licenses, versions, and checksums are verified;
- candidate-versus-production differences are reported;
- `core` and `extended` distributions are reported;
- protected benchmark words and everyday vocabulary are tested;
- solver return structure remains protected;
- wildcard scoring remains query-dependent;
- solver tests and the application build pass;
- bundle-size and query-performance effects are measured;
- SEO coverage changes are reviewed;
- rollback restores the exact previous production dictionary.
