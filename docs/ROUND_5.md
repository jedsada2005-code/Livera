# LIVERA Prototype — Round 5 (v0.5.0)

Delivered 11 November 2026. Scope: curated government/retirement knowledge, vertical short clips, and a member account area. Hosting remains the existing GitHub Pages repository.

## Experience

- `#/knowledge`: editorial photo hero using the existing photorealistic AI residence image; 3 articles/news summaries and 2 original silent typography videos. Search intersects category, format, saved/interests/continue filters; explicit empty states.
- `#/knowledge/retirement-map`, `/money-routine`, `/public-retirement-2026`: original concise summaries with primary-source links, source publication date when verified, and source-check date. Article completion requires the member to mark it read.
- `#/knowledge/clip-retirement`, `/clip-money`: actual local H.264 MP4 files, 540×960 (9:16), 24 seconds each. Manual playback, native seeking/fullscreen controls, explicit play/pause button, transcript, and playback-error fallback link. No autoplay, music, voice, or external video embed. Pause after leaving the visible tab; persist position every approximately 5 seconds and on pause/navigation. Reload resumes unfinished clips paused; finished clips restart and retain their completed badge.
- `#/knowledge/saved` and `/clips`: direct links to the saved library and clip collection. Interest controls are deliberately selected by the member; health and policy data are not used to target content.
- `#/account`: fixed fictional member identity, existing privacy/large-text preferences, editable knowledge interests and in-app recommendation preference, library statistics, links to existing club and service histories, and scoped reset controls.
- Annual premium summary reads the existing Round 1 ledger using the recorded paid-date calendar year, includes recorded/pending entries, and excludes voided entries. CSV exports fixed aggregate fields only, without notes, references, attachments, or personal details. Download is disabled while amounts are masked or the ledger is unavailable. The page and file both say this is an unverified demo summary, not a tax certificate or tax-eligible amount.
- Main five-tab mobile navigation is retained. Persistent header book/account icons and desktop secondary navigation provide access to the new areas. Services and overview links now open real knowledge pages.

## Sources and editorial limits

Checked 11 November 2026:

1. Bank of Thailand, [การวางแผนเกษียณ](https://www.bot.or.th/th/satang-story/money-plan/retirement.html): retirement-map and retirement-questions clip. No confirmed publication date shown; the app says so rather than using the crawl date as a publication date.
2. Bank of Thailand, [การวางแผนการเงิน](https://www.bot.or.th/th/satang-story/money-plan/planning-steps.html): money-routine and money-goal clip. No confirmed publication date shown.
3. PRD Human Resources, [กิจกรรมเตรียมความพร้อมแก่ข้าราชการเกษียณอายุ ประจำปีงบประมาณ พ.ศ. 2569](https://personal.prd.go.th/th/gallery/article/detail/id/1/iid/3366): source publication and event date both 14 August 2026. This is clearly described as a past activity, not a new entitlement or an open LIVERA event. LIVERA's reflective paragraph is identified as editorial interpretation.

Summaries and clip scripts are original condensed writing. No third-party article images, long quotations, footage, audio, or government logos are copied. Static curated content is not represented as a live news feed. Videos have full readable scripts next to/below the player; the app does not claim to offer personalized financial or medical advice.

## Persistence and recovery

IndexedDB `livera-round5-knowledge`, object store `state`, key `knowledge`, versioned payload with bookmarks, read/watch activity, interests, and in-app news preference. Mutations load the latest payload and write in one transaction. A serialized hook queue handles overlapping video/save events. Cross-tab notifications use BroadcastChannel and window-focus refresh. Invalid data is rejected with a visible recovery message; it is not silently overwritten. Domain validation whitelists catalog IDs/topics, activity types, finite positions within duration, and timestamps.

Knowledge reset requires an explicit scoped confirmation. It clears only the new knowledge database; payment attachments, ledger, goals, community, and service data are retained. Existing payment reset remains separately labeled. Account settings do not create a real customer login or customer-only access control. There is no insurer confirmation, payment execution, tax eligibility calculation, certificate issuance, or real push/SMS/email subscription.

## Media reproduction

`public/media/retirement-questions.mp4` and `money-goal.mp4`, with `.webp` posters. Original motion graphics rendered with `scripts/render-knowledge-clips.py` using macOS AppKit/CoreText for correct Thai shaping, Pillow and imageio-ffmpeg; optional authoring dependencies are not needed to run/build the app. Thonburi is supplied by macOS and is not distributed as a font file. Both videos are silent; scripts/source citations live in `src/data/knowledge.ts`.

## Verification

- 77 domain tests pass (13 new), covering idempotent bookmarks, read/watch state, malformed data, input boundaries, intersecting filters, preferences, calendar-year aggregation, void handling, satang precision, and CSV field minimization. Existing 64 tests remain passing.
- TypeScript strict checks and Vite production build pass; knowledge/account/services load as separate chunks.
- Browser checks: save/read persistence after reload; search/no-results; interest save/filter and matching in-app notice; actual playback, completed state and unfinished 7-second resume after reload; continue collection; CSV download; masked amounts disable CSV; reset cancel/confirm leaves existing annual premium totals unchanged.
- Responsive checks at 1440×1000 and 360×800, including large-text knowledge, clip, and account views. A large-text mobile header overflow found during QA was fixed; document width equals viewport width.
- Public deployment checks and screenshots are recorded under the workspace `outputs/round5-verification` folder, outside the repository. Local QA cleared only Round 5 data created during this session; the existing local ledger was preserved.
