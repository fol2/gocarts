import type { GameMode } from '../game/types';

interface TrackProps {
  mode: GameMode;
}

export function Track({ mode }: TrackProps) {
  const isRace = mode === 'race' || mode === 'battleground-race';
  const isBattle = mode === 'battleground' || mode === 'battleground-race';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[43, 96]} />
        <meshStandardMaterial color="#244f38" roughness={0.82} />
      </mesh>
      {isRace ? (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
            <ringGeometry args={[16, 26, 128]} />
            <meshStandardMaterial color="#5f6468" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.08, -21]} receiveShadow>
            <boxGeometry args={[12, 0.08, 0.7]} />
            <meshStandardMaterial color="#f7f4ea" />
          </mesh>
          <Ramp position={[11, 0, 17]} rotation={-0.7} />
          <Ramp position={[-16, 0, -12]} rotation={1.1} />
        </>
      ) : null}
      {isBattle ? (
        <>
          <mesh position={[0, 0.12, 0]} receiveShadow>
            <cylinderGeometry args={[12, 14, 0.2, 8]} />
            <meshStandardMaterial color="#7a4f2a" roughness={0.86} />
          </mesh>
          {[
            [-10, 0, 9],
            [12, 0, 8],
            [6, 0, -12],
            [-13, 0, -8]
          ].map(([x, y, z]) => (
            <mesh key={`${x}-${z}`} position={[x, y + 0.65, z]} castShadow receiveShadow>
              <boxGeometry args={[3.2, 1.3, 2.3]} />
              <meshStandardMaterial color="#b56576" roughness={0.72} />
            </mesh>
          ))}
        </>
      ) : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[39, 40, 96]} />
        <meshStandardMaterial color="#f2c14e" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Ramp({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <mesh position={position} rotation={[0.25, rotation, 0]} castShadow receiveShadow>
      <boxGeometry args={[5, 0.5, 3]} />
      <meshStandardMaterial color="#8ecae6" roughness={0.58} />
    </mesh>
  );
}
