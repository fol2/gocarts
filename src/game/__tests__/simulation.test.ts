import { describe, expect, it } from 'vitest';
import { STARTER_LOADOUT } from '../catalogue';
import { createMatchSetup } from '../match';
import { createStarterProgress } from '../progression';
import {
  advanceProjectiles,
  collectNearbyPickups,
  createInitialSimulation,
  fireWeapon,
  getCountdownCue,
  isWaitingForGo,
  PLAYER_ID,
  RACE_COUNTDOWN_SECONDS,
  stepSimulation
} from '../simulation';
import { ROAD_WIDTH, TRACK_LENGTH, constrainPointToRoad, routePointAt, startGridPose, trackSidePoint } from '../track';
import type { GameMode } from '../types';

function setup(mode: GameMode = 'race') {
  return createMatchSetup(mode, 'computers', STARTER_LOADOUT, createStarterProgress());
}

describe('simulation', () => {
  it('lets players collect weapons in a race', () => {
    let state = createInitialSimulation(setup('race'));
    state.actors[0].position = { ...state.pickups[0].position };
    state.time = RACE_COUNTDOWN_SECONDS;

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

  it('lets a carried shield block the next incoming hit', () => {
    let state = createInitialSimulation(setup('battleground'));
    state.actors[0] = { ...state.actors[0], weapon: 'shield', position: { x: 0, z: 0 }, health: 100 };
    state.projectiles = [
      {
        id: 'incoming-rocket',
        ownerId: state.actors[1].id,
        weapon: 'rocket',
        position: { x: 0, z: -1 },
        heading: 0,
        speed: 0,
        ttl: 1,
        damage: 55,
        radius: 1.1
      }
    ];

    state = advanceProjectiles(state, 0.01);

    expect(state.actors[0].health).toBe(100);
    expect(state.actors[0].weapon).toBeUndefined();
    expect(state.actors[0].shield).toBe(0);
    expect(state.messages.at(-1)).toContain('blocked');
  });

  it('uses an active shield before consuming a carried shield', () => {
    let state = createInitialSimulation(setup('battleground'));
    state.actors[0] = { ...state.actors[0], weapon: 'shield', shield: 1.5, position: { x: 0, z: 0 }, health: 100 };
    state.projectiles = [
      {
        id: 'first-incoming-rocket',
        ownerId: state.actors[1].id,
        weapon: 'rocket',
        position: { x: 0, z: -1 },
        heading: 0,
        speed: 0,
        ttl: 1,
        damage: 55,
        radius: 1.1
      }
    ];

    state = advanceProjectiles(state, 0.01);

    expect(state.actors[0].health).toBe(100);
    expect(state.actors[0].shield).toBe(0);
    expect(state.actors[0].weapon).toBe('shield');

    state.projectiles = [
      {
        id: 'second-incoming-rocket',
        ownerId: state.actors[1].id,
        weapon: 'rocket',
        position: { x: 0, z: -1 },
        heading: 0,
        speed: 0,
        ttl: 1,
        damage: 55,
        radius: 1.1
      }
    ];

    state = advanceProjectiles(state, 0.01);

    expect(state.actors[0].health).toBe(100);
    expect(state.actors[0].weapon).toBeUndefined();
  });

  it('tracks lap progress in race modes', () => {
    let state = createInitialSimulation(setup('race'));
    state.time = RACE_COUNTDOWN_SECONDS;
    state.actors[0] = { ...state.actors[0], speed: 120, lapDistance: TRACK_LENGTH - 0.2 };

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(state.actors[0].lap).toBeGreaterThanOrEqual(1);
  });

  it('requires combat and race progress in battleground race', () => {
    let state = createInitialSimulation(setup('battleground-race'));
    state.time = RACE_COUNTDOWN_SECONDS;
    state.actors[0] = { ...state.actors[0], lap: 2, score: 2 };

    state = stepSimulation(state, { accelerate: false, brake: false, left: false, right: false, fire: false, jump: false }, 0.02);
    expect(state.finished).toBe(false);

    state.actors[0] = { ...state.actors[0], score: 3 };
    state = stepSimulation(state, { accelerate: false, brake: false, left: false, right: false, fire: false, jump: false }, 0.02);
    expect(state.finished).toBe(true);
  });

  it('glider stats extend airtime after a jump', () => {
    const state = createInitialSimulation(setup('race'));
    state.time = RACE_COUNTDOWN_SECONDS;
    const jumped = stepSimulation(state, { accelerate: false, brake: false, left: false, right: false, fire: false, jump: true }, 0.02);

    expect(jumped.actors[0].airborne).toBeGreaterThan(0.8);
  });

  it('lines race actors up on the start grid', () => {
    const state = createInitialSimulation(setup('battleground-race'));

    expect(state.actors[0].position).toMatchObject({
      x: expect.closeTo(startGridPose(0).x, 5),
      z: expect.closeTo(startGridPose(0).z, 5)
    });
    expect(state.actors[1].position).toMatchObject({
      x: expect.closeTo(startGridPose(1).x, 5),
      z: expect.closeTo(startGridPose(1).z, 5)
    });
  });

  it('shows a countdown and locks race movement until GO', () => {
    let state = createInitialSimulation(setup('race'));
    const startPosition = { ...state.actors[0].position };

    expect(getCountdownCue('race', 0)).toBe('3');
    expect(getCountdownCue('race', 1.1)).toBe('2');
    expect(getCountdownCue('race', 2.1)).toBe('1');
    expect(getCountdownCue('race', 3)).toBe('GO');
    expect(isWaitingForGo('race', 2.99)).toBe(true);

    for (let index = 0; index < 59; index += 1) {
      state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: true, jump: true }, 0.05);
    }

    expect(state.actors[0].position).toEqual(startPosition);
    expect(state.projectiles).toHaveLength(0);

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);
    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(state.time).toBeGreaterThan(RACE_COUNTDOWN_SECONDS);
    expect(state.actors[0].position.z).not.toBe(startPosition.z);
  });

  it('advances the countdown using real elapsed time without moving before GO', () => {
    let state = createInitialSimulation(setup('race'));
    const startPosition = { ...state.actors[0].position };

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: true, jump: true }, 1.25);

    expect(state.time).toBeCloseTo(1.25, 5);
    expect(getCountdownCue('race', state.time)).toBe('2');
    expect(state.actors[0].position).toEqual(startPosition);
    expect(state.projectiles).toHaveLength(0);

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: true, jump: true }, 1.5);

    expect(getCountdownCue('race', state.time)).toBe('1');
    expect(state.actors[0].position).toEqual(startPosition);
    expect(state.projectiles).toHaveLength(0);

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.3);

    expect(getCountdownCue('race', state.time)).toBe('GO');
    expect(state.actors[0].position).not.toEqual(startPosition);
  });

  it('bounds active catch-up simulation after a large frame delay', () => {
    let state = createInitialSimulation(setup('race'));

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 10);

    expect(state.time).toBeCloseTo(10, 5);
    expect(state.actors[0].lapDistance).toBeGreaterThan(0);
    expect(state.actors[0].lapDistance).toBeLessThan(5);
  });

  it('does not use the start countdown in battleground mode', () => {
    let state = createInitialSimulation(setup('battleground'));
    const startPosition = { ...state.actors[0].position };

    expect(getCountdownCue('battleground', 0)).toBeUndefined();

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(state.actors[0].position).not.toEqual(startPosition);
  });

  it('keeps race carts on the road when steering off course', () => {
    let state = createInitialSimulation(setup('race'));
    state.time = RACE_COUNTDOWN_SECONDS;
    state.actors[0] = { ...state.actors[0], position: { x: 0, z: 0 }, heading: Math.PI / 2, speed: 70 };

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(Math.hypot(state.actors[0].position.x, state.actors[0].position.z)).toBeGreaterThan(24);
  });

  it('keeps race carts inside the road after sustained steering towards the verge', () => {
    let state = createInitialSimulation(setup('race'));
    state.time = RACE_COUNTDOWN_SECONDS;

    for (let index = 0; index < 100; index += 1) {
      state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: true, fire: false, jump: false }, 0.05);
    }

    expect(constrainPointToRoad(state.actors[0].position).onRoad).toBe(true);
  });

  it('keeps battleground-race carts inside the road after sustained steering towards the verge', () => {
    let state = createInitialSimulation(setup('battleground-race'));
    state.time = RACE_COUNTDOWN_SECONDS;

    for (let index = 0; index < 100; index += 1) {
      state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: true, fire: false, jump: false }, 0.05);
    }

    expect(constrainPointToRoad(state.actors[0].position).onRoad).toBe(true);
  });

  it('does not give lap progress while a race cart pushes into the road boundary', () => {
    let state = createInitialSimulation(setup('race'));
    const routeDistance = 24;
    const pose = routePointAt(routeDistance);
    const verge = trackSidePoint(routeDistance, 1, ROAD_WIDTH / 2 - 0.7);
    state.time = RACE_COUNTDOWN_SECONDS;
    state.actors[0] = {
      ...state.actors[0],
      position: verge,
      heading: pose.heading + Math.PI / 2,
      speed: 35,
      lapDistance: routeDistance
    };

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(state.actors[0].lapDistance).toBeLessThan(routeDistance + 0.2);
  });

  it('does not give lap progress while driving backwards along the race route', () => {
    let state = createInitialSimulation(setup('race'));
    const routeDistance = 40;
    const pose = routePointAt(routeDistance);
    state.time = RACE_COUNTDOWN_SECONDS;
    state.actors[0] = {
      ...state.actors[0],
      position: { x: pose.x, z: pose.z },
      heading: pose.heading + Math.PI,
      speed: 35,
      lapDistance: routeDistance
    };

    state = stepSimulation(state, { accelerate: false, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(state.actors[0].lapDistance).toBeLessThanOrEqual(routeDistance + 0.01);
  });

  it('places pickups on reachable ground for each mode', () => {
    const race = createInitialSimulation(setup('race'));
    const battleRace = createInitialSimulation(setup('battleground-race'));
    const battleground = createInitialSimulation(setup('battleground'));

    expect(race.pickups).toHaveLength(10);
    expect(battleRace.pickups).toHaveLength(10);
    expect(battleground.pickups).toHaveLength(6);
    expect(race.pickups.every((pickup) => constrainPointToRoad(pickup.position).onRoad)).toBe(true);
    expect(battleRace.pickups.every((pickup) => constrainPointToRoad(pickup.position).onRoad)).toBe(true);
    expect(battleground.pickups.every((pickup) => Math.abs(pickup.position.x) <= 20 && Math.abs(pickup.position.z) <= 20)).toBe(true);
  });

  it('does not locally advance locked online remote actors into a race win', () => {
    let state = createInitialSimulation(createMatchSetup('race', 'online', STARTER_LOADOUT, createStarterProgress(), 'RACE42'));
    const remoteActor = state.actors[1];
    const pose = routePointAt(TRACK_LENGTH - 0.1);
    state.time = RACE_COUNTDOWN_SECONDS;
    state.actors[1] = {
      ...remoteActor,
      position: { x: pose.x, z: pose.z },
      heading: pose.heading,
      speed: 100,
      lapDistance: TRACK_LENGTH - 0.1
    };

    state = stepSimulation(
      state,
      { accelerate: false, brake: false, left: false, right: false, fire: false, jump: false },
      0.05,
      { lockedActorIds: new Set([remoteActor.id]) }
    );

    expect(state.actors[1].lap).toBe(0);
    expect(state.actors[1].lapDistance).toBeCloseTo(TRACK_LENGTH - 0.1, 5);
    expect(state.finished).toBe(false);
  });

  it('still allows free movement in battleground arena mode', () => {
    let state = createInitialSimulation(setup('battleground'));
    state.actors[0] = { ...state.actors[0], position: { x: 0, z: 0 }, heading: Math.PI / 2, speed: 70 };

    state = stepSimulation(state, { accelerate: true, brake: false, left: false, right: false, fire: false, jump: false }, 0.05);

    expect(Math.abs(state.actors[0].position.x)).toBeLessThan(8);
    expect(Math.abs(state.actors[0].position.z)).toBeLessThan(2);
  });
});
