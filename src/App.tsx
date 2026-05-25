import { useCallback, useMemo, useState } from 'react';
import { createMatchSetup } from './game/match';
import { createOnlineRoomId, normaliseOnlineRoomId } from './game/online';
import { applyMatchResult, calculateLoadoutStats, createStarterProgress } from './game/progression';
import { createInitialSelection } from './game/state';
import { PLAYER_ID, type SimulationState } from './game/simulation';
import type { GameMode, MatchSetup, OpponentType, PlayerProgress } from './game/types';
import { GameCanvas } from './scene/GameCanvas';
import { Garage } from './ui/Garage';
import { Hud } from './ui/Hud';
import { MainMenu } from './ui/MainMenu';

type Screen = 'menu' | 'garage' | 'match';

export default function App() {
  const initialSelection = useMemo(() => createInitialSelection(), []);
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<GameMode>(initialSelection.mode);
  const [opponentType, setOpponentType] = useState<OpponentType>(initialSelection.opponentType);
  const [onlineRoomId, setOnlineRoomId] = useState(() => createOnlineRoomId());
  const [loadout, setLoadout] = useState(initialSelection.loadout);
  const [progress, setProgress] = useState<PlayerProgress>(() => createStarterProgress());
  const [snapshot, setSnapshot] = useState<SimulationState>();
  const [matchSetup, setMatchSetup] = useState<MatchSetup>(() =>
    createMatchSetup(initialSelection.mode, initialSelection.opponentType, initialSelection.loadout, createStarterProgress(), onlineRoomId)
  );
  const [resultText, setResultText] = useState<string>();

  const currentSetup = useMemo(
    () => createMatchSetup(mode, opponentType, loadout, progress, onlineRoomId),
    [loadout, mode, onlineRoomId, opponentType, progress]
  );
  const stats = useMemo(() => calculateLoadoutStats(currentSetup.loadout), [currentSetup.loadout]);

  const startMatch = useCallback(() => {
    setResultText(undefined);
    setSnapshot(undefined);
    setMatchSetup(currentSetup);
    setScreen('match');
  }, [currentSetup]);

  const updateOnlineRoom = useCallback((value: string) => {
    const nextRoomId = normaliseOnlineRoomId(value);

    if (nextRoomId) {
      setOnlineRoomId(nextRoomId);
    }
  }, []);

  const finishMatch = useCallback(
    (finalSnapshot: SimulationState) => {
      const player = finalSnapshot.actors.find((actor) => actor.id === PLAYER_ID);
      const won = finalSnapshot.winnerId === PLAYER_ID;
      setProgress((current) =>
        applyMatchResult(current, {
          mode: finalSnapshot.setup.mode,
          won,
          knockouts: player?.score ?? 0
        })
      );
      setResultText(won ? 'You won' : 'Match over');
    },
    []
  );

  const exitToMenu = () => {
    setScreen('menu');
    setResultText(undefined);
    setSnapshot(undefined);
  };

  return (
    <main className="app-shell">
      <GameCanvas
        setup={screen === 'match' ? matchSetup : currentSetup}
        active={screen === 'match' && !resultText}
        onSnapshot={setSnapshot}
        onMatchEnd={finishMatch}
      />

      <div className="vignette" />

      {screen === 'match' ? (
        <Hud setup={matchSetup} snapshot={snapshot} resultText={resultText} onExit={exitToMenu} onRestart={startMatch} />
      ) : (
        <div className="menu-layout">
          <MainMenu
            mode={mode}
            opponentType={opponentType}
            onlineRoomId={onlineRoomId}
            stats={stats}
            onModeChange={setMode}
            onOpponentChange={setOpponentType}
            onOnlineRoomChange={updateOnlineRoom}
            onOpenGarage={() => setScreen('garage')}
            onStart={startMatch}
          />
          {screen === 'garage' ? (
            <Garage
              progress={progress}
              loadout={currentSetup.loadout}
              onLoadoutChange={setLoadout}
              onClose={() => setScreen('menu')}
            />
          ) : null}
        </div>
      )}
    </main>
  );
}
