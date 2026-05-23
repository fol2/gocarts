import { STARTER_LOADOUT } from './catalogue';
import type { GameMode, Loadout, OpponentType } from './types';

export interface GameSelection {
  mode: GameMode;
  opponentType: OpponentType;
  loadout: Loadout;
}

export function createInitialSelection(): GameSelection {
  return {
    mode: 'race',
    opponentType: 'computers',
    loadout: { ...STARTER_LOADOUT }
  };
}
