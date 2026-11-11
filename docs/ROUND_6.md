# Round 6 — UX structure and data foundations

Version 0.6.0 · 11 November 2026. Implements the agreed Round 6, leaving full supplier catalogs, pricing models, aggregation rules, and continuous feeds for rounds 7–10.

## Reviewable experience

The main navigation remains five destinations: overview, policies, retirement, club, explore. Existing service URLs remain live and highlight Explore. Account and Knowledge remain available from the header.

| Area | New routes / behavior |
| --- | --- |
| Policies | `#/policies` retains all owned-policy tracking and payment controls. A new “ค้นหาแผนใหม่” tab opens `#/policies/discover`; `…/aia` and `…/mtl` show example provider data slots. Search supports company names and สะสมทรัพย์/ออมทรัพย์. Endowment has two provider examples; other categories show an honest empty state. Members can keep one interested company in the new journey. |
| Explore | `#/explore`, `#/explore/housing/jin`, `…/aspen`. Official-project reference photos, source links, location, and pending package prices. Selecting a residence sets a planning target and opens the future-goal step; no booking is made. The second Explore tab opens existing private services. |
| Retirement | `#/retirement` now starts the new future journey; explicit `#/retirement/goal` and `#/retirement/calculator` retain the existing live tools. Three tool tabs make this distinction visible. |
| Future journey | `#/retirement/future/goal`, `/sources`, `/summary`. Choose residence, 5–20-year horizon, target age, one/two occupants. Choose savings, insurance, PVD, SSO, tax-saving inputs. Persist starter amounts for savings/PVD, monthly SSO income and annual tax-saving estimates; insurance stays pending until benefit schedules exist. The summary repeats each source with its unit and origin, never silently adding the different units. |
| Knowledge | `#/knowledge/news` and `#/knowledge/reels` separate the existing three articles and two playable short clips. Existing detail, saved-library, playback and bookmark URLs remain available. This round establishes two entry paths; a continuous news feed and full-screen swipe Reels are reserved for round 10. |

A clearly labeled result-design sample lets reviewers complete the journey: residence → target → source inputs → actual draft summary → hypothetical result view → discover insurance. The sample uses fixed independent fictional amounts: THB 3.6m cost (THB 30,000/month × 10 years, no escalation), THB 2.4m assets, THB 1.2m shortfall. It explicitly does not use entered amounts and is not a tariff for either named residence. Actual aggregate result cards remain pending.

## Data and persistence

See [ROUND_6_DATA.md](ROUND_6_DATA.md). Contracts cover provenance, provider relationships/media, insurance offers and cashflows, residence package models, future source inputs, rule versions and result traceability. All sample insurer products have unknown names/prices/terms; no commercial product has been invented for a real company.

The small Round 6 draft is stored in IndexedDB `livera-round6-journey`, store `state`, key `journey`. Writes read the latest record and commit within one readwrite transaction. A hook serializes writes and refreshes across tabs/focus. Schema/version errors are visible. Correctable input validation errors stay in the form and do not disable subsequent correction. An explicit scoped reset clears only the Round 6 draft. Legacy ledger, attachments, planning, club, service and knowledge databases are untouched.

The global hide-amount preference locks the new future-input and summary screens, matching existing financial-tool behavior. This remains a local prototype, not authentication or insurer/provider integration.

## Source images and descriptions

Checked 11 November 2026. Both images were visually inspected and kept as original downloaded bytes, with no AI generation or editing:

- Jin Wellbeing County: [official site](https://www.jinwellbeing.com/), [lobby image](https://www.jinwellbeing.com/wp-content/uploads/2025/08/%E0%B8%A5%E0%B9%87%E0%B8%AD%E0%B8%9A%E0%B8%9A%E0%B8%B5%E0%B9%89-1.png), local `public/providers/jin-lobby.png` (282×245, PNG). Reference photo at the source site's published resolution; higher-resolution partner-supplied media is planned for round 8.
- The Aspen Tree: [MQDC project page](https://mqdc.com/th/theaspentree-bangna), [building image](https://corecms.mqdc.com/assets/96fbbb08-7479-49c0-bcb4-11df93feb8f5), local `public/providers/aspen-residence.webp` (740×555, WebP). Caption and alt describe the building shown, rather than the source page's mismatched indoor alt text.
- Insurer reference links: [AIA savings category](https://www.aia.co.th/th/our-products/save-invest/savings), [Muang Thai Life](https://www.muangthai.co.th/th/life-insurance). Only company names/category references are used. Official logo assets and the contracted product list are pending round 7.

All providers have `relationship: example`. Public reference images and descriptive provenance do not verify a Livera commercial partnership, package price, eligibility, availability, or booking. Media records distinguish public-reference assets from partner-supplied ones.

## Verification

- 90 domain tests pass: the existing 77 plus 13 for provenance, pending versus zero, integer satang, template pricing, target bounds, action isolation, duplicate sources, unit mismatches, source classification, payload whitelisting and invalid stored data.
- Strict TypeScript and production build pass. New functionality loads separately; main bundle remains below Vite's default large-chunk warning threshold.
- Browser walkthrough: choose The Aspen Tree, reject/correct a 4-year term, save 10 years, add four source types, reload and recover the exact entered units, open the independent result sample, keep an insurer interest, and recover that interest without losing source data.
- Round 6 reset was tested on data created during QA; legacy overview totals remained unchanged.
- News and clip tabs show 3 and 2 items; existing MP4 loads with 24-second metadata. Legacy service URLs highlight Explore.
- Privacy lock and eleven relevant routes checked at 320px with large text; document width equals viewport width. Temporary display preferences are restored after testing.
- Public deployment proof and screenshots: workspace `outputs/round6-verification`.

### Media correction in Round 8

The original Aspen building reference was later found labeled as generated/rendered imagery on the source page. It is no longer used in the live catalog. Round 8 replaces it with the official site's real interior photograph and corrects the shared residence media record; see [ROUND_8_SOURCES.md](ROUND_8_SOURCES.md).
