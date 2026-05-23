import { getWeaponById, WEAPONS } from './catalogue';
import { modeUsesCombatScore, modeUsesRaceProgress } from './match';
import type { MatchSetup, StatBlock, WeaponType } from './types';

export interface Vec2 {
  x: number;
  z: number;
}

export interface InputState {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  jump: boolean;
}

export interface SimActor {
  id: string;
  name: string;
  colour: string;
  isPlayer: boolean;
  style: 'player' | 'computer' | 'remote';
  position: Vec2;
  heading: number;
  speed: number;
  health: number;
  shield: number;
  weapon?: WeaponType;
  score: number;
  lap: number;
  lapDistance: number;
  airborne: number;
  glideMeter: number;
  hitFlash: number;
  stats: StatBlock;
}

export interface PickupState {
  id: string;
  weapon: WeaponType;
  position: Vec2;
  active: boolean;
  respawnIn: number;
}

export interface ProjectileState {
  id: string;
  ownerId: string;
  weapon: WeaponType;
  position: Vec2;
  heading: number;
  speed: number;
  ttl: number;
  damage: number;
  radius: number;
}

export interface SimulationState {
  setup: MatchSetup;
  time: number;
  actors: SimActor[];
  pickups: PickupState[];
  projectiles: ProjectileState[];
  messages: string[];
  finished: boolean;
  winnerId?: string;
}

export const PLAYER_ID = 'player';
const WORLD_LIMIT = 38;
const TRACK_LENGTH = 96;
const PICKUP_RADIUS = 2.4;

export function defaultInput(): InputState {
  return {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
    fire: false,
    jump: false
  };
}

export function createInitialSimulation(setup: MatchSetup): SimulationState {
  const actors: SimActor[] = [
    {
      id: PLAYER_ID,
      name: 'You',
      colour: '#18a999',
      isPlayer: true,
      style: 'player',
      position: { x: 0, z: -18 },
      heading: 0,
      speed: 0,
      health: 100,
      shield: 0,
      score: 0,
      lap: 0,
      lapDistance: 0,
      airborne: 0,
      glideMeter: 1,
      hitFlash: 0,
      stats: setup.stats
    },
    ...setup.opponents.map<SimActor>((opponent, index) => ({
      id: opponent.id,
      name: opponent.name,
      colour: opponent.colour,
      isPlayer: false,
      style: opponent.style,
      position: pointOnRing((index / setup.opponents.length) * Math.PI * 2, 18),
      heading: Math.PI * 0.5 + index * 0.35,
      speed: 0,
      health: 100,
      shield: 0,
      score: 0,
      lap: 0,
      lapDistance: index * 6,
      airborne: 0,
      glideMeter: 1,
      hitFlash: 0,
      stats: {
        speed: setup.stats.speed * (0.86 + index * 0.03),
        handling: setup.stats.handling * (0.82 + index * 0.02),
        glide: setup.stats.glide * 0.8,
        boost: setup.stats.boost * 0.75
      }
    }))
  ];

  return {
    setup,
    time: 0,
    actors,
    pickups: createPickups(),
    projectiles: [],
    messages: [`${setup.config.title} ready`],
    finished: false
  };
}

export function stepSimulation(state: SimulationState, input: InputState, deltaSeconds: number): SimulationState {
  if (state.finished) {
    return state;
  }

  const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
  let next = cloneState(state);
  next.time += dt;
  next.pickups = next.pickups.map((pickup) =>
    pickup.active
      ? pickup
      : {
          ...pickup,
          respawnIn: Math.max(0, pickup.respawnIn - dt),
          active: pickup.respawnIn - dt <= 0
        }
  );

  next.actors = next.actors.map((actor, index) =>
    actor.isPlayer
      ? updatePlayer(actor, input, dt, next.setup.mode)
      : updateOpponent(actor, index, next.time, dt, next.setup.stats, next.setup.mode)
  );

  for (const actor of next.actors) {
    next = collectNearbyPickups(next, actor.id);
  }

  if (input.fire) {
    next = fireWeapon(next, PLAYER_ID);
  }

  next = fireOpponentWeapons(next);
  next = advanceProjectiles(next, dt);
  next = finishIfComplete(next);
  next.messages = next.messages.slice(-4);

  return next;
}

export function collectNearbyPickups(state: SimulationState, actorId: string): SimulationState {
  const actorIndex = state.actors.findIndex((actor) => actor.id === actorId);
  if (actorIndex === -1) {
    return state;
  }

  const actor = state.actors[actorIndex];
  const pickupIndex = state.pickups.findIndex((pickup) => pickup.active && distance(actor.position, pickup.position) <= PICKUP_RADIUS);

  if (pickupIndex === -1 || actor.weapon) {
    return state;
  }

  const next = cloneState(state);
  next.actors[actorIndex] = { ...next.actors[actorIndex], weapon: next.pickups[pickupIndex].weapon };
  next.pickups[pickupIndex] = { ...next.pickups[pickupIndex], active: false, respawnIn: 5 };
  next.messages.push(`${next.actors[actorIndex].name} picked up ${getWeaponById(next.pickups[pickupIndex].weapon).name}`);

  return next;
}

export function fireWeapon(state: SimulationState, actorId: string): SimulationState {
  const actorIndex = state.actors.findIndex((actor) => actor.id === actorId);
  if (actorIndex === -1) {
    return state;
  }

  const actor = state.actors[actorIndex];
  if (!actor.weapon) {
    return state;
  }

  const next = cloneState(state);
  const nextActor = { ...next.actors[actorIndex], weapon: undefined };
  const weapon = getWeaponById(actor.weapon);

  if (weapon.id === 'shield') {
    nextActor.shield = 2.6;
    next.actors[actorIndex] = nextActor;
    next.messages.push(`${actor.name} shielded up`);
    return next;
  }

  next.actors[actorIndex] = nextActor;
  next.projectiles.push({
    id: `${actor.id}-${Math.round(next.time * 1000)}-${next.projectiles.length}`,
    ownerId: actor.id,
    weapon: weapon.id,
    position: {
      x: actor.position.x + Math.sin(actor.heading) * 2,
      z: actor.position.z + Math.cos(actor.heading) * 2
    },
    heading: actor.heading,
    speed: weapon.speed,
    ttl: weapon.id === 'pulse' ? 0.9 : 1.6,
    damage: weapon.damage,
    radius: weapon.radius
  });
  next.messages.push(`${actor.name} fired ${weapon.name}`);

  return next;
}

export function advanceProjectiles(state: SimulationState, dt: number): SimulationState {
  const next = cloneState(state);
  const remainingProjectiles: ProjectileState[] = [];

  for (const projectile of next.projectiles) {
    const moved: ProjectileState = {
      ...projectile,
      position: {
        x: projectile.position.x + Math.sin(projectile.heading) * projectile.speed * dt,
        z: projectile.position.z + Math.cos(projectile.heading) * projectile.speed * dt
      },
      ttl: projectile.ttl - dt
    };

    const hitIndex = next.actors.findIndex(
      (actor) => actor.id !== moved.ownerId && distance(actor.position, moved.position) <= moved.radius + 1.25
    );

    if (hitIndex !== -1) {
      applyHit(next, moved, hitIndex);
      continue;
    }

    if (moved.ttl > 0 && Math.abs(moved.position.x) < WORLD_LIMIT && Math.abs(moved.position.z) < WORLD_LIMIT) {
      remainingProjectiles.push(moved);
    }
  }

  next.projectiles = remainingProjectiles;
  return next;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function createPickups(): PickupState[] {
  const points = [
    { x: 0, z: -9 },
    { x: 18, z: -7 },
    { x: 23, z: 12 },
    { x: 0, z: 18 },
    { x: -22, z: 11 },
    { x: -18, z: -8 },
    { x: 8, z: 4 },
    { x: -8, z: 4 }
  ];

  return points.map((position, index) => ({
    id: `pickup-${index}`,
    weapon: WEAPONS[index % WEAPONS.length].id,
    position,
    active: true,
    respawnIn: 0
  }));
}

function updatePlayer(actor: SimActor, input: InputState, dt: number, mode: MatchSetup['mode']): SimActor {
  const maxSpeed = maxSpeedFor(actor.stats);
  const acceleration = input.accelerate ? 15 + actor.stats.boost * 0.08 : 0;
  const braking = input.brake ? 18 : 0;
  const drag = input.accelerate ? 1.3 : 3.2;
  const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  const speed = clamp(actor.speed + (acceleration - braking - Math.sign(actor.speed) * drag) * dt, -maxSpeed * 0.35, maxSpeed);
  const turnRate = (1.25 + actor.stats.handling * 0.025) * (0.35 + Math.min(1, Math.abs(speed) / maxSpeed));
  const heading = actor.heading + turn * turnRate * dt;
  const airborne = nextAirborne(actor, input, dt);
  const position = clampPosition({
    x: actor.position.x + Math.sin(heading) * speed * dt,
    z: actor.position.z + Math.cos(heading) * speed * dt
  });

  return applyProgress({
    ...actor,
    speed,
    heading,
    airborne,
    position,
    shield: Math.max(0, actor.shield - dt),
    hitFlash: Math.max(0, actor.hitFlash - dt),
    glideMeter: airborne > 0 ? Math.max(0, actor.glideMeter - dt * 0.08) : Math.min(1, actor.glideMeter + dt * 0.22)
  }, dt, mode);
}

function updateOpponent(
  actor: SimActor,
  index: number,
  time: number,
  dt: number,
  playerStats: StatBlock,
  mode: MatchSetup['mode']
): SimActor {
  const targetAngle = time * (0.18 + index * 0.012) + index * 1.18;
  const target = pointOnRing(targetAngle, 20 - (index % 2) * 4);
  const targetHeading = Math.atan2(target.x - actor.position.x, target.z - actor.position.z);
  const heading = lerpAngle(actor.heading, targetHeading, dt * (0.9 + actor.stats.handling / 90));
  const speedTarget = maxSpeedFor(actor.stats) * (actor.style === 'remote' ? 0.78 : 0.68);
  const speed = actor.speed + (speedTarget - actor.speed) * Math.min(1, dt * 1.6);
  const hop = Math.sin(time * 0.6 + index) > 0.997 && actor.airborne <= 0 ? 0.8 + playerStats.glide / 160 : actor.airborne;
  const position = clampPosition({
    x: actor.position.x + Math.sin(heading) * speed * dt,
    z: actor.position.z + Math.cos(heading) * speed * dt
  });

  return applyProgress({
    ...actor,
    heading,
    speed,
    position,
    airborne: Math.max(0, hop - dt * 0.72),
    shield: Math.max(0, actor.shield - dt),
    hitFlash: Math.max(0, actor.hitFlash - dt),
    glideMeter: Math.min(1, actor.glideMeter + dt * 0.15)
  }, dt, mode);
}

function applyProgress(actor: SimActor, dt: number, mode: MatchSetup['mode']): SimActor {
  if (!modeUsesRaceProgress(mode)) {
    return actor;
  }

  const forwardTravel = Math.max(0, actor.speed) * dt;
  let lapDistance = actor.lapDistance + forwardTravel;
  let lap = actor.lap;

  while (lapDistance >= TRACK_LENGTH) {
    lap += 1;
    lapDistance -= TRACK_LENGTH;
  }

  return { ...actor, lap, lapDistance };
}

function nextAirborne(actor: SimActor, input: InputState, dt: number): number {
  if (input.jump && actor.airborne <= 0.02 && actor.glideMeter > 0.18) {
    return 0.55 + actor.stats.glide / 70;
  }

  if (actor.airborne <= 0) {
    return 0;
  }

  const fallRate = Math.max(0.25, 0.9 - actor.stats.glide / 140);
  return Math.max(0, actor.airborne - fallRate * dt);
}

function fireOpponentWeapons(state: SimulationState): SimulationState {
  return state.actors.reduce((next, actor, index) => {
    if (actor.isPlayer || !actor.weapon) {
      return next;
    }

    const shouldFire = Math.floor((state.time + index * 0.4) / 2.2) !== Math.floor((state.time - 0.05 + index * 0.4) / 2.2);
    return shouldFire ? fireWeapon(next, actor.id) : next;
  }, state);
}

function applyHit(state: SimulationState, projectile: ProjectileState, hitIndex: number): void {
  const target = state.actors[hitIndex];
  const attackerIndex = state.actors.findIndex((actor) => actor.id === projectile.ownerId);

  if (target.shield > 0) {
    state.actors[hitIndex] = { ...target, shield: 0, hitFlash: 0.35 };
    state.messages.push(`${target.name} blocked a hit`);
    return;
  }

  const health = target.health - projectile.damage;
  state.actors[hitIndex] = { ...target, health: Math.max(0, health), hitFlash: 0.35 };
  state.messages.push(`${target.name} was hit`);

  if (health <= 0) {
    const resetPosition = pointOnRing((state.time + hitIndex) * 1.7, 16);
    state.actors[hitIndex] = { ...state.actors[hitIndex], health: 100, position: resetPosition, speed: 0 };

    if (attackerIndex !== -1) {
      state.actors[attackerIndex] = {
        ...state.actors[attackerIndex],
        score: state.actors[attackerIndex].score + 1
      };
    }
  }
}

function finishIfComplete(state: SimulationState): SimulationState {
  const winner = state.actors.find((actor) => actorHasCompletedObjective(state, actor));

  if (!winner) {
    return state;
  }

  return {
    ...state,
    finished: true,
    winnerId: winner.id,
    messages: [...state.messages, `${winner.name} finished`]
  };
}

function actorHasCompletedObjective(state: SimulationState, actor: SimActor): boolean {
  const { mode, config } = state.setup;
  const raceComplete = !modeUsesRaceProgress(mode) || actor.lap >= config.lapsRequired;
  const combatComplete = !modeUsesCombatScore(mode) || actor.score >= config.combatTarget;
  return raceComplete && combatComplete;
}

function cloneState(state: SimulationState): SimulationState {
  return {
    ...state,
    actors: state.actors.map((actor) => ({
      ...actor,
      position: { ...actor.position },
      stats: { ...actor.stats }
    })),
    pickups: state.pickups.map((pickup) => ({ ...pickup, position: { ...pickup.position } })),
    projectiles: state.projectiles.map((projectile) => ({ ...projectile, position: { ...projectile.position } })),
    messages: [...state.messages]
  };
}

function maxSpeedFor(stats: StatBlock): number {
  return 6 + stats.speed * 0.09 + stats.boost * 0.03;
}

function pointOnRing(angle: number, radius: number): Vec2 {
  return {
    x: Math.sin(angle) * radius,
    z: Math.cos(angle) * radius
  };
}

function clampPosition(position: Vec2): Vec2 {
  return {
    x: clamp(position.x, -WORLD_LIMIT, WORLD_LIMIT),
    z: clamp(position.z, -WORLD_LIMIT, WORLD_LIMIT)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerpAngle(from: number, to: number, amount: number): number {
  const shortest = ((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return from + shortest * Math.min(1, amount);
}
