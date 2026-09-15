# WordCabin Monetization Readiness

**Status:** Site-side preparation complete; external activation requires owner action.

## Implemented

- Privacy-friendly aggregate analytics loader, disabled unless `VITE_PLAUSIBLE_DOMAIN` is configured.
- Responsive AdSense slot and script loader, disabled unless both publisher and slot IDs are configured.
- No empty advertisement container when advertising is disabled.
- Visible advertisement labeling and advertising standards.
- Privacy disclosure covering current solver behavior and optional future analytics/advertising.
- Homepage links to privacy, advertising, and the three existing SEO growth pages.
- Sitemap coverage and automated foundation checks.

## Owner activation gates

1. Select and open an analytics account, then set `VITE_PLAUSIBLE_DOMAIN` if Plausible is selected.
2. Apply to an advertising network only after reviewing its contract, tax, payment, consent, and privacy requirements.
3. If AdSense is approved, provide the exact `VITE_ADSENSE_CLIENT` and `VITE_ADSENSE_PRIMARY_SLOT` values.
4. Review the disclosure pages for the owner's actual business identity, jurisdiction, contact method, and chosen vendors before advertising goes live.
5. Authorize a production deployment separately.

No advertising or third-party analytics is activated by the repository defaults.
