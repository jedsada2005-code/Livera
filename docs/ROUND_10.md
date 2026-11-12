# Round 10 — Knowledge Feed & Reels

Version 0.10.0, 12 November 2026. Builds on the Round 5 knowledge database and Round 6 navigation.

## Member experience

- News/articles use a single-column feed with publisher, publication context, topic, cover, short summary, read/save/copy-link actions. Three posts initially; explicitly load the next three. Search covers titles, summaries, publisher, topics and article text.
- Topic and format filters, selected interests, unread items, saved collection, unfinished clips and activity history. Recommendation ordering uses interests and read/completed state, without fabricated likes or view counts. Unknown publication dates sort after known dates; the date a source was checked is never substituted for its publication date.
- Article details preserve feed filters and loaded count when returning. Reading is marked only by the explicit completion button. Clipboard failures expose a selectable link instead of pretending it was copied. Copying sends nothing to Community or another person.
- Reels open in a full-screen native dialog, with one video mounted at a time. Vertical scroll snapping, previous/next, keyboard arrows/Page Up/Page Down, play/pause/replay, seeking, mute, captions, saved clips, readable transcript and source references. Escape/close restore the underlying route and focus.
- Playback starts manually by default. The optional “เล่นเมื่อเปลี่ยนคลิป” preference plays newly selected clips; it does not automatically skip to another clip at the end. Sound is muted initially. Completed clips remain completed after replay; unfinished clips resume at their saved position.
- Pause on clip change, transcript modal opening, page visibility loss and viewer unmount. Persist approximately every five seconds, on seek/pause/end and unmount. Switching clips changes the canonical share URL without adding a history entry per clip.
- Phone filters and secondary recommendations collapse; the masthead is shorter. Controls sit outside the scrolling video region so focusing/tapping a control cannot snap to another clip. Large-text preference also reaches the full-screen portal.
- Content links lead to the existing accumulation plan, premium Goal, policies, housing estimator and club activities.

## Content and provenance

Six articles/news items and four original 24-second lessons. All five pre-existing content IDs remain stable. Three new articles are LIVERA editorial checklists about money timing, housing budgets and reviewing policy records. These describe the prototype's own tools, not new financial entitlements or recommendations of a specific policy.

Primary sources rechecked 12 November 2026:

| Source | Use |
|---|---|
| [Bank of Thailand: retirement planning](https://www.bot.or.th/th/satang-story/money-plan/retirement.html) | Spending, income, inflation and retirement time horizon; existing article and silent lesson |
| [Bank of Thailand: planning steps](https://www.bot.or.th/th/satang-story/money-plan/planning-steps.html) | Starting financial position, amount/date goals and periodic review; existing article and silent lesson |
| [PRD retirement preparation activity](https://personal.prd.go.th/th/gallery/article/detail/id/1/iid/3366) | Dated 14 August 2026; labeled as a past activity, not an open registration or new benefit |

The feed is a curated prototype collection, with source links and known publication dates. Live aggregation, an editorial publishing service, partner news API, third-party licensed reels and cross-device accounts are future integrations.

The housing article uses the existing actual Jin Wellbeing County garden photograph with visible credit and the official source link. It is an illustration of that place, not a confirmed LIVERA partnership or package offer. See [ROUND_8_SOURCES.md](ROUND_8_SOURCES.md) for image provenance and commercial-media prerequisites. No new AI-generated place photograph is introduced.

## Video assets

| Media stem | Audio | Duration | Approximate file size |
|---|---|---|---|
| retirement-questions | Silent original typography (existing) | 24 s | 82 KB |
| money-goal | Silent original typography (existing) | 24 s | 75 KB |
| money-streams | Original narration using installed macOS Kanya Thai speech synthesis | 24 s | 278 KB |
| housing-checklist | Original narration using installed macOS Kanya Thai speech synthesis | 24 s | 259 KB |

All four clips have local WebVTT captions and readable transcripts. New speech segments are 4.03–6.08 seconds each, padded to eight-second slides without truncating speech. New MP4s contain AAC audio; old clips explicitly say they have no audio. No third-party footage or music is included. The fruit drama scripts discussed separately are not used as these educational clips.

Reproduce the two new videos on macOS with the installed Kanya voice using `scripts/render-round10-clips.py` and a Python environment containing Pillow, imageio-ffmpeg and pyobjc-framework-Cocoa. No runtime media-generation service is required. Regenerate caption text using `npm run media:captions`; retime deliberately if a lesson's structure changes.

## Persistence and compatibility

Keep IndexedDB `livera-round5-knowledge`, schema version 1 and its atomic read/write queue. Add `lastReelId` and validated `player.muted` / `player.autoPlay`. The reader supplies defaults only when those fields are absent, preserving old saved IDs, interests, notification preference and reading/play positions. Invalid stored fields still surface an error rather than silently clearing the library. Member preference writes retain the player fields.

Old article URLs, `#/knowledge/<clip-id>`, `#/knowledge/clips`, saved links and Account controls continue to work. Canonical clip URLs are `#/knowledge/reels/<clip-id>`. A missing requested clip shows “not found” rather than playing unrelated content. Other stores, policy records, housing budgets and accumulation plans are unchanged.

## Verification

- 170 automated tests pass, including old-record migration, invalid player state, intersecting filters, recommendation/date/history ordering, sticky completion, deep links and local caption/media availability. Existing ledger, services, housing and accumulation tests remain green.
- TypeScript check and production build pass. Knowledge remains a lazy-loaded page.
- Browser QA: 1440×1000 desktop, 390×844 phone, 320×740 phone with large text. No horizontal document overflow. Phone filter and secondary-panel collapse verified; only three initial feed posts are mounted, and load-more reveals all six articles.
- UI search for public news, bookmark, explicit read completion and return to the preserved search passed. Clip save/continue passed; paused at 21.22 s and reopened at the same position with playback stopped. Captions toggle changes the native text track. Mute/play controls preserve the selected clip after moving controls outside the snap region. Keyboard next, opt-in play-on-selection, end completion and readable transcript modal passed.
- Media inspection confirms four 24-second MP4s and AAC only in the two narrated clips. All four caption files contain three ordered eight-second cues.

The in-app browser keeps separate documents visible when switching its tabs, so page-visibility pausing could not be triggered by that tab-switch check; the visibility handler is implemented and requires a physical-browser acceptance check.

Browser checking uses the desktop app's browser engine; final acceptance on physical iOS Safari and Android Chrome is still recommended before a commercial release. No native app packaging or external partner connection is introduced in this round.
