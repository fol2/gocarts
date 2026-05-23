---
status: active
created: 2026-05-23
type: feature
---

# Go-Carts Modes, Weapons, Unlocks Plan

## Problem Frame

The repo currently contains only `README.md`, so this work is a greenfield browser-game slice. Nelson wants a go-cart game where players can choose battlegrounds, races, or a combined battleground race mode; play against computers or online opponents; collect weapons in every mode; attack other players; unlock faster carts, wheels, and gliders; and check the speed of their setup.

## Scope

Build a first playable React-hosted 3D prototype using React Three Fiber. The game should run locally in a browser and provide complete menu-to-game flow for the requested modes, opponents, weapon pickups, attacks, unlockable parts, and stat inspection.

### In Scope

- Race, Battleground, and Battleground Race mode selection.
- Computer opponent mode with AI carts.
- Online opponent selection as an online-ready lobby mode with simulated remote opponents.
- Weapon pickups and attacks in all three game modes.
- Unlockable carts, wheels, and gliders with stat effects.
- Garage/stat panel showing speed, handling, glide, and boost.
- Focused unit tests for game rules and unlock/stat calculations.
- Browser smoke verification that the 3D scene renders and the main flow is usable.

### Deferred to Follow-Up Work

- Real internet multiplayer transport, accounts, matchmaking, and server authority.
- Persistent cloud saves.
- Production 3D models, animations, sound effects, and device-specific tuning.

## Assumptions

- Because the repo has no existing application or backend, the first implementation will create a Vite React app rather than integrate with an existing stack.
- Online play will be represented by a lobby choice and remote-style opponents that use the same simulation boundary as computer opponents, keeping the UI and code ready for a future network adapter.
- Progress unlocks can be stored in local React state for this first slice.

## Key Technical Decisions

- Use `@react-three/fiber`, `three`, and `@react-three/drei` for the 3D runtime because the requested skill and expected UI both fit a React-hosted game.
- Keep game rules in plain TypeScript modules under `src/game/` so tests can verify modes, weapons, AI, unlocks, and stats without a browser canvas.
- Keep HUD, mode selection, garage, and lobby controls in normal React DOM rather than drawing them inside WebGL.
- Use simple procedural geometry for carts, track, pickups, and projectiles to avoid blocking the feature on external assets.
- Use Vitest for fast local rule tests and Playwright/browser inspection for final smoke checks if the runtime is available.

## Requirements Traceability

- "choose battleground or races" maps to `mode` selection for Race and Battleground.
- "battlegroundraces" maps to a combined Battleground Race mode with laps and combat scoring.
- "against computers or online" maps to opponent type selection, computer AI, and online-ready simulated remote players.
- "weapons in the races, battlegrounds and battlegroundraces" maps to shared weapon pickup and attack logic across all modes.
- "unlock carts ... weeles ... gliders" maps to garage inventory and unlock progression.
- "check it's speed" maps to the garage stats panel and selected-loadout stat calculations.

## Implementation Units

### U1: Project Scaffold and Tooling

Create the browser app baseline.

Files:
- `package.json`
- `index.html`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/styles.css`
- `src/vite-env.d.ts`

Test scenarios:
- Install dependencies successfully.
- `npm run build` produces a production bundle.
- `npm test` runs the rule tests.

### U2: Game Data and Rules

Define modes, opponents, weapons, unlockable parts, stat calculations, and match setup.

Files:
- `src/game/types.ts`
- `src/game/catalogue.ts`
- `src/game/progression.ts`
- `src/game/match.ts`
- `src/game/__tests__/progression.test.ts`
- `src/game/__tests__/match.test.ts`

Test scenarios:
- Selecting Race, Battleground, or Battleground Race creates the correct objective text and scoring configuration.
- Every mode includes weapon pickups.
- Computer and online-ready opponent choices both create opponent rosters.
- Locked parts cannot be selected until their unlock condition is met.
- Selected cart, wheels, and glider produce the expected combined speed and glide stats.

### U3: App State and DOM UI

Implement the menu, opponent selection, garage, stats inspection, match HUD, and unlock feedback.

Files:
- `src/App.tsx`
- `src/ui/MainMenu.tsx`
- `src/ui/Garage.tsx`
- `src/ui/Hud.tsx`
- `src/ui/PartStatBars.tsx`
- `src/game/state.ts`

Test scenarios:
- A player can choose each mode and opponent type, then start a match.
- Garage shows locked and unlocked parts, with disabled locked selections.
- Stat bars update when the selected cart, wheels, or glider changes.
- Match end grants progress and unlocks the next eligible part.

### U4: React Three Fiber Scene and Gameplay Loop

Build the playable 3D arena with cart movement, AI/remote-style opponents, pickups, weapons, hits, laps, and glide/boost effects.

Files:
- `src/scene/GameCanvas.tsx`
- `src/scene/GameScene.tsx`
- `src/scene/Cart.tsx`
- `src/scene/Track.tsx`
- `src/scene/Pickup.tsx`
- `src/scene/Projectile.tsx`
- `src/game/simulation.ts`
- `src/game/__tests__/simulation.test.ts`

Test scenarios:
- Player controls move the cart and update position without forcing high-frequency state through the whole React app.
- Weapon pickup grants a weapon in every game mode.
- Firing a weapon can hit an opponent and update combat score.
- Race mode tracks lap progress.
- Battleground Race tracks both lap and combat progress.
- Glider stats affect airtime behaviour when jumping from ramps.

### U5: Verification and Documentation

Document how to run the game and verify it.

Files:
- `README.md`

Test scenarios:
- README explains install, dev, build, test, and the current online-mode limitation.
- Browser smoke check confirms the canvas is visible, the menu works, and a match can start.

## Sequencing

1. Scaffold the Vite React app and tooling.
2. Add typed game data and rules with tests.
3. Build the DOM UI and app state.
4. Add the 3D scene and simulation loop.
5. Verify with tests, build, and browser smoke checks.
6. Commit, push, and open a PR if GitHub access is available.

## Risks and Mitigations

- The repo has no existing stack, so dependency installation may be the main environmental risk. Use the bundled Codex runtime if system Node is unavailable.
- Full online multiplayer is much larger than the current blank repo supports. Keep the first implementation honest by making online mode selectable and architecturally ready while documenting that real networking is deferred.
- Browser-game physics can grow quickly. Keep the prototype on simple vector movement, collision radii, and procedural geometry.

## Verification

- `npm test`
- `npm run build`
- Browser smoke check of the menu, garage, mode start, canvas rendering, movement, weapon pickup, and attack flow.
