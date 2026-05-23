import type { GameMode, ModeDefinition, PartDefinition, WeaponDefinition } from './types';

export const GAME_MODES: ModeDefinition[] = [
  {
    id: 'race',
    name: 'Race',
    shortName: 'Race',
    objective: 'Finish laps while fighting for position.'
  },
  {
    id: 'battleground',
    name: 'Battleground',
    shortName: 'Battle',
    objective: 'Score hits before the other carts do.'
  },
  {
    id: 'battleground-race',
    name: 'Battleground Race',
    shortName: 'Battle Race',
    objective: 'Complete laps and land hits to win.'
  }
];

export const PARTS: PartDefinition[] = [
  {
    id: 'cart-rookie',
    name: 'Rookie Runner',
    category: 'cart',
    summary: 'Balanced starter body.',
    colour: '#18a999',
    stats: { speed: 34, handling: 30, glide: 4, boost: 16 },
    unlock: { kind: 'starter', value: 0 }
  },
  {
    id: 'cart-bolt',
    name: 'Bolt Buggy',
    category: 'cart',
    summary: 'Quick body with lively boost.',
    colour: '#f2c14e',
    stats: { speed: 46, handling: 22, glide: 5, boost: 24 },
    unlock: { kind: 'wins', value: 1 }
  },
  {
    id: 'cart-phantom',
    name: 'Phantom Cart',
    category: 'cart',
    summary: 'Fast chassis for brave cornering.',
    colour: '#ef476f',
    stats: { speed: 56, handling: 18, glide: 8, boost: 30 },
    unlock: { kind: 'wins', value: 3 }
  },
  {
    id: 'wheels-grip',
    name: 'Grip Wheels',
    category: 'wheels',
    summary: 'Steady wheels for tight turns.',
    colour: '#8ecae6',
    stats: { speed: 10, handling: 30, glide: 0, boost: 8 },
    unlock: { kind: 'starter', value: 0 }
  },
  {
    id: 'wheels-silver',
    name: 'Silver Rollers',
    category: 'wheels',
    summary: 'Extra pace after a few hits.',
    colour: '#d9d9d9',
    stats: { speed: 18, handling: 24, glide: 0, boost: 12 },
    unlock: { kind: 'knockouts', value: 2 }
  },
  {
    id: 'wheels-comet',
    name: 'Comet Wheels',
    category: 'wheels',
    summary: 'Top speed with a wider turning circle.',
    colour: '#ff7f11',
    stats: { speed: 28, handling: 15, glide: 0, boost: 18 },
    unlock: { kind: 'wins', value: 2 }
  },
  {
    id: 'glider-canvas',
    name: 'Canvas Wing',
    category: 'glider',
    summary: 'Short, safe glides.',
    colour: '#f7f4ea',
    stats: { speed: 4, handling: 5, glide: 26, boost: 4 },
    unlock: { kind: 'starter', value: 0 }
  },
  {
    id: 'glider-storm',
    name: 'Storm Sail',
    category: 'glider',
    summary: 'Longer airtime from ramps.',
    colour: '#6a994e',
    stats: { speed: 6, handling: 6, glide: 42, boost: 6 },
    unlock: { kind: 'wins', value: 1 }
  },
  {
    id: 'glider-nova',
    name: 'Nova Glider',
    category: 'glider',
    summary: 'Fast glide recovery for attacks.',
    colour: '#9b5de5',
    stats: { speed: 10, handling: 8, glide: 55, boost: 10 },
    unlock: { kind: 'knockouts', value: 4 }
  }
];

export const WEAPONS: WeaponDefinition[] = [
  {
    id: 'rocket',
    name: 'Rocket',
    colour: '#ff4d4d',
    damage: 55,
    speed: 30,
    radius: 1.1,
    summary: 'Straight shot with heavy damage.'
  },
  {
    id: 'pulse',
    name: 'Pulse',
    colour: '#4cc9f0',
    damage: 34,
    speed: 22,
    radius: 2.2,
    summary: 'Wide blast that is easier to land.'
  },
  {
    id: 'shield',
    name: 'Shield',
    colour: '#80ed99',
    damage: 0,
    speed: 0,
    radius: 0,
    summary: 'Blocks the next hit for a short time.'
  }
];

export const STARTER_LOADOUT = {
  cartId: 'cart-rookie',
  wheelsId: 'wheels-grip',
  gliderId: 'glider-canvas'
} as const;

export function getPartById(id: string): PartDefinition {
  const part = PARTS.find((candidate) => candidate.id === id);

  if (!part) {
    throw new Error(`Unknown part: ${id}`);
  }

  return part;
}

export function getModeById(id: GameMode): ModeDefinition {
  const mode = GAME_MODES.find((candidate) => candidate.id === id);

  if (!mode) {
    throw new Error(`Unknown mode: ${id}`);
  }

  return mode;
}

export function getWeaponById(id: string): WeaponDefinition {
  const weapon = WEAPONS.find((candidate) => candidate.id === id);

  if (!weapon) {
    throw new Error(`Unknown weapon: ${id}`);
  }

  return weapon;
}

export function getPartsByCategory(category: PartDefinition['category']): PartDefinition[] {
  return PARTS.filter((part) => part.category === category);
}
