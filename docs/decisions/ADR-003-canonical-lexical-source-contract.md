# ADR-003: Canonical Lexical Source Contract and Evidence Model

**Status:** Accepted
**Decision date:** 2026-09-07
**Scope:** Dictionary Modernization - Phase 3

## Context

ADR-001 established a configuration-driven dictionary architecture built
from one canonical lexical system.

ADR-002 established the `general-anagram` profile policy using generated
`core`, `extended`, and `excluded` classifications.

Those decisions require a trustworthy evidence foundation.

The current dictionary tooling does not yet provide a complete reproducible
contract for source identity, versioning, licensing, acquisition, checksum
validation, evidence provenance, source conflicts, or candidate promotion.

Source names alone are insufficient.

A lexical build must be able to explain:

- what sources participated;
- exactly which source versions were used;
- whether their licenses permit the intended WordCabin use;
- how the source files were acquired;
- whether the files match expected checksums;
- how source records became normalized canonical words;
- how conflicting evidence was resolved;
- how the candidate differs from production;
- how the previous production dictionary can be restored exactly.

## Decision

WordCabin will use repository-controlled source manifests and provenance-aware
canonical evidence records as the foundation of dictionary generation.

No source may participate merely because a local file happens to exist.

The required architecture is:

    source manifests
    -> source acquisition and validation
    -> extraction
    -> canonical normalization
    -> evidence enrichment
    -> canonical QA
    -> profile classification
    -> candidate runtime artifacts
    -> candidate-versus-production comparison
    -> solver, build, and performance validation
    -> explicit production promotion

Production promotion remains a separate deliberate action.

## Non-Negotiable Principles

No lexical source may influence candidate generation unless its identity,
role, version, acquisition method, licensing permissions, expected checksum,
permitted WordCabin uses, and deterministic transformation path are
reproducible from repository-controlled metadata.

No generated candidate may overwrite or replace the production dictionary
until its sources, classifications, differences, tests, performance, and
rollback artifacts have been reviewed successfully.

## Rule 1: Source Manifest Contract

Every lexical or supporting source must have a version-controlled manifest.

The manifest must declare at least:

    source id
    source name
    publisher or maintainer
    source role
    exact version or snapshot
    acquisition method
    canonical upstream location
    expected SHA-256
    expected file size or validation rule
    license identifier
    license reference
    attribution requirements
    commercial-use status
    redistribution status
    permitted WordCabin uses
    deterministic transformation recipe

The manifest describes the expected source.

The acquired source must be validated against that manifest before it may
participate in candidate generation.

Machine-specific absolute paths must not define source identity.

## Rule 2: Empty Placeholders Are Not Sources

A missing file, zero-byte placeholder, or stub is not a valid lexical source
unless the manifest explicitly defines that state as expected for a
non-participating source.

Required sources that are missing or unexpectedly empty must block candidate
generation.

A repository placeholder may document where a separately acquired source
belongs, but it must never be interpreted as the source itself.

## Rule 3: Source Roles Are Explicit

Every source must declare its role.

Supported roles may include:

- lexical;
- familiarity;
- game-validity;
- metadata;
- safety;
- supplemental-evidence.

A source role defines what conclusions WordCabin is permitted to derive from
that source.

A familiarity source must not automatically establish lexical validity.

A game-validity source must not automatically establish general-English
validity.

A safety source must not silently remove lexical evidence.

## Rule 4: One Canonical Identity, Many Evidence Records

Each normalized word must have one canonical identity.

Evidence must remain source-specific.

Conceptually:

    canonical word
      -> source evidence A
      -> source evidence B
      -> source evidence C
      -> conflicts
      -> reviewed overrides
      -> profile classifications

Canonical identity must not collapse all evidence into one unexplained
Boolean.

Profile outcomes such as `core`, `extended`, and `excluded` remain derived
decisions rather than replacements for source evidence.

## Rule 5: Evidence Provenance Is Retained

Every material derived lexical claim must be traceable to its provenance.

Where technically and legally feasible, evidence records must retain:

- source id;
- source version;
- source record identity;
- extracted form;
- normalization rule;
- normalized canonical word;
- transformation step;
- build identity.

The system must be able to explain why a word exists in canonical data and
why a profile classified it as it did.

## Rule 6: Hard Failure Conditions

Candidate generation must fail when a required participating source is:

- missing;
- unexpectedly empty;
- checksum-mismatched;
- the wrong version;
- malformed;
- unsupported by its manifest;
- license-unverified;
- commercially incompatible with the intended use;
- redistribution-incompatible with the requested artifact;
- acquired through an undocumented method;
- unauthorized for the requested profile or build.

These conditions are blocking failures, not advisory warnings.

## Rule 7: Licensing Permissions Are Granular

Source licensing must not be represented by a single yes-or-no flag.

The manifest must distinguish, where applicable:

    use allowed
    transformation allowed
    commercial use allowed
    derived output redistribution allowed
    raw source redistribution allowed
    attribution required
    license notice required
    unresolved or unknown

Unknown or unresolved permission relevant to the intended build must block
that source from participating in a production candidate.

Use of a source does not automatically imply permission to redistribute the
raw source or every derived artifact.

## Rule 8: Source Conflicts Survive Normalization

Source disagreement must not disappear during extraction or normalization.

For example:

    source A -> supported lowercase lexical meaning
    source B -> proper-noun-only evidence
    source C -> no entry

must not silently collapse into only:

    valid: true

or:

    valid: false

Candidate evidence must retain the disagreement.

Absence from one source alone is not proof of invalidity when another
approved source provides qualifying lexical evidence.

Profile rules must resolve supported conflicts deterministically.

## Rule 9: Overrides Change Decisions, Not Evidence

Centralized reviewed overrides may alter a profile outcome.

Overrides must never rewrite, conceal, or falsify underlying source evidence.

An override may change:

    general-anagram -> extended

but must not falsely record that a source supplied evidence it did not
supply.

The original evidence and the override decision must remain independently
auditable.

## Rule 10: Candidate Artifacts Are Separate From Production

Candidate generation must not write directly to the active production
dictionary.

The pipeline must generate candidate artifacts separately from:

    src/data/words.js

Production replacement requires an explicit promotion step after successful
review.

Candidate generation and production promotion must be separate operations
with separate validation.

## Rule 11: Every Candidate Build Has a Build Manifest

Every candidate build must have a durable build manifest.

It must identify at least:

    build id
    build timestamp
    repository commit or tool version
    source ids
    source versions
    source checksums
    configuration version
    override version
    profile version
    candidate checksum
    QA result

A future rebuild from the same declared inputs must be independently
reproducible.

Materially different inputs must produce a visibly different build identity.

## Rule 12: Required Audit Artifacts

Candidate generation must produce durable audit artifacts sufficient for
review and rollback.

At minimum, the system must produce:

- source validation report;
- source and license manifest snapshot;
- canonical-data summary;
- source coverage report;
- unresolved-source conflict report;
- override report;
- profile classification counts;
- classification-reason counts;
- candidate runtime artifact;
- candidate-versus-production additions;
- candidate-versus-production removals;
- checksum manifest;
- QA report;
- performance report;
- rollback manifest.

Audit artifacts must remain logically separate from browser-delivered runtime
assets unless a specific product requirement says otherwise.

## Candidate Source Status

SCOWL / English Speller Database and `wordfreq` remain candidate sources.

This ADR does not permanently approve either source merely because the
current repository documentation mentions them or because a previous local
audit used them.

Each source must independently satisfy this ADR before participating in a
production candidate.

Approval requires verification of:

- exact upstream identity;
- exact version or snapshot;
- license terms;
- commercial-use compatibility;
- redistribution permissions;
- attribution requirements;
- acquisition method;
- expected checksum;
- permitted WordCabin use;
- deterministic transformation method.

Historical use is not equivalent to permanent source approval.

## Evidence and Profile Separation

Canonical evidence and profile classification are separate layers.

Canonical evidence answers questions such as:

- which approved sources support the word;
- what source-specific metadata exists;
- whether sources disagree;
- what transformations were applied.

Profile classification answers questions such as:

- whether the word belongs in `general-anagram`;
- whether it is `core`, `extended`, or `excluded`;
- which deterministic profile rules produced that outcome.

Changing one profile must not require rewriting canonical lexical evidence.

## Security and Reliability Constraints

Source acquisition must not trust arbitrary local paths or undeclared files.

Future implementation should prefer:

- manifest-controlled locations;
- explicit path resolution;
- checksum verification before parsing;
- deterministic configuration;
- bounded file handling;
- clear failure messages;
- no silent fallback to unrelated local files.

A source mismatch must fail closed rather than silently continue.

## SEO and Product Implications

Dictionary membership alone does not authorize public SEO claims or indexable
word pages.

Future lexical pages must be based on evidence and profile data that are
sufficiently trustworthy for the claim being presented.

Source provenance should support:

- defensible lexical claims;
- explainable profile membership;
- safe long-tail expansion;
- future vocabulary products;
- future game-specific profiles;
- future educational experiences.

The evidence architecture must scale without duplicating source governance
for each product.

## Consequences

### Benefits

- reproducible dictionary builds;
- stronger licensing governance;
- explicit source authority boundaries;
- explainable word inclusion and exclusion;
- safer source upgrades;
- preserved source conflicts;
- independently auditable overrides;
- safer candidate generation;
- reliable production rollback;
- stronger future SEO and product claims;
- lower long-term maintenance risk.

### Costs

- manifests require maintenance;
- licensing must be reviewed explicitly;
- evidence records increase pipeline complexity;
- candidate builds require more reports;
- source conflicts require durable handling;
- production promotion becomes intentionally more controlled.

These costs are accepted because they prevent significantly more expensive
failures after WordCabin scales.

## Deferred Decisions

This ADR does not approve:

- final SCOWL adoption;
- final `wordfreq` adoption;
- a frequency cutoff;
- familiarity thresholds;
- final source download tooling;
- final canonical storage format;
- final evidence serialization format;
- production dictionary regeneration;
- a runtime schema change;
- a solver ranking change;
- production promotion of any candidate.

Those decisions require separate implementation and validation.

## Implementation Constraint

Approval of this ADR changes source and evidence policy only.

It does not authorize:

- editing `src/data/words.js`;
- regenerating the production dictionary;
- replacing source placeholders with unverified data;
- changing solver behavior;
- changing wildcard scoring;
- changing the runtime dictionary contract;
- deploying a new dictionary;
- promoting a candidate to production.

Implementation must begin with candidate-only infrastructure.

## Acceptance Criteria

D3 is correctly implemented only when:

- every participating source has a validated manifest;
- source identity and version are reproducible;
- source checksums are verified before parsing;
- source licensing permissions are recorded explicitly;
- required unresolved licensing blocks generation;
- unexpected empty sources block generation;
- source roles constrain the claims derived from them;
- canonical word identities retain source-specific evidence;
- evidence provenance survives normalization;
- source conflicts remain visible;
- overrides do not rewrite source evidence;
- candidate generation cannot overwrite production directly;
- every candidate has a build manifest;
- required audit artifacts are generated;
- candidate-versus-production differences are reviewable;
- rollback information is sufficient to restore the previous dictionary;
- SCOWL and `wordfreq` remain unapproved until independently verified;
- production promotion remains a separate deliberate operation.
