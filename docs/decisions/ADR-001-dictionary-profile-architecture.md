# ADR-001: Dictionary Profile Architecture

**Status:** Accepted
**Decision date:** 2026-07-17
**Scope:** Dictionary Modernization - Phase 1

## Context

WordCabin currently uses one production dictionary for general anagrams,
word-game assistance, vocabulary discovery, and future word products.

These products do not share identical inclusion, ranking, safety, licensing,
or performance requirements.

Maintaining one universal dictionary would create increasing exceptions and
mix everyday vocabulary with specialist or product-specific words.

## Decision

WordCabin will use one shared canonical lexical dataset that generates
separate product-specific runtime dictionary profiles.

The initial planned profiles are:

- `general-anagram`
- `word-game`
- `wordle-style`

Presentation safety will be centralized metadata and configuration, not an
independently maintained replacement word list.

## Non-Negotiable Condition

The system must be configuration-driven.

The required architecture is:

```text
canonical lexical data
+ versioned source manifests
+ deterministic profile configuration
+ centralized reviewed overrides
-> generated runtime dictionaries
```

The following approaches are prohibited:

- separately maintaining three word lists;
- manually copying words between product profiles;
- treating generated runtime dictionaries as source data;
- using production output as the sole source of classifications;
- scattering unexplained profile exceptions across the codebase.

## Canonical Identity

Each normalized word must have one canonical identity.

Profile membership must come from approved source metadata, deterministic
configuration rules, or a centralized reviewed override.

Every membership or exclusion decision must be auditable.

## Runtime Outputs

Runtime dictionaries are generated artifacts and must:

- be reproducible from declared inputs;
- contain only fields required by their product;
- be independently testable and reversible;
- never be edited manually.

The current solver compatibility shape remains:

```javascript
{
  w: "triangle",
  common: true
}
```

Changing that runtime contract requires a separate tested decision.

## Source Requirements

Every source must have:

- a stable identifier;
- a pinned version or snapshot;
- a verified checksum;
- documented licensing and attribution;
- an approved product purpose;
- a reproducible acquisition and transformation method.

Missing, empty, unlicensed, or checksum-mismatched sources must block
candidate generation.

## Generation Safety

Candidate generation must not overwrite production directly.

The required flow is:

```text
source validation
-> extraction
-> normalization and policy filtering
-> metadata enrichment
-> source QA
-> candidate generation
-> candidate comparison
-> solver and build validation
-> explicit production promotion
```

Production promotion must remain a separate deliberate action.

## Consequences

### Benefits

- clearer validity rules for each product;
- safer source and licensing boundaries;
- smaller product-specific runtime payloads;
- more accurate UX and SEO claims;
- independent QA and rollback;
- lower long-term exception-driven maintenance.

### Costs

- moderate initial pipeline complexity;
- additional profile configuration and QA;
- source and classification governance;
- controlled migration work before production changes.

These costs are accepted because they are automatable and lower than the
long-term cost of one ambiguous universal dictionary.

## Implementation Constraint

Approval of this ADR does not authorize immediate production dictionary
regeneration.

The first implementation must preserve current production behavior while
building and validating candidate artifacts separately.

## Acceptance Criteria

D1 is correctly implemented only when:

- one canonical lexical system exists;
- runtime profiles are generated rather than manually maintained;
- profile rules are versioned and deterministic;
- overrides are centralized and auditable;
- sources are licensed, pinned, and checksum-verified;
- candidate generation cannot overwrite production automatically;
- conflicting manual definitions fail QA;
- each profile has independent tests and reports;
- existing solver behavior remains protected;
- rollback to the previous production dictionary is documented and tested.
