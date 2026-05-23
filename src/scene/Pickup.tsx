import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { getWeaponById } from '../game/catalogue';
import type { PickupState } from '../game/simulation';

interface PickupProps {
  pickup: PickupState;
}

export function Pickup({ pickup }: PickupProps) {
  const meshRef = useRef<Mesh>(null);
  const weapon = getWeaponById(pickup.weapon);

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.rotation.y += delta * 1.8;
    meshRef.current.position.y = 1.1 + Math.sin(clock.elapsedTime * 2.6) * 0.16;
  });

  if (!pickup.active) {
    return null;
  }

  return (
    <mesh ref={meshRef} position={[pickup.position.x, 1.1, pickup.position.z]} castShadow>
      <octahedronGeometry args={[0.9, 0]} />
      <meshStandardMaterial color={weapon.colour} emissive={weapon.colour} emissiveIntensity={0.55} roughness={0.35} />
    </mesh>
  );
}
