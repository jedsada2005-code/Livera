# Mobile UX refinement — v0.5.1

11 November 2026. The member asked to reduce long vertical scrolling on phones and move secondary content behind buttons or menus.

## Changes at widths up to 760px

- Overview: 160px photo welcome; compact next-payment card and four financial summaries. Duplicated full policy/club promotional sections are replaced by four direct links to policies, club, knowledge, and account. A concise demo/unverified-data note remains visible under the financial summaries.
- Policies: compact list cards retain the plan, premium, paid amount/periods, next due date, detail link and payment action. Full descriptions remain on the existing policy detail page.
- Retirement: short photo introduction and compact policy picker. Secondary ledger details, saved goals, and saving schedules expand on request. Calculator has separate “ข้อมูลแผน” and “ผลคำนวณ” mobile views; the draft remains mounted. Savings and return assumptions show expandable controls, with saved input amounts visible in the savings heading. Successful calculation opens results. Invalid hidden inputs reopen their section and receive focus; the section stays open while corrected. Scenario, graph and explanatory details expand independently.
- Club: compact photo lead-in and event rows. Search/type/availability filters sit behind one button with the selected filter context. Community groups collapse and the feed shows two posts per page. Full event and post details remain linked.
- Services: compact task cards; process explanation and secondary destinations expand on request. Existing request workflows and notices remain.
- Knowledge: compact photo intro, always-visible search, expandable category/format filters with selected-filter context, and three articles/clips per page. Video transcripts and source details can be opened separately. Video controls and readable transcripts remain available.
- Account: five clear expandable categories for display/privacy, interests, annual premiums, saved content, and data/history. Existing edit/save/export/reset controls are inside their named categories.

Desktop shows the full existing sections and all list items. New disclosure containers use `display: contents` on desktop; mobile controls/pagination are hidden. Fields and selections are not unmounted when a disclosure closes or the viewport changes. No database schema, financial formula, payment, booking, service, or content action logic changed.

## Measurement

Same 390×844 CSS-pixel viewport, normal text, initial state before opening secondary sections. Measurements include the document/footer; they are indicative and can change with member data, text settings, and expanded sections. Baseline was the deployed v0.5.0; after values are the new local build. Ledger fixtures may differ between the two browser origins but do not materially change the layout structure.

| Page | Before height (px) | After height (px) |
| --- | ---: | ---: |
| Overview | 2,725 | 1,121 |
| Policies | 2,078 | 1,302 |
| Premium goal | 2,683 | 1,733 |
| Calculator, input view | 4,225 | 1,539 |
| Club events | 3,398 | 1,712 |
| Community | 2,859 | 1,850 |
| Services | 2,207 | 1,256 |
| Knowledge | 2,458 | 1,394 |
| Account | 2,789 | 905 |

## Verification

- Existing 77 domain tests, strict TypeScript check, production build and `git diff --check`.
- Browser: expand/collapse account sections without losing unsaved choices; news and community pagination; filter reset from the last news page; event filters retain their selected label when collapsed.
- Calculator: values survive input/results switches and resizing to desktop/back. Invalid inflation and annual-income fields reopen their hidden section; typing a correction does not collapse the section or lose focus. Successful calculate opens results.
- All nine main views checked at 320px with large text: document width equals viewport width. Display preference restored after QA. Desktop at 1440px shows the form and results together, with no mobile disclosure controls.
- No new member records, payment entries, bookings, posts or requests were saved during this UI verification. Existing browser data remains intact. Public screenshots and verification record are saved in the workspace `outputs/mobile-compact-verification` directory.
