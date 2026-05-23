import { describe, expect, it } from 'vitest';
import { STARTER_LOADOUT } from '../catalogue';
import { createMatchConfig, createMatchSetup, createOpponentRoster } from '../match';
import { createStarterProgress } from '../progression';

describe('match setup', () => {
  it('creates race, battleground and battleground race objectives', () => {
    expect(createMatchConfig('race')).toMatchObject({ lapsRequired: 3, combatTarget: 0, allowsWeapons: true });
    expect(createMatchConfig('battleground')).toMatchObject({ lapsRequired: 0, combatTarget: 5, allowsWeapons: true });
    expect(createMatchConfig('battleground-race')).toMatchObject({ lapsRequired: 2, combatTarget: 3, allowsWeapons: true });
  });

  it('creates computer opponents', () => {
    const opponents = createOpponentRoster('computers', 3);

    expect(opponents).toHaveLength(3);
    expect(opponents.every((opponent) => opponent.style === 'computer')).toBe(true);
  });

  it('creates online-ready remote opponents', () => {
    const opponents = createOpponentRoster('online', 4);

    expect(opponents).toHaveLength(4);
    expect(opponents.every((opponent) => opponent.style === 'remote')).toBe(true);
  });

  it('normalises locked loadouts before the match starts', () => {
    const setup = createMatchSetup(
      'race',
      'computers',
      {
        cartId: 'cart-phantom',
        wheelsId: 'wheels-comet',
        gliderId: 'glider-nova'
      },
      createStarterProgress()
    );

    expect(setup.loadout).toEqual(STARTER_LOADOUT);
    expect(setup.stats.speed).toBe(48);
  });
});
