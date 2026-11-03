# WordCabin monetization readiness — November 2, 2026

Status: useful public tools and ad-slot groundwork exist; advertising is NOT activated and an ad-serving launch is NOT fully integrated.

## Current implementation

- Centralized GA4 Advanced Consent Mode adapter; `VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95` is public build configuration. Plausible was removed. See GA4_ANALYTICS_PHASE1.md.
- Analytics storage defaults denied; limited cookieless page signals may occur. Product events require grant. Advertising consent remains denied.
- Candidate AdSlot returns nothing unless explicit enabled=true, valid publisher/slot and CMP ID configuration exist. The centralized adapter additionally requires a positive TCF callback from the configured CMP, Google vendor consent, and the selected purpose consents. Missing CMP, missing consent or denied storage keeps ads off. This is internal preparation, not proof of certified CMP operation.
- Leave `VITE_ADSENSE_CLIENT` and `VITE_ADSENSE_PRIMARY_SLOT` empty. Analytics consent must never be treated as advertising consent.
- No ad approval, affiliate relationship, income, or legal certification is claimed.

## Required before advertising activation

1. Owner selects network, accepts terms, and supplies approved publisher/slot information and required business/tax/payment details through the provider, not chat.
2. Install/configure and test the network's applicable certified consent solution. For Google ads, review the current Google-certified CMP/TCF requirements for EEA, UK and Switzerland. The site's analytics preference buttons are not a certified advertising CMP.
3. Update disclosures for actual vendors/operator contact and serve the exact provider-supplied ads.txt entry if required. Do not invent publisher IDs or contact details.
4. Validate ID formats, test asynchronous ad fill/failure, reserved-space layout, narrow screens, consent refusal/revocation, and ensure no overlap or misleading proximity to word-result buttons.
5. Owner approves the production activation after Preview evidence. Account approval alone is not technical integration completion.

## Placement and alternatives

Keep any future labeled display placement after the tool's useful content, away from input/reset/result-copy controls. Reserve predictable dimensions; avoid overlays and auto ads until separately reviewed. Monitor layout shift and loading cost before expansion.

Relevant word-game/book affiliate links or sponsorship may be evaluated after actual demand appears; disclose relationships. Premium accounts/subscriptions are deferred and unnecessary for this release. No paid services or applications were initiated.

## Sources checked November 2, 2026

- https://support.google.com/adsense/answer/9724?hl=en — original useful content and account eligibility.
- https://support.google.com/adsense/answer/13554116?hl=en — publisher CMP requirements.
- https://support.google.com/adsense/answer/7670013?hl=en — CMP management.

External network approval and first revenue are not closure gates; an essential advertising-consent integration remains work if active display advertising is selected as the release requirement.

## Candidate adapter contract

Existing code targets Google AdSense; an approved owner account/provider choice has not been established. The adapter is specific preparation for that existing implementation, not a claim of account approval. Configuration: VITE_ADS_ENABLED=false by default; VITE_ADSENSE_CLIENT and VITE_ADSENSE_PRIMARY_SLOT blank; VITE_ADS_CMP_ID blank. No live IDs were supplied or activated. Test-only IDs occur only in tests.

If separately approved later: install the actual Google-certified CMP’s reviewed bootstrap; provide its exact CMP ID and approved publisher/slot values. The adapter waits up to 30 seconds for TCF API availability and otherwise remains off. It requires vendor 755 and purposes 1,2,7,9,10 consent without publisher restrictions. This deliberately conservative global opt-in rule is not a legal compliance certification and may withhold some otherwise permissible ads. Analytics permission never grants advertising permission; GA4 advertising consent remains denied.

One async AdSense script is loaded only after eligible consent. Nonpersonalized treatment is requested; nonpersonalized does not mean cookieless. Duplicate slot requests are suppressed. A local opt-out is stored separately at wordcabin.ads-disabled.v1. Withdrawal blocks requests and reloads the document to destroy an already running third-party runtime; removing a script tag alone would not stop it. Reload can interrupt an unfinished game and must be disclosed/tested with the actual provider. Previously transmitted requests cannot be recalled. Cross-tab withdrawal is handled. Actual third-party network cessation is owner/Preview verification, not established by mocked unit tests.

Reserved placement and 44px controls are implemented; real ad fill, CLS and narrow-width review remain external activation gates. Google may change requirements; recheck official provider guidance at activation. No live ads are required for this infrastructure release.
