import type { ProjectileState } from '../game/simulation';

interface ProjectileProps {
  projectile: ProjectileState;
}

export function Projectile({ projectile }: ProjectileProps) {
  return (
    <mesh position={[projectile.position.x, 0.9, projectile.position.z]} castShadow>
      <sphereGeometry args={[projectile.weapon === 'pulse' ? 0.55 : 0.36, 16, 16]} />
      <meshStandardMaterial color={projectile.weapon === 'pulse' ? '#4cc9f0' : '#ff4d4d'} emissive="#ffffff" emissiveIntensity={0.25} />
    </mesh>
  );
}
