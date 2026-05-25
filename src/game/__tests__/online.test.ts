import { describe, expect, it, vi } from 'vitest';
import { STARTER_LOADOUT } from '../catalogue';
import { createMatchSetup } from '../match';
import { DEFAULT_ONLINE_ROOM_LENGTH, createOnlineRoomId, isOnlineActorMessage, normaliseOnlineRoomId, onlineChannelName } from '../online';
import { createStarterProgress } from '../progression';
import { createInitialSimulation } from '../simulation';

describe('online room helpers', () => {
  it('normalises room codes for room sharing', () => {
    expect(normaliseOnlineRoomId(' race-42! ')).toBe('RACE42');
    expect(normaliseOnlineRoomId('abcdefghi')).toHaveLength(DEFAULT_ONLINE_ROOM_LENGTH);
  });

  it('creates channel names from normalised room codes', () => {
    expect(onlineChannelName('race-42')).toBe('gocarts-online-RACE42');
    expect(onlineChannelName('')).toBe('gocarts-online-ROOM');
  });

  it('creates six-character room codes', () => {
    vi.stubGlobal('crypto', undefined);

    const roomId = createOnlineRoomId();

    expect(roomId).toHaveLength(DEFAULT_ONLINE_ROOM_LENGTH);
    expect(roomId).toMatch(/^[A-Z2-9]+$/);

    vi.unstubAllGlobals();
  });

  it('accepts only well-formed online actor messages', () => {
    const actor = createInitialSimulation(createMatchSetup('race', 'online', STARTER_LOADOUT, createStarterProgress(), 'RACE42')).actors[0];

    expect(isOnlineActorMessage({ type: 'actor', clientId: 'player-1', actor, sentAt: 1 })).toBe(true);
    expect(isOnlineActorMessage(null)).toBe(false);
    expect(isOnlineActorMessage({ type: 'actor', clientId: 'player-1', actor: { ...actor, position: null }, sentAt: 1 })).toBe(false);
    expect(isOnlineActorMessage({ type: 'actor', clientId: 'player-1', actor: { ...actor, weapon: 'banana' }, sentAt: 1 })).toBe(false);
    expect(
      isOnlineActorMessage({
        type: 'actor',
        clientId: 'player-1',
        actor: { ...actor, position: { ...actor.position, x: Number.POSITIVE_INFINITY } },
        sentAt: 1
      })
    ).toBe(false);
    expect(isOnlineActorMessage({ type: 'actor', clientId: 'player-1', actor: { ...actor, lapDistance: Number.NaN }, sentAt: 1 })).toBe(false);
    expect(isOnlineActorMessage({ type: 'actor', clientId: 'player-1', actor, sentAt: 'now' })).toBe(false);
  });
});
