# Round 9 — Retirement cashflow model

Version 0.9.0. Model `livera-cashflow-1`. Builds on the insurance catalog and housing budgets, using member assumptions rather than invented insurer/provider quotes or unverified legal entitlements.

## Experience and routes

`#/retirement` now opens the new model. Explicit route `#/retirement/accumulation` has four steps: `/goal`, `/sources`, `/housing`, `/result`. Existing `#/retirement/future/{goal,sources,summary}` remains the earlier starter journey; old premium-saving and retirement-cost calculators also remain accessible.

The main planning tab and mobile home shortcut link to the new model. The legacy journey links forward to it. Housing's “use in future plan” saves its latest catalog budget, retains its legacy journey snapshot for compatibility, then copies the budget into the new model and opens housing review. It does not overwrite existing source or goal assumptions.

`/demo` is a read-only fictional walkthrough with all five source kinds, clearly labeled as not the member's plan, not a commercial product, and not recommended rates. It never writes those figures into the member record. Its CSV is explicitly labeled and named as a demo. Returning to the actual plan retains previously saved inputs.

## Data and persistence

- IndexedDB `livera-round9-accumulation`, version 1, store `state`, key `accumulation`. One validated plan, up to 20 individually named sources, up to 60 dated insurance schedule rows per source.
- Source fields are explicit integer satang, integer ages, and basis-point rates. `null` means unknown. Zero must be entered explicitly. Rates and large projected values have bounded validation; arithmetic stops with a correctable message rather than returning nonfinite/unsafe values.
- Canonical readers whitelist fields. Transactions read the latest record before applying a scoped action; the hook serializes per-tab changes, refreshes on focus and broadcasts updates.
- “Import earlier data” explicitly copies only missing legacy source IDs and an absent housing snapshot. It preserves edited Round 9 records. A legacy PVD total is retained only as an informational hint, never guessed to be the employee portion or fully vested employer money. Insurance interests are not financial assets and are not converted into products/benefits.
- Reset is scoped to the Round 9 model. Legacy ledger, policy attachments, earlier starter journey, catalogs, housing budgets, community, services and knowledge records are preserved.
- Global hide-amount mode locks the page and removes financial inputs/results from the DOM. Large text is supported. Mobile displays headline amounts first, with income/chart/source traces and annual tables behind expandable controls. Tables scroll within their own labeled regions.

## Timeline and rounding

The default starting month is determined in Asia/Bangkok. Amounts are as of its end; the first contribution is at the end of the next month. Whole-age differences determine the pre-retirement horizon: `(targetAge − currentAge) × 12`. The first retirement month is the month after that accumulation period. Ages are model periods, not exact birthdays or statutory claim dates. Retirement ends immediately before the chosen end age.

Effective annual net returns convert to `(1 + annualRate)^(1/12) − 1`. Contributions arrive at month end. Each monthly interest/contribution component rounds to integer satang. Annual changes occur every 12 modeled months, not automatically on January 1. Rates are assumptions, not guaranteed yields.

## Five source kinds

| Source | Active behavior |
|---|---|
| Savings/investments | Opening amount, net monthly contribution and pre-retirement net annual return; multiple distinct accounts allowed |
| PVD | Separate employee/employer opening amounts and monthly salary-based contributions. Salary changes annually. Each portion earns the entered fund return. At retirement, employee balance + employer balance × entered vested percentage − entered exit-tax/cost provision enters the pool. No PVD withdrawals fund earlier premiums. No statutory vesting/tax assumption is inserted |
| Insurance | Manual net benefit and premium schedule with once/monthly/annual frequency and inclusive end month. Keep vs surrender is mutually exclusive at/after surrender month. No paid-premium balance is reused as maturity value. Receipts can be retained in the plan or explicitly used elsewhere. Premiums can be externally funded (monthly savings must already be net of them) or drawn from plan liquidity |
| SSO | Member-specified monthly net income, planning start/end ages and annual change. Start is at/after modeled retirement; already received amounts belong in current savings. Income is received in its future month, never capitalized and added to opening wealth |
| Tax saving | Member-specified annual tax saving, explicitly distinguished from a deductible expense. Deposits occur every 12 months before retirement only when reinvestment is selected and the amount is not already included in another contribution/balance. It does not calculate future tax eligibility, a refund date or an income-tax return |

When plan-funded premiums fall due, liquid accounts are drawn in insertion order. Withdrawn money stops earning returns. PVD remains unavailable until retirement. Any uncovered amount carries as a zero-interest funding shortfall, with its first month reported and its outstanding amount deducted from target wealth. This is not a loan/borrowing recommendation or a loan-interest model. Negative PVD net values caused by an unusually high entered tax provision are also deducted and explained.

At retirement, included assets are pooled and earn the global post-retirement return. Monthly income and expenses arrive at month end. The model does not resolve the exact order of payment dates within a month. Housing upfront costs/deposits are reserved at the start of the first retirement month, so later income cannot falsely fund an earlier cash obligation. No return is credited to a negative balance and no debt interest is invented.

## Housing alignment

A housing plan can be left pending, explicitly excluded because monthly living costs already include accommodation, or imported as a separate snapshot. When separate, monthly living costs must exclude costs already represented by housing.

“As entered” requires the housing price year to equal the first retirement year. “Inflate” is an explicit member selection that moves older price assumptions forward: recurring amounts use the housing plan's escalation rate; upfront/deposit amounts use global inflation. The source plan is unchanged. Newer quoted years are not silently discounted backward.

The Round 8 annual cost calculation is reused. Monthly components are distributed across twelve integer-satang payments that sum to the annual amount. Annual accommodation charges are paid in the first month of each modeled housing year. Upfront cost and refundable deposit are counted once, with no assumed refund or resale value. If retirement lasts beyond the 5–20-year budget, a separate later monthly accommodation amount is required, stated in prices of its first year after the budget and inflated thereafter.

## Results and completeness

“Known assets at retirement” includes only sources whose selected calculation fields are complete. References, already-counted tax money and deliberate non-reinvestment are excluded with reasons. Duplicate links to the same demo policy are not counted twice. Missing source/goal/housing information or an unconfirmed overlap check prevents full required-capital/gap/saving/end-balance conclusions.

Required starting capital is the smallest integer-satang amount that keeps the retirement pool nonnegative at every modeled payment point. A monotone integer search tests the actual rounded monthly simulation; it does not merely compare the final balance. Its bound checks avoid overflow from unnecessarily large trial capitals. Additional monthly saving is the smallest integer-satang month-end contribution reaching the target shortfall at the entered additional-saving return. It is a separate earmarked accumulation estimate and does not certify that all earlier premium-liquidity gaps are solved. When already retired, a positive shortfall requires a lump-sum decision instead.

Results show assets, capital required, gap, additional monthly saving, first-year average monthly income, first modeled shortage, and trace reasons per source. The graph can switch between pre/post retirement; before-retirement balances include PVD at the assumed target vesting and are not fully withdrawable cash. Annual table identity is opening + returns + income − housing/deposit − other living − plan-funded premiums = closing.

CSV download includes the model version, goal assumptions, annual timeline, source inclusion reasons, detailed source rates/amounts/schedules and the original housing snapshot. UTF-8 BOM supports Thai text. Text cells that could be interpreted as spreadsheet formulas are escaped. Incomplete full summaries cannot be exported as complete results.

## Official information links

Checked 12 November 2026: [Revenue Department personal-income information](https://www.rd.go.th/43338.html), [SSO e-Self service](https://eself.sso.go.th/). These are information/verification links only. This release implements no automatic Thai tax brackets, SSO legal pension formula, or PVD tax/vesting entitlement rules. Users need the appropriate year and their own statements/fund terms; the model does not claim live government integration.

## Validation

- 163 automated tests pass: prior 124 plus 39 covering rounded effective returns, minimum capital at every payment point, delayed/manual income, liquidity vs PVD, actual premium withdrawals, surrender replacement, tax reinvestment/deduplication, housing alignment/deposit/expiry, validation, explicit import, canonical records, long-horizon search bounds, demo isolation, CSV safety, exact annual reconciliation, source-count bounds, recurring-schedule completeness and trace reconciliation including liquidity adjustments.
- Strict TypeScript and production build pass.
- Browser QA: a zero-return 12-month bridge requiring THB 12,000 capital / THB 1,000 extra monthly saving matched hand calculation; a manually entered THB 1,000 monthly SSO scenario offset the modeled living expense without adding opening wealth; importing an R8 housing budget restored the housing requirement. Entering an annual plan-funded premium produced the expected pre-retirement shortfall and THB 2,000 extra-saving estimate.
- Save/reload retained source/goal data; returning from the fictional walkthrough retained the actual plan. Graph toggle, nested annual table, CSV download and explicit demo metadata were verified. At 320px with large text, document width stayed 320px while the annual table scrolled inside its region. Privacy mode exposed no financial text inputs. At 390px the collapsed fictional report is 1769px tall; larger narrative/source/chart/table content is opt-in on phones. At 1440px the report and five source traces remain within document width. No browser console errors/warnings were captured. Display preferences were restored after testing on a separate local origin.

Deployment uses the existing GitHub Pages workflow, which reruns all tests and production build. The release commit's Actions run records final publication status.
