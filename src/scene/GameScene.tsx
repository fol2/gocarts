import { Environment } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { isOnlineActorMessage, onlineChannelName, type OnlineActorMessage } from '../game/online';
import {
  createInitialSimulation,
  defaultInput,
  PLAYER_ID,
  stepSimulation,
  type SimActor,
  type InputState,
  type SimulationState
} from '../game/simulation';
import type { MatchSetup } from '../game/types';
import { Cart } from './Cart';
import { Pickup } from './Pickup';
import { Projectile } from './Projectile';
import { Track } from './Track';

interface GameSceneProps {
  setup: MatchSetup;
  active: boolean;
  onSnapshot: (snapshot: SimulationState) => void;
  onMatchEnd: (snapshot: SimulationState) => void;
}

export function GameScene({ setup, active, onSnapshot, onMatchEnd }: GameSceneProps) {
  const initialState = useMemo(() => createInitialSimulation(setup), [setup]);
  const stateRef = useRef(initialState);
  const frameRef = useRef(0);
  const matchEndedRef = useRef(false);
  const inputRef = usePlayerInput(active);
  const online = useOnlineRoom(setup, active);
  const [snapshot, setSnapshot] = useState(initialState);

  useEffect(() => {
    stateRef.current = createInitialSimulation(setup);
    setSnapshot(stateRef.current);
    onSnapshot(stateRef.current);
    matchEndedRef.current = false;
  }, [onSnapshot, setup]);

  useEffect(() => {
    if (!active) {
      return;
    }

    stateRef.current = createInitialSimulation(setup);
    setSnapshot(stateRef.current);
    onSnapshot(stateRef.current);
    matchEndedRef.current = false;
  }, [active, onSnapshot, setup]);

  useFrame((_, delta) => {
    const input = active ? inputRef.current : previewInput(stateRef.current.time);
    stateRef.current = online.mergeRemoteActors(stateRef.current);
    stateRef.current = stepSimulation(stateRef.current, input, delta, { lockedActorIds: online.liveRemoteActorIds(stateRef.current) });
    stateRef.current = online.mergeRemoteActors(stateRef.current);
    online.publishLocalActor(stateRef.current.actors.find((actor) => actor.id === PLAYER_ID));

    if (!active && stateRef.current.finished) {
      stateRef.current = createInitialSimulation(setup);
    }

    frameRef.current += 1;

    if (frameRef.current % 3 === 0) {
      setSnapshot(stateRef.current);
      onSnapshot(stateRef.current);
    }

    if (active && stateRef.current.finished && !matchEndedRef.current) {
      matchEndedRef.current = true;
      onMatchEnd(stateRef.current);
    }
  });

  return (
    <>
      <color attach="background" args={['#79b7d8']} />
      <fog attach="fog" args={['#79b7d8', 58, 150]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#bde8ff', '#25583f', 1.1]} />
      <directionalLight position={[18, 34, 18]} intensity={1.45} />
      <Environment preset="park" />
      <Track mode={setup.mode} />
      {snapshot.pickups.map((pickup) => (
        <Pickup key={pickup.id} pickup={pickup} />
      ))}
      {snapshot.projectiles.map((projectile) => (
        <Projectile key={projectile.id} projectile={projectile} />
      ))}
      {snapshot.actors.map((actor) => (
        <Cart key={actor.id} actor={actor} />
      ))}
      <CameraRig stateRef={stateRef} />
    </>
  );
}

function CameraRig({ stateRef }: { stateRef: React.MutableRefObject<SimulationState> }) {
  const { camera } = useThree();
  const cameraTarget = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());

  useFrame(() => {
    const player = stateRef.current.actors.find((actor) => actor.id === PLAYER_ID) ?? stateRef.current.actors[0];
    const behind = new Vector3(
      player.position.x - Math.sin(player.heading) * 11,
      8.5 + player.airborne,
      player.position.z - Math.cos(player.heading) * 11
    );
    const look = new Vector3(player.position.x, 1.2, player.position.z);

    cameraTarget.current.lerp(behind, 0.08);
    lookTarget.current.lerp(look, 0.1);
    camera.position.copy(cameraTarget.current);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

function usePlayerInput(active: boolean) {
  const inputRef = useRef<InputState>(defaultInput());

  useEffect(() => {
    if (!active) {
      inputRef.current = defaultInput();
    }
  }, [active]);

  useEffect(() => {
    const setKey = (key: string, pressed: boolean) => {
      if (key === 'ArrowUp' || key.toLowerCase() === 'w') inputRef.current.accelerate = pressed;
      if (key === 'ArrowDown' || key.toLowerCase() === 's') inputRef.current.brake = pressed;
      if (key === 'ArrowLeft' || key.toLowerCase() === 'a') inputRef.current.left = pressed;
      if (key === 'ArrowRight' || key.toLowerCase() === 'd') inputRef.current.right = pressed;
      if (key === ' ') inputRef.current.fire = pressed;
      if (key === 'Shift') inputRef.current.jump = pressed;
    };

    const onKeyDown = (event: KeyboardEvent) => setKey(event.key, true);
    const onKeyUp = (event: KeyboardEvent) => setKey(event.key, false);
    const onAction = (event: Event) => {
      const { action, active: actionActive } = (event as CustomEvent<{ action: keyof InputState; active: boolean }>).detail;
      inputRef.current[action] = actionActive;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('gocarts:action', onAction);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('gocarts:action', onAction);
    };
  }, []);

  return inputRef;
}

interface RemoteActorEntry {
  actor: SimActor;
  receivedAt: number;
}

function useOnlineRoom(setup: MatchSetup, active: boolean) {
  const clientIdRef = useRef(`player-${Math.random().toString(36).slice(2, 10)}`);
  const channelRef = useRef<BroadcastChannel | undefined>(undefined);
  const remoteActorsRef = useRef<Map<string, RemoteActorEntry>>(new Map());

  useEffect(() => {
    remoteActorsRef.current.clear();

    if (!active || setup.opponentType !== 'online' || !setup.onlineRoomId || typeof BroadcastChannel === 'undefined') {
      channelRef.current?.close();
      channelRef.current = undefined;
      return;
    }

    const channel = new BroadcastChannel(onlineChannelName(setup.onlineRoomId));
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const message = event.data;

      if (!isOnlineActorMessage(message) || message.clientId === clientIdRef.current) {
        return;
      }

      remoteActorsRef.current.set(message.clientId, {
        actor: message.actor,
        receivedAt: performance.now()
      });
    };

    return () => {
      channel.close();
      channelRef.current = undefined;
    };
  }, [active, setup.onlineRoomId, setup.opponentType]);

  return {
    publishLocalActor(actor?: SimActor) {
      if (!actor || !channelRef.current) {
        return;
      }

      channelRef.current.postMessage({
        type: 'actor',
        clientId: clientIdRef.current,
        actor,
        sentAt: performance.now()
      } satisfies OnlineActorMessage);
    },
    liveRemoteActorIds(state: SimulationState): ReadonlySet<string> | undefined {
      const remoteSlotIds = getLiveRemoteSlotIds(state, setup, remoteActorsRef.current);

      return remoteSlotIds.size > 0 ? remoteSlotIds : undefined;
    },
    mergeRemoteActors(state: SimulationState): SimulationState {
      const remoteSlotIds = getLiveRemoteSlotIds(state, setup, remoteActorsRef.current);

      if (remoteSlotIds.size === 0) {
        return state;
      }

      const now = performance.now();
      const remoteActors = Array.from(remoteActorsRef.current.entries())
        .filter(([, entry]) => now - entry.receivedAt < 2500)
        .map(([clientId, entry]) => ({
          clientId,
          actor: entry.actor
        }));

      if (remoteActors.length === 0) {
        return state;
      }

      const nextActors = state.actors.map((actor) => ({ ...actor, position: { ...actor.position }, stats: { ...actor.stats } }));
      const remoteSlots = nextActors.filter((actor) => !actor.isPlayer && actor.style === 'remote');

      remoteActors.slice(0, remoteSlots.length).forEach((remote, index) => {
        const slotIndex = nextActors.findIndex((actor) => actor.id === remoteSlots[index].id);

        if (slotIndex === -1) {
          return;
        }

        nextActors[slotIndex] = {
          ...nextActors[slotIndex],
          name: `Online ${index + 1}`,
          position: { ...remote.actor.position },
          heading: remote.actor.heading,
          speed: remote.actor.speed,
          health: remote.actor.health,
          shield: remote.actor.shield,
          weapon: remote.actor.weapon,
          score: remote.actor.score,
          lap: remote.actor.lap,
          lapDistance: remote.actor.lapDistance,
          airborne: remote.actor.airborne,
          glideMeter: remote.actor.glideMeter,
          hitFlash: remote.actor.hitFlash
        };
      });

      return {
        ...state,
        actors: nextActors
      };
    }
  };
}

function getLiveRemoteSlotIds(state: SimulationState, setup: MatchSetup, remoteActors: Map<string, RemoteActorEntry>): Set<string> {
  if (setup.opponentType !== 'online' || remoteActors.size === 0) {
    return new Set();
  }

  const now = performance.now();
  const liveRemoteCount = Array.from(remoteActors.values()).filter((entry) => now - entry.receivedAt < 2500).length;
  const remoteSlots = state.actors.filter((actor) => !actor.isPlayer && actor.style === 'remote');

  return new Set(remoteSlots.slice(0, liveRemoteCount).map((actor) => actor.id));
}

function previewInput(time: number): InputState {
  return {
    accelerate: true,
    brake: false,
    left: Math.sin(time * 0.55) > 0,
    right: Math.sin(time * 0.55) <= 0,
    fire: Math.sin(time * 1.7) > 0.98,
    jump: Math.sin(time * 0.65) > 0.995
  };
}
