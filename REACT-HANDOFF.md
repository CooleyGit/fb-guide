# Full React application handoff — fb-guide

## Task

Build a complete, polished React football learning application from the existing `index.html` in `CooleyGit/fb-guide`. The result should feel like an interactive coaching tool with real navigation, a dominant play workspace, contextual teaching interactions, and synchronized play animation. Implement it, verify it, and provide a local preview. Preserve the established coaching content and assignment examples. This document replaces the earlier single-screen migration brief.

Work in the existing repository. Read any repository instructions first. Inspect `index.html` and `README.md` before changing anything. Save a copy of the current standalone page at `public/legacy-guide.html` so it remains available after migration. Implement on a feature branch. Prepare the deployment configuration, but do not publish over the current site as part of this handoff.

## Product and voice

This is an athlete's study tool. Write directly to a teen: short, confident, clear, and encouraging. Keep the current maroon/gray appearance, pale field, maroon SS, and brighter orange SS paths. Keep the heading **TCU 4-2-5 DEFENSE · STRONG SAFETY** and **Own your edge.**

No school logos, Flour Bluff branding, or player names. Keep general football knowledge separate from the selected-play interface. Preserve the inspirational message, pre-snap preparation lesson, foundational vocabulary, technique notes, and expandable advanced notes. Avoid adding repetitive disclaimers to the main interface; retain the source and scope notes in the footer.

## Application structure and navigation

Use a persistent application shell with three real destinations. Open **Plays** by default, not a marketing page or a long article. Desktop uses a compact left navigation rail; phones use a safe-area-aware bottom navigation bar with icons AND labels. Keep the active destination obvious. Use React Router hash routing so bookmarked destinations reload correctly on GitHub Pages without server rewrite rules.

| Destination | Main job | Required experience |
| --- | --- | --- |
| Plays — `#/plays` | Explore the assignment | Large interactive field, formation selection, playback, contextual coaching, favorites |
| Practice — `#/practice` | Explain it before revealing | Hidden-answer reps, next rep, self-review, session summary, review queue |
| Learn — `#/learn` | Build football understanding | Searchable vocabulary and short lessons grouped by topic |

A settings/help panel contains motion preference, field defaults, orientation explanation, coaching references, and a way to clear local practice data. It does not need another top-level destination.

Navigation preserves the selected scenario, zoom preference, and practice session. Leaving Plays pauses animation; returning restores the paused scene without starting playback by itself. Browser Back/Forward and direct links must work. Returning to a destination restores its sensible scroll position. Unknown routes show a useful recovery screen with a button back to Plays.

## Plays: the main workspace

Give the field the strongest visual emphasis. Use the available desktop width rather than keeping the old narrow article column. Keep the title and motivation compact in the app header. Preserve the foundational content in Learn so it remains available without pushing the field several screens down.

On desktop, arrange compact controls above a large field, with a contextual coaching panel alongside it. On phones, keep a short selection summary, the field, and playback controls together; reveal detailed selection controls in a clearly labeled drawer or compact collapsible panel. Keep the current call, formation, and ball/strength visible even when controls are collapsed.

The default flow should take only a few taps:

1. Choose formation, call, and ball/strength.
2. See your alignment and the current assignment summary.
3. Tap a player or coaching hotspot to understand the read.
4. Select Run, Pass, or QB run, then play or step through it.
5. Hide answers, explain your job, and reveal to check yourself.

Use formation cards with small accurate previews inside the formation picker. Make the four assignment choices clear segmented controls where they fit; do not squeeze them into unreadably small buttons. Keep outcome selection separate from playback phase. **At the snap** is an initial-read view, not a different offensive formation.

Include a small scenario title such as **Man · I-formation · Ball On Left Hash**. Provide Fit field, Focus SS, reset view, Tips on/off, Hide answers, favorite, and copy-link actions. Group secondary actions in a menu on narrow phones; do not put ten unlabeled icons around the field.

**Focus SS** must frame the SS together with his key, relevant edge/blockers, LOS, and route/fit space. Cropping to a single player removes the information needed to learn the rep. Whole-field overview remains one tap away.

## Interactive coaching bubbles

Make the field itself a teaching interface. Tips are tappable, not hover-only. Use small high-contrast info pins near relevant landmarks, plus tappable player markers. Avoid a pin on every player and avoid persistent open cards over the field.

Each hotspot has a stable ID, logical anchor, scenario applicability, a short title, one plain-language explanation, an optional deeper note, and an optional timeline cue. The explanation must come from the selected scenario's data. Examples:

| Anchor | Short prompt | What the interaction teaches |
| --- | --- | --- |
| SS | Your job | Alignment, leverage, help, and the selected run/pass assignment |
| Assigned TE or slot | Read this player | Block versus release; what that read changes in this example |
| Outside edge | Own your edge | Force keeps the runner inside; use the call's leverage |
| Hash or wide side | Find your side | Ball location, wide side, and the FS strength call |
| No. 2 receiver | Count from outside in | Which receiver is No. 2 in this formation |
| QB/RB exchange | Watch the fake | Keeper, handoff, and play-action are different reads |
| Coverage area | Your pass job | The modeled zone or matchup and when run support begins |

Use only relevant tips for that selection. If the specific read key or teammate assignment is not established, say what is modeled and direct the athlete to the assigned team rule rather than inventing it. Tapping an unmodeled defender can explain the position's name without claiming his responsibility on this play.

Desktop opens a small anchored popover that stays inside the field viewport. Phones open a compact bottom sheet above the navigation, leaving useful field context visible. Close by a clear button, Escape, or outside tap; manage focus and return it to the invoking marker. One tip is open at a time. Switching the scenario closes incompatible tips and prevents stale content.

Opening a tip during playback pauses the timeline. If the tip has a timeline cue, offer an explicit **Show this moment** action; do not unexpectedly jump the play when simply reading. Offer **Highlight on field** to emphasize the relevant key, edge, or coverage space while dimming unrelated marks briefly. If Continue is offered, it resumes only when the user taps it.

Pins follow their logical anchors through zoom, pan, and resize. Avoid DOM positions calculated once at mount. Provide an accessible **Tips for this play** list equivalent so tiny SVG targets are not the only entry point.

In hidden-answer practice, remove assignment-revealing bubbles, defensive motion, labels, and highlights. Neutral offense/formation explanations may remain. Do not let a tooltip, keyboard label, or auto-open sheet reveal the solution.

## More animation and application polish

Build a readable sequence rather than simply fading different arrow diagrams. Preserve the detailed animation requirements later in this document and add:

- Small phase chips — **Before snap / Read / React** — synchronized with the timeline. Clicking a phase seeks to that phase.
- Smooth SS alignment movement when switching between a TE and a slot matchup, preserving the modeled leverage and stable player identity.
- Receiver releases, RB action, and ball movement that make the run/pass clue visible. No ball teleporting from the RB back to the QB.
- Optional **Coach view** overlays for read key, force edge, or assigned coverage, individually toggled without changing the assignment.
- A subtle SS focus ring and brief emphasis when a tip highlights an area. Avoid a continuous pulsing field.
- A ghost of the SS's pre-snap position during playback, toggleable for teaching his movement.
- Brief phase-specific captions generated from the scenario, such as “He releases—stay with your man.” Captions must agree with the animated example and the coverage trigger.
- Fluid drawer, sheet, and panel transitions. Keep animation durations restrained and respect reduced motion everywhere.
- Immediate feedback for favorites and Copy link. An inline confirmation is enough; do not interrupt learning with modal success dialogs.

Do not autoplay on page load, scenario changes, or repeat loops. The athlete controls the rep. Route transitions should feel quick and should not blank or remount the field unnecessarily. Preserve a stable viewport while panels open so the player does not lose the SS.

## Practice, progress, and saved reps

Provide a real Practice destination. Let the athlete filter by call or formation, then start a short configurable session (default five reps). Each rep starts with answers hidden and asks for alignment, key, and job. Reveal shows the modeled explanation; **Got it / Review again** records self-review. Use clear labels that avoid implying coach-verified scoring.

Show session position, completed reps, and a short ending summary. Offer **Practice review reps** for scenarios marked Review again. Store progress locally with schema versioning. No accounts, rankings, invented skill grades, or cloud sync.

Favorites save the scenario selection and a short descriptive title. They are available from Plays and can launch a practice rep. Include empty states with a clear action and allow removing a favorite. Save only valid scenario IDs, not a screenshot or an entire generated SVG.

## Learn: general knowledge with useful navigation

Move the existing general football information into short, scannable topic groups: Before the snap; Read run or pass; Keep the edge; Beat blocks and pursue; Tackle and finish; Coverage basics; Football vocabulary. Preserve the current coaching sources and plain-language definitions.

Add local search across vocabulary and lesson titles/body text, a clear no-results state, and contextual links from field tips to a relevant lesson. A lesson opened from a play should include **Back to your play**, restoring the same scenario. Do not duplicate or paraphrase rules separately until they drift; share the underlying content records.

Keep the guidance written for a new teenage athlete, with short examples and optional advanced detail. Present a few “Try it on the field” links that open a supported scenario illustrating the lesson. Do not add unsourced schemes just to create more lessons.

## Preserve these choices

| Setting | Values |
| --- | --- |
| Assignment | Power, Blitz, Zone, Man |
| Ball/strength | Ball On Left Hash; Middle / Laso; Middle / River; Ball On Right Hash |
| Formation | Trips 3×1, balanced 2×2, pro set, double TE, empty 3×2, I-formation, offset I, pistol 2×2 |
| Outcome | At the snap, Run, Pass, QB run |
| Learning controls | Hide/show answers, selection-specific Info, expandable advanced notes |
| Field controls | Fit whole field; zoom to readable detail; pan across the field |

Keep formation tendencies described as run-leaning, pass-leaning, or neutral. Do not invent opponent statistics or claim a formation guarantees the next play.

## Football correctness

The current page is the migration baseline, not proof that every statement is an official team rule. Preserve its explicit distinctions and document any substantive coaching correction separately.

- Historical defensive foundation: Gary Patterson's TCU 4–2–5 install linked in the current footer.
- Power is the family-discussed run-support interpretation. The team's exact Power call has not been verified. Do not advertise the four buttons as four official TCU calls.
- Blitz illustrates an outside safety rush with the end inside. Zone illustrates curl/flat. Man illustrates a No. 2 matchup. These are representative assignments, not complete coverage installations.
- River means right; Laso means left. FS calling strength and these names are family-supplied team terminology. The coaches' directional convention remains unconfirmed.
- On the hashes, the current guide expects wide-side strength, subject to the FS/team call. Do not redefine all defensive strength as always the wide side.
- Force keeps the runner inside toward help. Spill sends the runner outside toward force support. These are different jobs.
- On Man against an attached TE, the SS must remain OUTSIDE the TE in this teaching example, separated from the defensive end. Preserve the outside leverage in alignment and movement on both sides. Slot-matchup leverage can differ; do not apply one universal man rule.
- A scrambling QB can still throw. Man stays with the assigned receiver until the coverage's run-support trigger. Zone likewise retains coverage until its rule triggers support. A confirmed keeper and a scrambling passer are different scenarios.
- Coverage defenders follow their assigned read keys; do not teach every call as staring at the quarterback.
- Preserve shoulder-contact, wrap, balance, block-shedding, pursuit, and controlled physical finish guidance. Do not introduce head-first contact, late hits, or blanket diving-at-knees advice.
- Maintain eleven offensive and eleven defensive players in each base formation. These examples have seven offensive players on the line. A WR outside an eligible attached TE is off the line so the TE is not covered up.

Do not invent whole-team post-snap choreography. Animate the SS, offensive example, ball, and only the teammate support movements already justified by the selected scenario. Leave other defenders static if their assignments are unspecified.

## Field orientation — resolve once

**Defense must be on TOP. Offense must be BELOW.** This is a fixed overhead coaching view.

Directions follow the defender facing the offense: defensive right appears on screen-left; defensive left appears on screen-right. A defensive-left hash selection places the ball toward screen-right. Its wide side is defensive-right, which appears screen-left. Keep this explicit and consistent in controls, sideline labels, hash labels, FS calls, text, and animation paths.

Use logical football coordinates independent of the viewport. Apply one tested projection to screen coordinates. Do not mirror the complete SVG or text with CSS `scaleY`, and do not stack transforms to repair orientation. Keep lettering upright. Put the viewpoint note above the field without a large information card.

## Technical approach

Use React + TypeScript + Vite, React Router with hash routes, native SVG for the field, and Motion for React for UI/alignment transitions. Use a single play timeline for player and ball movement. Avoid a backend, authentication, API keys, server rendering, or a database. Use local storage only for lightweight preferences and study progress, with error handling and a versioned schema.

Use current compatible stable dependencies, commit the lockfile, and pin a supported Node runtime in the repository. Follow official documentation rather than guessing package APIs.

Suggested boundaries:

- `AppShell`: desktop rail, mobile navigation, route content, settings/help, and focus/scroll behavior.
- `PlaysPage`, `PracticePage`, `LearnPage`: the three complete destinations.
- `PlayStudy`: cohesive selection/field/explanation panel.
- `PlayControls`: accessible selections and outcome buttons.
- `FieldViewport`: responsive sizing, fit, zoom, pan, reset view.
- `FootballField`: SVG field surface, hashes, sidelines, LOS.
- `PlayerMarker`, `AssignmentPath`, `BallMarker`, `CoverageArea`: stable reusable SVG primitives.
- `PlaybackControls`: play, pause, replay, speed, scrubber.
- `SelectedPlayNotes`: tips and advanced details for the current scenario.
- `StudyMode`: hidden-answer practice and reveal.
- `CoachingHotspots`, `TipPopover`, `TipSheet`: scenario-driven field teaching interactions.
- `Favorites`, `PracticeSession`, `ReviewQueue`: saved scenarios and local self-review.
- `LessonSearch`, `LessonDetail`: searchable general football knowledge.
- `FootballKnowledge`: general technique and vocabulary.
- `CoachingReferences`: expandable footer sources/scope.

Extract typed data modules for formations, assignment rules, scenario notes, glossary, and references. A pure `deriveScenario(selection)` should produce the player alignment, assignment paths, timeline, labels, and explanatory content together. Avoid separate branches that let the text and field disagree.

Centralize selection and playback events with a reducer. Keep high-frequency timeline progress outside global React rerenders: use motion values or an isolated animation controller. Stable player IDs must survive formation changes. Render SVG declaratively; do not port `innerHTML` redraws or direct DOM mutation.

## Animation requirements

Animations explain decisions. Avoid decorative bouncing, spinning, fake collisions, or constant automatic loops.

1. Formation changes smoothly reposition the existing players in roughly 250–400 ms. Stable players should not disappear and remount.
2. Alignment remains visible before playback. Press Play to progress through **Before snap → Read → React** over a clear 2–4 second teaching sequence.
3. Move player markers along their actual paths. Path drawing alone is not play animation.
4. Show ball ownership correctly: QB starts with the snap; a handoff transfers possession; a pass leaves the QB and travels toward the target. Distinguish ball flight from a receiver route.
5. Keep the SS orange movement path visible in normal learning mode. Other shown assignments remain maroon; offensive movement/ball uses the current gray-blue treatment.
6. Add Play/Pause, Replay, 0.5×/1× speed, and a labeled time/progress scrubber. Pausing and scrubbing must show the same positions for the same time.
7. Selection changes cancel old playback, reset to pre-snap, and refresh the related explanation. Rapid changes must not leave ghost arrows or stale animations.
8. Pausing, tab backgrounding, or unmounting must stop scheduled animation work. Replay cannot start another concurrent timeline.
9. Honor reduced-motion preferences. Provide step-through/static frames that preserve the same coaching information; do not make learning depend on motion.

Keep route endpoints and arrowheads continuous. Use stable SVG marker IDs, rounded joins, sufficient label clearance, and visible separation between a player's starting position and nearby markers. Use the same path geometry for the arrow and the moving player.

## Mobile comes first

The field is the main product, not a tiny illustration in a card. Test portrait first, then landscape and desktop.

- No page-level horizontal overflow at 320, 375, 390, 430, 768, and 1280 px widths.
- Only the field viewport may pan horizontally when zoomed. Page scrolling must still work with a finger over the field.
- Offer both a whole-field overview and a readable detail view centered on the SS. Prefer readable detail as the phone default, with a visible Fit field control.
- Add tap zoom controls and Reset view. Support touch panning; pinch zoom is useful only if implemented without breaking normal browser/page gestures. Do not disable global browser zoom.
- Keep readable player labels in detail mode, a distinct SS marker, thick sidelines, and usable space beyond each sideline. Avoid marker/label overlap, especially SS versus DE/TE.
- Keep all selections and playback controls usable with 44 px minimum touch targets. Wrap outcome buttons cleanly; keep the eye icon and Info button reliable.
- Put assignment-specific explanation immediately below the field. Keep Info collapsed initially and avoid covering the field with a persistent bubble.
- Resizing or rotating the phone preserves the scenario, recalculates the view, and does not restart a play unexpectedly.
- Use the field container's size, not the outer page's size. Observe the relevant container and avoid resize/redraw feedback loops.
- An optional full-screen field view is welcome, using supported browser behavior with a CSS overlay fallback and a clear Exit control.

## Study functionality

Keep the eye toggle and make its behavior complete: hide defensive paths, shaded coverage, answer labels, and selected assignment explanations. Stop or suppress defensive movement that would reveal the answer. Preserve the offense and enough formation context to reason about the play. Accessible descriptions/tooltips must not leak the hidden answers.

Add **Next rep** to choose a different valid combination without immediately repeating the same one. Keep Hide answers active between reps. Prompt the athlete to identify alignment, key, and run/pass job before revealing.

Add simple self-review after reveal: **Got it / Review again**. Save locally and label it self-reported practice, not a measured coaching score. Do not add an objective answer key for rules that depend on an unverified team call.

Save the last selection and preferred field view. Add **Copy link to this rep** using validated search parameters inside the hash route, for example `/fb-guide/#/plays?call=Man&formation=i&ball=left&outcome=pass`. Read these through the router rather than `window.location.search`, which does not contain the search portion inside the hash. Sharing must work under `/fb-guide/`; no login or cloud sync is required. Unknown parameters fall back safely. Hiding answers stays a local preference unless deliberately included in a study link.

## Accessibility and resilience

Use native controls or well-tested accessible primitives. Keyboard access must cover selections, reveal, playback, scrubber, Info, and viewport controls. Announce meaningful scenario changes without reading every animation frame. Give the field a concise accessible description and provide a text equivalent of the assignment.

Color is not the only cue: identify SS by its label and stronger outline. Respect reduced motion and browser zoom. Keep focus visible and restore it after overlays. Catch invalid persisted/query state and recover without a blank screen.

## Migration and deployment

1. Preserve the original HTML and inventory its behavior/content before rebuilding.
2. Build the application shell, navigation, typed scenario data, and one complete vertical slice: a usable Man-vs-TE example with playback and a contextual tip. Then establish parity across all current selections.
3. Replace the diagram engine with native SVG coordinates and verify orientation/alignment.
4. Add deterministic playback and the improved phone viewport.
5. Complete contextual hotspots, Practice sessions, favorites/review queue, searchable Learn, persisted preferences, and shareable selections.
6. Polish spacing, focus behavior, and the selected/general knowledge separation.
7. Run the checks below; provide a local preview and validation report.

The new Vite build replaces the old single-file root `index.html`. Configure Vite `base` as `/fb-guide/` for this repository. Use hash routes for Plays, Practice, and Learn. Test route reloads and shared scenarios against the actual production base path; do not switch to history routes that require GitHub Pages rewrite support.

Prepare a GitHub Actions workflow that installs from the lockfile, runs validation, builds, uploads `dist`, and deploys with GitHub Pages' supported actions. Use current official action versions. Production deployment should run from the intended production branch; PR checks must not publish. Explain that repository **Settings → Pages → Source** must change from **Deploy from a branch** to **GitHub Actions** before the built React app is published. Serving raw Vite source through the current branch setting will not deploy the app correctly.

Update README with install/dev/build/test/preview commands, the Pages setup, and the legacy URL. Do not claim the React version remains a double-click standalone HTML file. No service worker in this first rebuild; avoid adding stale-cache behavior during deployment changes.

## Required checks and completion criteria

Write useful tests for behavior and football geometry, not tests that merely repeat component implementation.

- All 512 base selections derive valid scenarios: 4 assignments × 4 ball/strength choices × 8 formations × 4 outcomes.
- Each base lineup has 11 offense and 11 defense, with legal example eligibility and seven offensive players on the line.
- Side projection is correct for both hash selections and both middle declarations.
- Man SS is outside the TE on either side in all TE-bearing formations, with visible DE separation.
- Player routes, ball paths, notes, and selected outcome agree. No NaN coordinates, off-field endpoints, broken markers, or stale animation state.
- Scrambling-pass threat keeps man coverage until the documented trigger. Do not use a run-fit animation while explaining continued coverage.
- Hide/reveal works across selection changes, playback, replay, Info, and Next rep without leaking answers.
- Fit, zoom, pan, reset, resize, and orientation changes preserve the scenario and keep the SS accessible.
- Play/Pause/Replay/scrubbing/speed transitions remain deterministic under rapid interaction.
- Local persistence and shared links restore valid state and recover from malformed values.
- All three destinations are implemented and navigable; no placeholder pages or inert controls. Back/Forward, direct links, and reloads work under `/fb-guide/`.
- Tips stay anchored and on-screen through pan/zoom/resize; open/close/highlight/seek actions work with touch and keyboard.
- Practice sessions, favorites, review queue, search, empty states, and return-to-play behavior work end to end.
- Type checking, production build, and relevant unit/integration/browser tests pass.
- Capture representative mobile screenshots for trips, empty, I, and double TE, on both sides, including Man, hidden answers, fit/detail, and an animation midpoint.
- Use browser-level tests in Chromium and WebKit if available; report actual coverage. WebKit emulation is not actual iPhone Safari testing. If a real-device test cannot be run, explicitly leave that validation outstanding rather than claiming mobile perfection.

Deliver the implementation, clear setup commands, a working local preview, screenshots, a concise change/test report, and any unresolved football assumptions. Finish a usable application rather than a scaffold or a plan.

## Official implementation references

- [React Router HashRouter](https://reactrouter.com/api/declarative-routers/HashRouter)
- [React reducer guidance](https://react.dev/reference/react/useReducer)
- [Motion SVG animation](https://motion.dev/docs/react-svg-animation)
- [Motion reduced-motion configuration](https://motion.dev/docs/react-motion-config)
- [Vite GitHub Pages deployment](https://vite.dev/guide/static-deploy)

## Kickoff prompt

> Read REACT-HANDOFF.md, index.html, README.md, and repository instructions. Build the full React application specified in the handoff on a feature branch. Implement real Plays / Practice / Learn navigation, a dominant mobile-friendly play workspace, tappable contextual coaching bubbles, and synchronized player/ball playback with play/pause/replay/phase stepping. Add local favorites, self-review sessions, a review queue, and searchable football knowledge. Preserve the existing coaching baseline, defense-on-top orientation, defender-based directions, and outside TE leverage in Man. Use React + TypeScript + Vite, Motion, and hash routing for GitHub Pages. Complete and verify the app rather than wrapping the old HTML or delivering a scaffold. Provide a local preview, mobile screenshots, and a validation report. Prepare deployment configuration without publishing over the current site.
