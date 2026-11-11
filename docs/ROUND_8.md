# Round 8 — Housing discovery and budget planning

Version 0.8.0. Adds the housing portion of the agreed rounds 6–10. This release estimates housing cash outlays from member assumptions. The combined retirement funding/shortfall engine remains Round 9.

## Experience

- `#/explore` / `#/explore/housing`: search two named reference projects, filter type/location, bookmark, and open details.
- `#/explore/housing/saved`: saved places, retained after reload.
- `#/explore/housing/jin` and `/aspen`: actual photographs, source links/date, overview, tenure/cost information, checklist, planning target and estimator entry.
- `#/explore/housing/<id>/budget`: separate input/result views, 5–20 years, 1–2 occupants, starting year shown in Buddhist Era, four hypothetical payment structures, explicit monetary inputs and annual price-growth assumption.
- `#/explore/housing/budgets`: one latest saved budget per project, reopen/edit or explicitly remove. A journey import keeps a separate snapshot when a catalog budget is later removed.

The live catalog replaces the old Round 6 residence preview. Existing Explore/services tabs and all owned-policy/insurance/knowledge flows remain in place. The old housing placeholder shortcut in Services now links directly to the working housing catalog. Source descriptions, photos and corrections are documented in [ROUND_8_SOURCES.md](ROUND_8_SOURCES.md).

## Calculation contract

All amounts are integer satang. `null` means unknown, never zero. Users explicitly enter zero for an absent component. `basis: member-assumption` is mandatory; none of these inputs impersonates verified provider pricing.

| Component | Handling |
|---|---|
| Upfront price / entry / residency right | One payment in year 1, per room/household; not escalated, no resale/refund assumed |
| Recurring monthly charge | ×12 for annual outlay; already covers the selected household, not multiplied by occupants |
| Recurring annual charge | Used directly as an annual outlay |
| Care supplement | Monthly amount per person ×12 × occupants; enter 0 when already included in the package |
| Other recurring costs | Monthly household amount ×12; include only costs not already in another component |
| Refundable deposit | One fixed cash provision, separate from non-deposit spending; never counted twice or automatically refunded |
| Growth | Same member-specified rate, 0–10% in basis points, applied to all recurring components starting in year 2 |

For year index `i` starting at 0, each recurring annual component is `round(firstYearAnnualSatang × (1 + rateBps / 10000)^i)`. Round each component/year to satang, then sum. Upfront and deposit do not grow. Alternative horizons 5/10/15/20 reuse the same first-year assumptions. Results are nominal totals, not present value or an investment projection. They do not require that all funds are paid on the first day.

No calculation starts until its base price and growth assumption are known. With missing supplements or upfront costs, only the explicitly entered subtotal is shown and full outlay remains pending. An unknown deposit keeps total cash required pending even when non-deposit spending is complete. Tables preserve unknown component cells. No empty field is advertised as free.

Purchase/rights modes still collect recurring service fees; selecting these modes does not force them to zero. Changing the payment model clears both upfront and recurring prices to prevent monthly/annual/unit confusion. Tenure validity, financing, taxes/fees not entered, exit/resale value, changes in care requirements, and quoted room availability are outside this model.

## Data and compatibility

- `src/data/housingCatalog.ts`: verified project references and actual-image provenance, with every package price pending.
- `src/domain/housing.ts`: input/state validators, estimator, snapshots, independent bookmarking/budget actions, target-match detection.
- IndexedDB `livera-round8-housing`, version 1, store `state`, key `housing`: saved IDs and latest budget per project. Writes read latest state in the same read/write transaction. The hook serializes actions and refreshes across tabs/focus. Correctable domain errors do not lock the form; invalid stored records surface a scoped recovery path.
- JourneyDraft version 1 gains optional-on-read `housingBudget`, defaulting to `null` for Round 6/7 records. Import canonicalizes a copied budget and sets only residence, horizon and occupants; age, funding and insurance interests remain intact. A changed target displays a mismatch warning without silently recalculating or deleting the old snapshot. Removing the snapshot preserves the target and funding.
- Global hide-amount preference locks inputs/results and saved financial budget lists. Public places/photographs remain visible. No medical information, quote documents or booking request is collected or transmitted.

## Validation

- 124 tests pass: previous 104 plus 20 housing tests covering hand-calculated examples, monthly/annual equivalence, separate upfront/deposit treatment, per-person scaling, annual rounding/growth, unknown-vs-zero, horizon bounds, safe integer amounts, model unit resets, state roundtrip, invalid stored input, additive migration, action isolation and stale snapshot detection.
- Strict TypeScript and production build pass.
- Local browser QA: bookmark/gallery, full 10-year example (THB 1.85m outlay + THB 20k deposit), save/reload, import to future journey, mismatch after target change, 20-year alternative, partial subtotal when care is unknown, correction after invalid rate, and cleared amounts after switching monthly to annual.
- At 320px with large text, estimator and opened annual table remain inside document width; alternative horizons and annual table scroll inside their own regions. Privacy mode exposes no financial text inputs. Supplement inputs and annual details collapse on mobile to reduce scrolling. At 390px the initial two-project list is 1553px tall and stays 390px wide; at 1440px both project cards display side by side and all photos load. No browser console errors/warnings were captured. Location filtering, Jinwel alias search, budget deletion, bookmark removal, and privacy masking in the saved-budget list were also verified. Test-created catalog budgets/bookmarks were removed and display preferences restored in the separate local preview origin; online member data was not reset.

Deployment uses the existing GitHub Pages workflow, which reruns tests and build. Check the release commit's Actions result for its final deployment state.
