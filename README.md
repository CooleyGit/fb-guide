# Football Guide

An interactive strong-safety study tool built around TCU 4–2–5 defensive concepts, written for new junior-high and high-school football players.

**Know the call. Trust your read. Own your edge. Make the next play count.**

This is a React + TypeScript + Vite application. It replaces the earlier single-file `index.html`; that original page is preserved for reference (see [Legacy page](#legacy-page)).

## What you can study

- **Plays** — a large interactive field. Choose an assignment (Power, Blitz, Zone, Man), ball/strength, and one of eight formations; tap players or info pins for contextual coaching; play, pause, replay, and step through **Before snap → Read → React**; hide the answers to test yourself; and save or share a rep.
- **Practice** — short hidden-answer rep sessions. Say your alignment, key, and job, then reveal and self-review (**Got it / Review again**). Reps you flag collect in a review queue.
- **Learn** — searchable football vocabulary and short lessons grouped by topic, with “Try it on the field” links into supported plays.

**Defense is on top and offense is below.** Left/right labels follow the defender facing the offense: the defender’s right is screen-left, and the defender’s left is screen-right.

## Run locally

Requires Node (see [`.nvmrc`](.nvmrc) — Node 24; Node ≥ 20.19 works).

```bash
npm install        # install dependencies (uses the committed package-lock.json)
npm run dev        # start the Vite dev server
npm run build      # type-check and build the production bundle into dist/
npm run preview    # serve the built bundle at the production base path (/fb-guide/)
npm run typecheck  # type-check only
npm test           # run unit/integration tests (Vitest)
npm run e2e        # run browser tests (Playwright: Chromium, WebKit, mobile)
```

The app is **not** a double-click standalone HTML file anymore — it is a built single-page app. Use `npm run dev` while developing and `npm run preview` to check the production build.

For browser tests, install the browsers once with `npx playwright install chromium webkit`. `npm run e2e` builds the app and serves it at `http://localhost:4173/fb-guide/` automatically.

## Publish on GitHub Pages

The repository is configured to build and deploy with **GitHub Actions** (see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Serving the raw source through the old “Deploy from a branch” setting will **not** work for the built React app.

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, change from **Deploy from a branch** to **GitHub Actions**.
3. Push to `main` (or run the workflow). The workflow installs from the lockfile, type-checks, tests, builds, uploads `dist`, and deploys with GitHub Pages’ official actions.
4. Pull-request runs validate and build but **do not** publish.

For the `CooleyGit/fb-guide` repository, the published address is:

**https://cooleygit.github.io/fb-guide/**

Vite’s `base` is set to `/fb-guide/`, and the app uses hash routes (`#/plays`, `#/practice`, `#/learn`) so bookmarked destinations and shared rep links reload correctly on GitHub Pages without server rewrites. A shared rep looks like:

```
https://cooleygit.github.io/fb-guide/#/plays?call=Man&formation=i&ball=left&outcome=pass
```

Free GitHub Pages hosting requires a public repository.

### Legacy page

The original standalone guide is kept at [`public/legacy-guide.html`](public/legacy-guide.html) and ships at:

**https://cooleygit.github.io/fb-guide/legacy-guide.html**

## Coaching foundation

The defensive foundation references the [1999 Gary Patterson TCU defensive install](https://www.scribd.com/doc/311596840/1999-TCU-4-2-5-Defense-Gary-Patterson-DC-pdf). General technique guidance references [USA Football Shoulder Tackling](https://usafootball.com/coaches-organizations/shoulder-tackling) and [Blocking & Defeating Blocks](https://usafootball.com/coaches-organizations/blocking-defeating-blocks).

This is a personal learning guide, not an official school or TCU playbook. The diagrams isolate representative assignments rather than complete eleven-player calls. Formation tendencies are clues, not guarantees about the next play.

**Power** uses the run-support interpretation discussed while building the guide; the team’s exact definition has not been verified. **River = right**, **Laso = left**, and the FS strength call are family-supplied team terminology. Confirm the coaches’ left/right viewpoint before applying those calls to the diagrams.

Your coaches’ actual call, coverage, alignment, leverage, read keys, and adjustments take priority. Learn and practice contact techniques with your coaches.
