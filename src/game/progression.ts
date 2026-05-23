import { getPartById, PARTS, STARTER_LOADOUT } from './catalogue';
import type { Loadout, MatchResult, PartDefinition, PartCategory, PlayerProgress, StatBlock } from './types';

export function createStarterProgress(): PlayerProgress {
  return {
    wins: 0,
    knockouts: 0,
    unlockedPartIds: PARTS.filter((part) => part.unlock.kind === 'starter').map((part) => part.id)
  };
}

export function isPartUnlocked(part: PartDefinition, progress: PlayerProgress): boolean {
  if (progress.unlockedPartIds.includes(part.id)) {
    return true;
  }

  if (part.unlock.kind === 'starter') {
    return true;
  }

  if (part.unlock.kind === 'wins') {
    return progress.wins >= part.unlock.value;
  }

  return progress.knockouts >= part.unlock.value;
}

export function getUnlockedParts(progress: PlayerProgress, category?: PartCategory): PartDefinition[] {
  return PARTS.filter((part) => (!category || part.category === category) && isPartUnlocked(part, progress));
}

export function calculateLoadoutStats(loadout: Loadout): StatBlock {
  const cart = getPartById(loadout.cartId);
  const wheels = getPartById(loadout.wheelsId);
  const glider = getPartById(loadout.gliderId);

  return [cart, wheels, glider].reduce<StatBlock>(
    (total, part) => ({
      speed: total.speed + part.stats.speed,
      handling: total.handling + part.stats.handling,
      glide: total.glide + part.stats.glide,
      boost: total.boost + part.stats.boost
    }),
    { speed: 0, handling: 0, glide: 0, boost: 0 }
  );
}

export function normaliseLoadout(loadout: Loadout, progress: PlayerProgress): Loadout {
  const nextLoadout = { ...loadout };

  if (!isPartUnlocked(getPartById(nextLoadout.cartId), progress)) {
    nextLoadout.cartId = STARTER_LOADOUT.cartId;
  }

  if (!isPartUnlocked(getPartById(nextLoadout.wheelsId), progress)) {
    nextLoadout.wheelsId = STARTER_LOADOUT.wheelsId;
  }

  if (!isPartUnlocked(getPartById(nextLoadout.gliderId), progress)) {
    nextLoadout.gliderId = STARTER_LOADOUT.gliderId;
  }

  return nextLoadout;
}

export function trySelectPart(loadout: Loadout, part: PartDefinition, progress: PlayerProgress): Loadout {
  if (!isPartUnlocked(part, progress)) {
    return loadout;
  }

  if (part.category === 'cart') {
    return { ...loadout, cartId: part.id };
  }

  if (part.category === 'wheels') {
    return { ...loadout, wheelsId: part.id };
  }

  return { ...loadout, gliderId: part.id };
}

export function getFreshUnlocks(progress: PlayerProgress): PartDefinition[] {
  return PARTS.filter((part) => isPartUnlocked(part, progress) && !progress.unlockedPartIds.includes(part.id));
}

export function applyMatchResult(progress: PlayerProgress, result: MatchResult): PlayerProgress {
  const progressed: PlayerProgress = {
    wins: progress.wins + (result.won ? 1 : 0),
    knockouts: progress.knockouts + result.knockouts,
    unlockedPartIds: [...progress.unlockedPartIds]
  };

  const freshUnlocks = getFreshUnlocks(progressed);

  for (const part of freshUnlocks) {
    progressed.unlockedPartIds.push(part.id);
  }

  return progressed;
}

export function getSpeedLabel(stats: StatBlock): string {
  if (stats.speed >= 90) {
    return 'Very fast';
  }

  if (stats.speed >= 70) {
    return 'Fast';
  }

  if (stats.speed >= 50) {
    return 'Nippy';
  }

  return 'Steady';
}
