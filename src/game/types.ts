export type GameMode = 'race' | 'battleground' | 'battleground-race';

export type OpponentType = 'computers' | 'online';

export type WeaponType = 'rocket' | 'pulse' | 'shield';

export type PartCategory = 'cart' | 'wheels' | 'glider';

export type UnlockKind = 'starter' | 'wins' | 'knockouts';

export interface StatBlock {
  speed: number;
  handling: number;
  glide: number;
  boost: number;
}

export interface PartDefinition {
  id: string;
  name: string;
  category: PartCategory;
  summary: string;
  colour: string;
  stats: StatBlock;
  unlock: {
    kind: UnlockKind;
    value: number;
  };
}

export interface WeaponDefinition {
  id: WeaponType;
  name: string;
  colour: string;
  damage: number;
  speed: number;
  radius: number;
  summary: string;
}

export interface PlayerProgress {
  wins: number;
  knockouts: number;
  unlockedPartIds: string[];
}

export interface Loadout {
  cartId: string;
  wheelsId: string;
  gliderId: string;
}

export interface ModeDefinition {
  id: GameMode;
  name: string;
  shortName: string;
  objective: string;
}

export interface MatchConfig {
  mode: GameMode;
  title: string;
  objective: string;
  lapsRequired: number;
  combatTarget: number;
  allowsWeapons: boolean;
  arenaShape: 'circuit' | 'arena' | 'hybrid';
}

export interface OpponentDefinition {
  id: string;
  name: string;
  style: 'computer' | 'remote';
  colour: string;
}

export interface MatchSetup {
  mode: GameMode;
  opponentType: OpponentType;
  loadout: Loadout;
  stats: StatBlock;
  opponents: OpponentDefinition[];
  config: MatchConfig;
}

export interface MatchResult {
  mode: GameMode;
  won: boolean;
  knockouts: number;
}
