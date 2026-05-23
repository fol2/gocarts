import { getModeById } from './catalogue';
import { calculateLoadoutStats, normaliseLoadout } from './progression';
import type { GameMode, Loadout, MatchConfig, MatchSetup, OpponentDefinition, OpponentType, PlayerProgress } from './types';

const COMPUTER_NAMES = ['Axel', 'Mina', 'Rafi', 'Juno', 'Kip'];
const ONLINE_NAMES = ['PixelWave', 'NeonNell', 'TurboJay', 'CloudCart', 'GlideMax'];
const OPPONENT_COLOURS = ['#f2c14e', '#ef476f', '#8ecae6', '#ff7f11', '#80ed99'];

export function createMatchConfig(mode: GameMode): MatchConfig {
  const definition = getModeById(mode);

  if (mode === 'race') {
    return {
      mode,
      title: definition.name,
      objective: definition.objective,
      lapsRequired: 3,
      combatTarget: 0,
      allowsWeapons: true,
      arenaShape: 'circuit'
    };
  }

  if (mode === 'battleground') {
    return {
      mode,
      title: definition.name,
      objective: definition.objective,
      lapsRequired: 0,
      combatTarget: 5,
      allowsWeapons: true,
      arenaShape: 'arena'
    };
  }

  return {
    mode,
    title: definition.name,
    objective: definition.objective,
    lapsRequired: 2,
    combatTarget: 3,
    allowsWeapons: true,
    arenaShape: 'hybrid'
  };
}

export function createOpponentRoster(opponentType: OpponentType, count = 5): OpponentDefinition[] {
  const names = opponentType === 'online' ? ONLINE_NAMES : COMPUTER_NAMES;

  return Array.from({ length: count }, (_, index) => ({
    id: `${opponentType}-${index + 1}`,
    name: names[index % names.length],
    style: opponentType === 'online' ? 'remote' : 'computer',
    colour: OPPONENT_COLOURS[index % OPPONENT_COLOURS.length]
  }));
}

export function createMatchSetup(
  mode: GameMode,
  opponentType: OpponentType,
  loadout: Loadout,
  progress: PlayerProgress
): MatchSetup {
  const safeLoadout = normaliseLoadout(loadout, progress);

  return {
    mode,
    opponentType,
    loadout: safeLoadout,
    stats: calculateLoadoutStats(safeLoadout),
    opponents: createOpponentRoster(opponentType),
    config: createMatchConfig(mode)
  };
}

export function modeUsesRaceProgress(mode: GameMode): boolean {
  return mode === 'race' || mode === 'battleground-race';
}

export function modeUsesCombatScore(mode: GameMode): boolean {
  return mode === 'battleground' || mode === 'battleground-race';
}

export function canUseWeapons(config: MatchConfig): boolean {
  return config.allowsWeapons;
}

export function getOpponentLabel(opponentType: OpponentType): string {
  return opponentType === 'online' ? 'Online' : 'Computers';
}
