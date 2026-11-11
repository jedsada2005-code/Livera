# Round 7 — Insurance discovery

Version 0.7.0. Builds on Round 6's navigation and data conventions. Replaces the placeholder insurer screen with a real public reference catalog, initially six endowment products from AIA and Muang Thai Life. Pension and health filters explicitly return an uncollected-data state.

## User flows

1. Policies → Find a new plan → search/filter → product detail.
2. Bookmark a product → Saved plans → revisit after reload.
3. Select 2–3 products → comparison table → edit one common age, annual premium budget and desired sum insured.
4. Product / comparison → add as an interested reference → future journey summary → revisit or remove.

Routes: `#/policies/discover`, `/saved`, `/compare`, `/<product-id>`. Old Round 6 `/aia` and `/mtl` links still open a provider-filtered list. Unknown products show a return path. Lists paginate at three items. Changing page returns to the result heading. Search and public filters remain session state; saved products, comparison choices and the common scenario persist.

## Data and calculations

- Product metadata lives separately in `src/data/insuranceCatalog.ts`; sources in [ROUND_7_SOURCES.md](ROUND_7_SOURCES.md). Previous Round 6 `offeringSlots` remain only as historical schema fixtures, not live product cards.
- No quote, purchase, payment or insurer lead request is sent. No personal premium, surrender value or net return is invented.
- Annual budget remains a requested constraint. Unknown premiums stay pending, not counted as zero or accepted as within budget.
- Fixed coverage years differ from coverage to a target age. A duration filter for the latter requires current age. Entry-age checks are informational, not an underwriting decision.
- The desired sum insured is a shared quote brief, not a premium or validated quote. Benefit percentages are never shown as yields.

## Persistence and compatibility

`livera-round7-discovery` IndexedDB, version 1, store `state`, key `discovery`: saved IDs, up to three comparison IDs, common scenario. Mutation reads the latest stored state in the same read/write transaction; per-tab queue, focus refresh and BroadcastChannel support consecutive actions and multiple tabs. Invalid records fail visibly; recovery resets only this catalog's selections/scenario.

Round 6 JourneyDraft version 1 gains additive `interestedPlanIds`. Old records without that field read as an empty list; future writes canonicalize it. Existing property, horizon, household, funding and provider preference remain intact. Adding/removing a product is idempotent, preserves funding, and does not create a policy or financial asset. Round 6 journey reset now explicitly names interested products too. Other ledger/planning/community/service/knowledge stores and export formats are untouched.

Privacy setting masks common age/budget/sum-insured displays and locks those inputs. Saved private age does not silently influence search while hidden. Public product facts remain readable. Large text and keyboard navigation are supported; detail tabs implement arrow/Home/End keys; comparison scroll stays within its own labeled region on mobile.

## Validation

- `npm test`: 104 tests, including product source/asset checks, Thai search aliases, combined filters and age boundaries, duration semantics, unknown budgets, invalid records, comparison limit/idempotency, Round 6 migration, and interested references preserving financial data.
- `npm run check` and `npm run build`: passed.
- Browser QA: 390px list/search/modal/detail; bookmark and 2-plan comparison survived reload; shared scenario preserved; fourth comparison rejected without losing the first three; interest added to journey, persisted after reload, and removed without changing funding.
- Checked Thai savings search with AIA, 5-year payment filter, empty health category, legacy provider URL, second-page products, and End-key detail tab navigation.
- At 320px with large text and privacy enabled, page width stayed 320px; comparison used its own horizontal scroll region; the private scenario summary was masked and the filter dialog contained no private text inputs. At 390px, default list width stayed 390px with 3 cards; at 1440px, logos loaded and cards used 3 columns. No browser console warnings/errors were captured during local checks.
- Test-created bookmarks/comparison/interested references were removed and display preferences restored before delivery. Browser checks used a separate local port; existing online member data was not reset.
- GitHub Pages deployment: workflow runs the same 104 tests and production build. Check the commit's Actions result for deployment status.

Next rounds: housing packages/cost planning, the combined retirement funding engine, and the full news/Reels experience. This release does not claim those later functions are finished.
