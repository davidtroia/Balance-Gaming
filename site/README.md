# Balance Digital studio website

One-page site for aggregator, RGS and operator partners. Plain HTML and CSS with no build step: `index.html` plus `assets/`.

Preview locally from the repo root with `npm run demo`, then open http://localhost:8080/site/.

## Before it goes live

- [ ] **Email address.** The contact section shows `partners@balancedigital.games`. That address does not exist yet. Change it in `index.html` (search for `partners@`) if you pick a different domain, and set up the mailbox first.
- [ ] **Founder line.** Confirm the wording "20 years in music, 150 major releases and more than 220 million streams".
- [ ] **Status list.** Update the pills in the "Where we are" section as each step closes (partner signed, lab submission, licenses).
- [ ] **Social preview.** `og:image` is a relative path. Change it to the full URL (for example `https://balancedigital.games/assets/og-image.jpg`) once the domain is live so link previews show the image.

## Domain options

Checked with GoDaddy's availability search on 2026-11-07. Availability changes daily, so check again before buying. GoDaddy did not return prices; the ranges below are typical first-year prices and renewals can be higher. Confirm at checkout.

| Domain | Available | Notes |
|---|---|---|
| **balancedigital.games** | Yes | Recommended. Exact company name, and the extension says what you make. About $20 to $40 a year. |
| **balancedigitalgames.com** | Yes | Recommended as a second domain that forwards to the first, since many people type .com by habit. About $10 to $25 a year. |
| balancedigital.studio | Yes | Good alternative to .games. About $25 to $40 a year. |
| balancegaming.com | Yes | Matches the project name. Worth holding if you plan to use "Balance Gaming" as a label. |
| balancedigital.com | **No** | Already registered by someone else. |

Registrar: Cloudflare Registrar sells at cost with no markup and free privacy. GoDaddy and Namecheap also work; turn off paid add-ons you don't need at checkout.

## Hosting

**Cloudflare Pages, free plan.** Connect the GitHub repo, set the build output directory to `site`, leave the build command empty, then add the custom domain. HTTPS is automatic. Every push to `main` redeploys.

GitHub Pages also works but needs a paid GitHub plan for a private repo. Netlify's free plan works the same way as Cloudflare Pages.

## Business email

**Google Workspace Business Starter**, about $7 to $8.40 per user per month depending on annual or monthly billing. You get Gmail on your own domain, and you can add `partners@`, `hello@` and `david@` as free aliases of one mailbox, so it costs one seat.

After you add the domain in Workspace, add the DNS records it gives you (MX, plus SPF and DKIM), and add a DMARC record such as `v=DMARC1; p=quarantine; rua=mailto:david@yourdomain`. Without SPF, DKIM and DMARC, mail to operators is likely to land in spam.

Cheaper option: Microsoft 365 Business Basic at about $6 per user per month. Cheapest: Cloudflare Email Routing forwards mail to your Gmail for free, but replying from the business address takes extra setup and looks less polished.

## Estimated cost

| Item | Year one |
|---|---|
| Two domains | about $30 to $65 |
| Hosting (Cloudflare Pages) | $0 |
| Google Workspace, one user | about $84 to $101 |
| **Total** | **about $115 to $165** |
