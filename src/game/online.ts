import type { SimActor } from './simulation';

const ONLINE_ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const DEFAULT_ONLINE_ROOM_LENGTH = 6;

export interface OnlineActorMessage {
  type: 'actor';
  clientId: string;
  actor: SimActor;
  sentAt: number;
}

export function createOnlineRoomId(length = DEFAULT_ONLINE_ROOM_LENGTH): string {
  const values = new Uint8Array(length);

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) {
      values[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(values, (value) => ONLINE_ROOM_ALPHABET[value % ONLINE_ROOM_ALPHABET.length]).join('');
}

export function normaliseOnlineRoomId(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, DEFAULT_ONLINE_ROOM_LENGTH);
}

export function onlineChannelName(roomId: string): string {
  return `gocarts-online-${normaliseOnlineRoomId(roomId) || 'ROOM'}`;
}

export function isOnlineActorMessage(value: unknown): value is OnlineActorMessage {
  if (!isRecord(value)) {
    return false;
  }

  return value.type === 'actor' && typeof value.clientId === 'string' && typeof value.sentAt === 'number' && isOnlineActor(value.actor);
}

function isOnlineActor(value: unknown): value is SimActor {
  if (!isRecord(value) || !isRecord(value.position) || !isRecord(value.stats)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.colour === 'string' &&
    typeof value.isPlayer === 'boolean' &&
    (value.style === 'player' || value.style === 'computer' || value.style === 'remote') &&
    isValidWeapon(value.weapon) &&
    isFiniteNumber(value.position.x) &&
    isFiniteNumber(value.position.z) &&
    isFiniteNumber(value.heading) &&
    isFiniteNumber(value.speed) &&
    isFiniteNumber(value.health) &&
    isFiniteNumber(value.shield) &&
    isFiniteNumber(value.score) &&
    isFiniteNumber(value.lap) &&
    isFiniteNumber(value.lapDistance) &&
    isFiniteNumber(value.airborne) &&
    isFiniteNumber(value.glideMeter) &&
    isFiniteNumber(value.hitFlash) &&
    isFiniteNumber(value.stats.speed) &&
    isFiniteNumber(value.stats.handling) &&
    isFiniteNumber(value.stats.glide) &&
    isFiniteNumber(value.stats.boost)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidWeapon(value: unknown): boolean {
  return value === undefined || value === 'rocket' || value === 'pulse' || value === 'shield';
}
