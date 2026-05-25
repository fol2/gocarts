import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const STANDS = [
  {
    id: 'north',
    position: [36, 0, -58] as [number, number, number],
    rotation: -0.28,
    shout: 'GO!',
    colours: ['#f2c14e', '#ef476f', '#8ecae6']
  },
  {
    id: 'east',
    position: [66, 0, 8] as [number, number, number],
    rotation: -Math.PI / 2,
    shout: 'BOOST!',
    colours: ['#80ed99', '#9b5de5', '#ff7f11']
  },
  {
    id: 'west',
    position: [-66, 0, -4] as [number, number, number],
    rotation: Math.PI / 2,
    shout: 'WOW!',
    colours: ['#4cc9f0', '#f7f4ea', '#f15bb5']
  }
];

export function SpectatorStands() {
  return (
    <group>
      {STANDS.map((stand, index) => (
        <SpectatorStand key={stand.id} {...stand} phase={index * 0.9} />
      ))}
    </group>
  );
}

function SpectatorStand({
  position,
  rotation,
  shout,
  colours,
  phase
}: {
  position: [number, number, number];
  rotation: number;
  shout: string;
  colours: string[];
  phase: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.position.y = Math.sin(clock.elapsedTime * 3.2 + phase) * 0.08;
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.28, 0]} receiveShadow>
        <boxGeometry args={[32, 0.55, 8]} />
        <meshStandardMaterial color="#34383d" roughness={0.8} />
      </mesh>
      {[0, 1, 2].map((row) => (
        <mesh key={`step-${row}`} position={[0, 0.75 + row * 0.55, 1.4 - row * 2.4]} receiveShadow>
          <boxGeometry args={[32, 0.4, 2.1]} />
          <meshStandardMaterial color={row % 2 === 0 ? '#4c535a' : '#3b4248'} roughness={0.82} />
        </mesh>
      ))}
      {Array.from({ length: 30 }, (_, index) => {
        const row = Math.floor(index / 10);
        const column = index % 10;
        const colour = colours[(index + row) % colours.length];

        return (
          <group key={`fan-${index}`} position={[-14 + column * 3.1, 1.25 + row * 0.55, 2.2 - row * 2.35]}>
            <mesh>
              <sphereGeometry args={[0.34, 12, 8]} />
              <meshStandardMaterial color="#f6c7a9" roughness={0.58} />
            </mesh>
            <mesh position={[0, -0.52, 0]}>
              <boxGeometry args={[0.72, 0.86, 0.38]} />
              <meshStandardMaterial color={colour} roughness={0.62} />
            </mesh>
            <mesh position={[0.42, -0.36, 0]} rotation={[0, 0, 0.55]}>
              <boxGeometry args={[0.18, 0.72, 0.18]} />
              <meshStandardMaterial color={colour} roughness={0.62} />
            </mesh>
          </group>
        );
      })}
      <Html position={[-7.5, 3.35, -2.2]} center className="crowd-shout" occlude={false}>
        <span>{shout}</span>
      </Html>
    </group>
  );
}
