# Round 6 data contracts and next-round handoff

## Provenance

`Evidence<T>` is a required field envelope. `value: null` plus `status: pending` means unknown. A member-entered zero is `value: 0, status: member`; these states are not interchangeable.

| Status | Meaning / rendering |
| --- | --- |
| verified | Has an HTTPS source and valid checked-on date. The UI says “อ้างอิงต้นทาง”; this is scoped to that field, not an endorsement of the whole provider. |
| member | Entered by the member, without external verification. |
| estimate | A calculated value with a specified assumption/model; reserved for later aggregation. |
| demo | Fictional design/example data. |
| pending | Unknown; no default price or zero is inferred. |

Money is always nonnegative integer satang. Rates are explicit percentages. Dates for source checks are ISO calendar dates. Amounts, dates, statuses and units are validated at the persistence boundary.

## Core models — `src/domain/catalog.ts`

| Model | Key fields |
| --- | --- |
| Provider | Stable ID, insurer/residence type, official website, example/confirmed relationship, media/logo metadata. |
| MediaAsset | Path, photo/render/logo/placeholder type, source, alt, and public-reference/partner-supplied/pending usage state. |
| InsuranceOffering | Provider/category, name and premium evidence, payment/cover years, quote basis (age, sum insured, payment frequency), benefit cashflows. |
| BenefitCashflow | Year, premium/cashback/maturity/pension kind, money evidence, guaranteed flag (unknown allowed). |
| Residence | Provider reference, descriptive provenance, location, actual project image, residence/wellness services, packages. |
| ResidencePackage | Monthly/annual/lifetime-lease/purchase/per-visit/pending model, occupants, upfront and recurring price, refundable deposit, escalation, included/excluded service evidence, price-validity date. Unknown inclusions and exclusions stay pending. |
| FundingRecord | Stable source ID, source kind, amount evidence, current-balance/monthly-income/annual-tax-saving unit, optional linked-policy ID. |
| ContentEntry | News/reel format, source/publication/check dates, media and summary provenance. |

The Round 6 starter draft allows one entry per source category, with IDs `fund-<kind>`. Round 9 will add multiple-account entries using the richer contracts below and an explicit storage migration. Insurance source values cannot yet be entered as current assets; the starter record remains pending without a benefit schedule.

## Detailed future contracts — `src/domain/futureContracts.ts`

These are typed interfaces for subsequent implementation, not active entitlement/tax/projection algorithms.

- `SourceLink`: origin record, linked ID, and whether the source is already included in the opening balance. This is the basis of double-count prevention.
- `SavingsDetails`: opening balance, monthly contribution, net annual return, contribution timing.
- `PolicyDetails`: owned-policy reference, benefit schedule, cashback spending/reinvestment choice, surrender assumption, guaranteed-only flag.
- `PvdDetails`: employee and employer opening balances, salary and growth, both contribution rates, vested employer share, net return, exit date and tax treatment. A current statement balance is not a promise of cash available at exit.
- `SsoDetails`: section 33/39/40/unknown, contribution months, assessable-wage history, membership end, claim age, optional manual monthly pension, rule-version reference.
- `TaxDetails`: tax year, annual income/other allowances, deductible items linked to source records, tax saving, reinvestment choice and rule-version reference. Deductible expense is not tax saved.
- `RuleVersion`: source and validity dates for Thai tax/SSO rules; no timeless hardcoded entitlement assumption.
- `ResidenceCostPlan`: start year, 5–20-year period, occupants, package link, care/other supplements, refundable deposit and refund assumption, escalation evidence.
- `AccumulationPlan`: as-of date, current/target/end age, sources, housing-cost plan, inflation.
- `AccumulationResult` / `ResultTrace`: asset balance, periodic income, housing costs, gap, extra saving, provenance/assumptions and per-source/year inclusion reasons.

## Numerical rules to implement and verify in rounds 8–9

1. Do not sum monthly income, annual tax saving, and current assets as one number.
2. `currentBalanceInput()` exposes only entered savings/PVD statement balances. It does not calculate vesting, tax, exit value, liquidity, or projected wealth.
3. Use each policy's dated benefit schedule. Premiums paid are not maturity proceeds; surrender and full future benefits cannot both be included in the same scenario.
4. Separate upfront cash, recurring costs, refundable deposits, and contractual refunds. Do not turn all accommodation or wellness services into a monthly-rent model.
5. Apply rule versions appropriate to the modeled date/year. Show assumptions and unresolved input fields.
6. Reinvest tax savings only when explicitly selected; avoid re-adding savings already present in the opening balance or monthly contribution.
7. A result should be pending when required data is absent. The Round 6 result-design sample has no connection to the member draft or provider tariffs.

## Persistence boundary

`JourneyDraft` version 1 stores only residence ID, horizon, target age, occupants, one interested insurer and starter funding records. Read validation whitelists fields and rejects bad versions, unknown IDs, duplicate categories, mismatched units and invalid amounts. Actions update only their own group of fields. Existing databases and source records are never migrated or overwritten by Round 6.

## Implemented in Round 9

The active normalized model is now `src/domain/accumulation.ts` with its monthly engine in `accumulationProjection.ts`, and housing in `housing.ts`. The earlier `futureContracts.ts` interfaces remain design references rather than the persisted runtime shape. Round 9 uses an independent validated store and explicit idempotent import of starter records, preserving all existing databases. See [ROUND_9.md](ROUND_9.md) for actual cashflow conventions, completeness gates, source fields and limitations.
