# WordCabin launch package

Domain: wordcabin.com
Tagline: Unscramble words in a cozy little corner.

## What is included

- `index.html` — homepage and word unscrambler
- `styles.css` — cozy cabin visual style
- `app.js` — browser-based unscrambler logic
- `words.js` — starter English word list
- `vercel.json` — Vercel static hosting config
- SEO-friendly basic metadata
- No database
- No user accounts
- No external API required

## Why this is low-maintenance

This version is intentionally simple:
- static files only
- no backend server
- no login system
- no database
- no third-party word API

That means fewer things can break.

## Deployment on Vercel

1. Create a free Vercel account.
2. Create a new project.
3. Upload/import this folder.
4. Deploy.
5. Add the domain `wordcabin.com` in Vercel project settings.
6. Vercel will show DNS records.
7. Add those DNS records inside Namecheap.
8. Wait for DNS propagation.

## Monthly review checklist

Once per month:
- Check traffic in Vercel Analytics or Google Search Console.
- Test the homepage on phone and desktop.
- Try 10 sample searches.
- Review which pages or terms are getting impressions.
- Decide whether to add more dictionary words, SEO pages, or features.

## Important launch note

The included word list is a starter list suitable for testing and first launch. For stronger game coverage, replace `words.js` later with a larger curated dictionary.
