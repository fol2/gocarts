import { describe, expect, it } from 'vitest';
import { STARTER_LOADOUT } from '../catalogue';
import { createMatchSetup } from '../match';
import { createStarterProgress } from '../progression';
import { advanceProjectiles, collectNearbyPickups, createInitialSimulation, fireWeapon, PLAYER_ID, stepSimulation } from '../simulation';
import type { GameMode } from '../types';

function setup(mode: GameMode = 'race') {
  return createMatchSetup(mode, 'computers', STARTER_LOADOUT, createStarterProgress());
}

describe('simulation', () => {
  it('lets players collect weapons in a race', () => {
    let state = createInitialSimulation(setup('race'));
    state.actors[0].position = { ...state.pickups[0].position };

    state = collectNearbyPickups(state, PLAYER_ID);

    expect(state.actors[0].weapon).toBe(state.pickups[0].weapon);
    expect(state.pickups[0].active).toBe(false);
  });

  it('fires weapons and scores when an opponent is hit', () => {
    let state = createInitialSimulation(setup('battleground'));
    state.actors[0] = { ...state.actors[0], weapon: 'rocket', heading: 0, position: { x: 0, z: 0 } };
    state.actors[1] = { ...state.actors[1], position: { x: 0, z: 3 }, health: 40 };

    state = fireWeapon(state, PLAYER_ID);
    state = advanceProjectiles(state, 0.04);

    expect(state.actors[0].score).toBe(1);
    expect(state.actors[1].health).toBe(100);
  });

  it('tracks lap progress in race modes', () => {
    let state = createInitialSimulation(setup('race'));
    state.actors[0] = { ...state.actors[0], speed: 120, lapDistance: 95.8 };

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(state.actors[0].lap).toBeGreaterThanOrEqual(1);
  });

  it('requires combat and race progress in battleground race', () => {
    let state = createInitialSimulation(setup('battleground-race'));
    state.actors[0] = { ...state.actors[0], lap: 2, score: 2 };

    state = stepSimulation(state, { accelerate: false, brake: false, left: false, right: false, fire: false, jump: false }, 0.02);
    expect(state.finished).toBe(false);

    state.actors[0] = { ...state.actors[0], score: 3 };
    state = stepSimulation(state, { accelerate: false, brake: false, left: false, right: false, fire: false, jump: false }, 0.02);
    expect(state.finished).toBe(true);
  });

  it('glider stats extend airtime after a jump', () => {
    const state = createInitialSimulation(setup('race'));
    const jumped = stepSimulation(state, { accelerate: false, brake: false, left: false, right: false, fire: false, jump: true }, 0.02);

    expect(jumped.actors[0].airborne).toBeGreaterThan(0.8);
  });
});
