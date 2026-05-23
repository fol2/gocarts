import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import type { SimulationState } from '../game/simulation';
import type { MatchSetup } from '../game/types';
import { GameScene } from './GameScene';

interface GameCanvasProps {
  setup: MatchSetup;
  active: boolean;
  onSnapshot: (snapshot: SimulationState) => void;
  onMatchEnd: (snapshot: SimulationState) => void;
}

export function GameCanvas({ setup, active, onSnapshot, onMatchEnd }: GameCanvasProps) {
  return (
    <Canvas className="game-canvas" camera={{ position: [0, 10, -18], fov: 54 }} dpr={[1, 1.75]}>
      <Suspense fallback={null}>
        <GameScene setup={setup} active={active} onSnapshot={onSnapshot} onMatchEnd={onMatchEnd} />
      </Suspense>
    </Canvas>
  );
}
