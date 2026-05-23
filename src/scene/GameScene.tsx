import { Environment } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import {
  createInitialSimulation,
  defaultInput,
  PLAYER_ID,
  stepSimulation,
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
  const [snapshot, setSnapshot] = useState(initialState);

  useEffect(() => {
    stateRef.current = createInitialSimulation(setup);
    setSnapshot(stateRef.current);
    onSnapshot(stateRef.current);
    matchEndedRef.current = false;
  }, [onSnapshot, setup]);

  useFrame((_, delta) => {
    const input = active ? inputRef.current : previewInput(stateRef.current.time);
    stateRef.current = stepSimulation(stateRef.current, input, delta);

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
      <color attach="background" args={['#17211c']} />
      <fog attach="fog" args={['#17211c', 26, 78]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[18, 32, 14]} intensity={1.7} />
      <Environment preset="city" />
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
