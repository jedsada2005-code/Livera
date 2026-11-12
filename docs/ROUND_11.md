# Round 11 — NVL Overview

Version 0.11.0, 12 November 2026. This round redesigns the member overview around net accumulated value in the retirement plan (NVL).

## Member experience

- The sample account belongs to **พีระ อารมณ์ดี**.
- The overview leads with current NVL, a target, completion percentage, and the remaining amount.
- A line chart can switch between six months, one year, and all available sample history.
- A rectangular goal bar replaces the thermometer metaphor. It is vertical on wider screens and horizontal on mobile.
- Supporting details and older dashboard cards remain available below the NVL card, while mobile keeps the primary view compact.
- The source-information action explains what the sample NVL includes and excludes.

## Prototype data

The current sample NVL is THB 3,200,000 against a THB 8,000,000 target, or 40%. History is deterministic sample data and always ends at the displayed current balance. It is not synced to a bank, insurer, provident fund, Social Security, tax system, or real member account.

## Accessibility and privacy

- The chart has an accessible title and description.
- Period controls use button state and remain keyboard accessible.
- Privacy mode masks chart labels, values, and the chart description.
- Large-text mode and reduced-motion preferences are supported.
- The layout was checked at 320 px and 390 px without horizontal overflow.

## Verification

- TypeScript and lint checks: `npm run check`
- Unit tests: `npm test`
- Production build: `npm run build`
- Data tests verify the 40% calculation, monotonic history, series endpoints, and sample member identity.
