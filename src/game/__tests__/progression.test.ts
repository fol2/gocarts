import { describe, expect, it } from 'vitest';
import { getPartById, STARTER_LOADOUT } from '../catalogue';
import {
  applyMatchResult,
  calculateLoadoutStats,
  createStarterProgress,
  getFreshUnlocks,
  isPartUnlocked,
  normaliseLoadout,
  trySelectPart
} from '../progression';

describe('progression', () => {
  it('starts with the first cart, wheels and glider unlocked', () => {
    const progress = createStarterProgress();

    expect(progress.unlockedPartIds).toEqual(expect.arrayContaining(['cart-rookie', 'wheels-grip', 'glider-canvas']));
    expect(isPartUnlocked(getPartById('cart-bolt'), progress)).toBe(false);
  });

  it('combines cart, wheel and glider stats for speed checks', () => {
    const stats = calculateLoadoutStats(STARTER_LOADOUT);

    expect(stats.speed).toBe(48);
    expect(stats.glide).toBe(30);
    expect(stats.boost).toBe(28);
  });

  it('does not select locked parts', () => {
    const progress = createStarterProgress();
    const lockedPart = getPartById('cart-bolt');

    expect(trySelectPart(STARTER_LOADOUT, lockedPart, progress)).toEqual(STARTER_LOADOUT);
  });

  it('unlocks faster parts after match progress', () => {
    const progress = applyMatchResult(createStarterProgress(), {
      mode: 'race',
      won: true,
      knockouts: 2
    });

    expect(getFreshUnlocks(createStarterProgress()).map((part) => part.id)).toEqual([]);
    expect(progress.unlockedPartIds).toEqual(expect.arrayContaining(['cart-bolt', 'glider-storm', 'wheels-silver']));
  });

  it('falls back to starter parts when a saved loadout is no longer unlocked', () => {
    const loadout = normaliseLoadout(
      {
        cartId: 'cart-phantom',
        wheelsId: 'wheels-comet',
        gliderId: 'glider-nova'
      },
      createStarterProgress()
    );

    expect(loadout).toEqual(STARTER_LOADOUT);
  });
});
