import type { GameMode } from '../game/types';
import { ROAD_WIDTH, TRACK_LENGTH, TRACK_SEGMENTS, TRACK_WAYPOINTS, routePointAt, trackSidePoint } from '../game/track';
import { SpectatorStands } from './SpectatorStands';

interface TrackProps {
  mode: GameMode;
}

export function Track({ mode }: TrackProps) {
  const isRace = mode === 'race' || mode === 'battleground-race';
  const isBattle = mode === 'battleground' || mode === 'battleground-race';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[76, 128]} />
        <meshStandardMaterial color="#25583f" roughness={0.82} />
      </mesh>
      {isRace ? (
        <>
          <LongRoad />
          <StartLine />
          <BoostPad distance={TRACK_LENGTH * 0.18} colour="#f2c14e" />
          <BoostPad distance={TRACK_LENGTH * 0.43} colour="#80ed99" />
          <BoostPad distance={TRACK_LENGTH * 0.71} colour="#8ecae6" />
          <Ramp distance={TRACK_LENGTH * 0.28} />
          <Ramp distance={TRACK_LENGTH * 0.62} />
          <TracksideCrowd distance={18} side={1} />
          <TracksideCrowd distance={46} side={-1} />
          <TracksideCrowd distance={TRACK_LENGTH * 0.38} side={1} />
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
        <ringGeometry args={[72, 73, 128]} />
        <meshStandardMaterial color="#f2c14e" roughness={0.6} />
      </mesh>
      <SpectatorStands />
    </group>
  );
}

function LongRoad() {
  return (
    <group>
      {TRACK_SEGMENTS.map((segment, index) => (
        <group key={`${segment.start.x}-${segment.start.z}`} position={[segment.midpoint.x, 0.08, segment.midpoint.z]} rotation={[0, segment.heading, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[ROAD_WIDTH, 0.14, segment.length + ROAD_WIDTH * 0.6]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#5f6468' : '#555b60'} roughness={0.9} />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * (ROAD_WIDTH / 2 + 0.55), 0.44, 0]}>
              <boxGeometry args={[0.52, 0.68, segment.length + ROAD_WIDTH * 0.35]} />
              <meshStandardMaterial color={(index + side) % 2 === 0 ? '#f2c14e' : '#ef476f'} roughness={0.52} />
            </mesh>
          ))}
        </group>
      ))}
      {TRACK_WAYPOINTS.map((point, index) => (
        <mesh key={`${point.x}-${point.z}`} position={[point.x, 0.09, point.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[ROAD_WIDTH / 2, 32]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#5f6468' : '#555b60'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function StartLine() {
  const point = routePointAt(0);

  return (
    <group position={[point.x, 0.19, point.z]} rotation={[0, point.heading, 0]}>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index} position={[-ROAD_WIDTH / 2 + 0.55 + index * 1.1, 0, 0]}>
          <boxGeometry args={[1.1, 0.12, 2.1]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#f7f4ea' : '#1b1d1f'} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function TracksideCrowd({ distance, side }: { distance: number; side: -1 | 1 }) {
  const point = trackSidePoint(distance, side, ROAD_WIDTH / 2 + 4.4);
  const routePoint = routePointAt(distance);

  return (
    <group position={[point.x, 0.15, point.z]} rotation={[0, routePoint.heading, 0]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[9, 0.24, 2.4]} />
        <meshStandardMaterial color="#3b4248" roughness={0.78} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <group key={index} position={[-3.4 + index * 1, 0.75, 0]}>
          <mesh>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial color="#f6c7a9" roughness={0.58} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.42, 0.5, 0.28]} />
            <meshStandardMaterial color={index % 3 === 0 ? '#f2c14e' : index % 3 === 1 ? '#ef476f' : '#8ecae6'} roughness={0.62} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BoostPad({ distance, colour }: { distance: number; colour: string }) {
  const point = routePointAt(distance);

  return (
    <group position={[point.x, 0.2, point.z]} rotation={[0, point.heading, 0]}>
      <mesh>
        <boxGeometry args={[4.8, 0.12, 7.2]} />
        <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={0.45} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.08, -1.1]}>
        <boxGeometry args={[3.1, 0.1, 0.35]} />
        <meshStandardMaterial color="#f7f4ea" emissive="#f7f4ea" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.08, 1.1]}>
        <boxGeometry args={[3.1, 0.1, 0.35]} />
        <meshStandardMaterial color="#f7f4ea" emissive="#f7f4ea" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function Ramp({ distance }: { distance: number }) {
  const point = routePointAt(distance);

  return (
    <mesh position={[point.x, 0.25, point.z]} rotation={[0.22, point.heading, 0]} castShadow receiveShadow>
      <boxGeometry args={[5, 0.5, 3]} />
      <meshStandardMaterial color="#8ecae6" roughness={0.58} />
    </mesh>
  );
}
