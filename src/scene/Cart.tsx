import { Html } from '@react-three/drei';
import { DoubleSide } from 'three';
import type { SimActor } from '../game/simulation';

interface CartProps {
  actor: SimActor;
}

export function Cart({ actor }: CartProps) {
  const y = 0.58 + actor.airborne * 0.75;
  const flash = actor.hitFlash > 0;

  return (
    <group position={[actor.position.x, y, actor.position.z]} rotation={[0, actor.heading, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.8, 0.75, 2.5]} />
        <meshStandardMaterial color={flash ? '#ffffff' : actor.colour} roughness={0.42} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.28, 0.95]} castShadow>
        <boxGeometry args={[1.25, 0.45, 0.8]} />
        <meshStandardMaterial color="#1f2428" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.08, -1.45]} castShadow>
        <coneGeometry args={[0.5, 1, 4]} />
        <meshStandardMaterial color="#f2c14e" roughness={0.35} />
      </mesh>
      {[-0.98, 0.98].map((x) =>
        [-0.85, 0.85].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.25, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.32, 16]} />
            <meshStandardMaterial color="#171717" roughness={0.68} />
          </mesh>
        ))
      )}
      {actor.airborne > 0.05 ? (
        <mesh position={[0, 1.1, -0.35]} rotation={[Math.PI / 2.15, 0, 0]}>
          <planeGeometry args={[2.8, 1.1]} />
          <meshStandardMaterial color="#f7f4ea" transparent opacity={0.8} side={DoubleSide} />
        </mesh>
      ) : null}
      {actor.shield > 0 ? (
        <mesh>
          <sphereGeometry args={[1.65, 24, 16]} />
          <meshStandardMaterial color="#80ed99" transparent opacity={0.22} emissive="#80ed99" emissiveIntensity={0.4} />
        </mesh>
      ) : null}
      <Html position={[0, 1.65, 0]} center className="cart-label">
        <span>{actor.name}</span>
      </Html>
    </group>
  );
}
