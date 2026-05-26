# Completion Report

## Shield Fix Update - 2026-05-26

### Contract Covered

- Fixed the shield gameplay bug where carrying a shield did not protect health from an incoming hit.
- A carried shield now blocks the next hit and is consumed.
- An active shield timer is used before a carried shield, so one hit does not consume both defences.
- The HUD now shows the shield icon when either an active shield timer or carried shield is ready.

### Root Cause

- Hit resolution only checked `actor.shield > 0`.
- Collected shields were stored as `actor.weapon === 'shield'` until fired, so incoming projectiles ignored carried shields and damaged health.

### Verification

- Reproduced with a failing regression test: carried shield allowed health to drop from 100 to 45.
- Targeted test: `npm test -- src/game/__tests__/simulation.test.ts` passed, 20 tests.
- Full suite: `npm test` passed, 5 files / 39 tests.
- Production build: `npm run build` passed with no warnings on final run.
- Localhost dev smoke: `http://127.0.0.1:5173/` returned 200, `favicon.svg` returned 200, and the in-app browser reported 0 console errors.
- Production preview smoke: `http://127.0.0.1:4176/` returned 200 and `favicon.svg` returned 200.
- Browser screenshot evidence: `C:/Users/nelso/AppData/Local/Temp/gocarts-shield-fix-qa.png`.

### Review Status

- Code reviewer: GREEN after adding the overlapping active-shield-plus-carried-shield regression.
- Contract auditor: final audit is run after commit and push.

### Git Delivery

- Local `main` was refreshed from `origin/main`.
- `main` at `eff633a` is an ancestor of the delivery branch.
- Delivery branch: `codex/gocarts-modes-weapons-unlocks`.
- PR: `https://github.com/fol2/gocarts/pull/1`.
- Unrelated untracked `pet-runs/` files were left untouched and are not part of delivery.

## Contract Covered

- Race, Battleground, and Battleground Race modes remain selectable.
- Computer opponents and Online room opponents are selectable.
- Race and Battleground Race now place carts on the start line, show a 3, 2, 1, GO countdown, and lock movement/fire/jump until GO.
- Supporting browsers speak the countdown with `speechSynthesis`; the visual countdown remains the fallback when speech is unavailable.
- Race and Battleground Race carts are constrained to the road.
- The road is now a longer routed course with start line, rails, ramps, boost pads, pickups, spectator stands, and shouting crowd bubbles.
- Weapons, attacking, unlockable carts/wheels/gliders, and stat checking remain in the garage/match flow.
- Online mode now has a six-character room code and BroadcastChannel transport for live same-origin browser rooms, with remote racers filling empty slots when nobody else is present.

## Verification

- `npm test`: 5 test files passed, 37 tests passed.
- `npm run build`: passed with no Vite warnings.
- Local server HTTP smoke:
  - `http://127.0.0.1:5173/` returned 200.
  - `http://127.0.0.1:5173/favicon.svg` returned 200 with `image/svg+xml`.
- Localhost browser evidence captured:
  - `C:/Users/nelso/AppData/Local/Temp/gocarts-countdown-start-qa.png`
  - `C:/Users/nelso/AppData/Local/Temp/gocarts-go-cue-qa.png`
- The in-app browser reported no console errors during the captured countdown/GO smoke checks.
- After the final online/favIcon changes, the in-app browser blocked a reload under its URL policy, so the latest static-server checks were verified through HTTP and production build output.

## Review Status

- Code reviewer: GREEN after fixing countdown catch-up bounds, route-based race progress, mode-aware pickups, staged new files, live online actor locking, and BroadcastChannel payload validation.
- Contract auditor: first pass blockers were addressed before commit/push; final audit is run after the delivery push.

## Git Delivery

- Local `main` was refreshed from `origin/main`.
- `main` at `eff633a` is an ancestor of the delivery branch.
- Delivery branch: `codex/gocarts-modes-weapons-unlocks`.
- PR: `https://github.com/fol2/gocarts/pull/1`.
- Unrelated untracked `pet-runs/` files were left untouched and are not part of delivery.
