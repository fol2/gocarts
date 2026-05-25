import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, DoorOpen, Rocket, Shield, Zap } from 'lucide-react';
import type { MatchSetup } from '../game/types';
import { getCountdownCue, PLAYER_ID, type CountdownCue, type SimulationState } from '../game/simulation';

interface HudProps {
  setup: MatchSetup;
  snapshot?: SimulationState;
  resultText?: string;
  onExit: () => void;
  onRestart: () => void;
}

type ActionName = 'accelerate' | 'brake' | 'left' | 'right' | 'fire' | 'jump';

export function Hud({ setup, snapshot, resultText, onExit, onRestart }: HudProps) {
  const player = snapshot?.actors.find((actor) => actor.id === PLAYER_ID);
  const lapText = setup.config.lapsRequired ? `Lap ${Math.min((player?.lap ?? 0) + 1, setup.config.lapsRequired)}/${setup.config.lapsRequired}` : 'Arena';
  const hitText = setup.config.combatTarget ? `Hits ${player?.score ?? 0}/${setup.config.combatTarget}` : `Hits ${player?.score ?? 0}`;
  const health = player?.health ?? 100;
  const countdownCue = !resultText ? getCountdownCue(setup.mode, snapshot?.time ?? 0) : undefined;

  useCountdownSpeech(countdownCue, snapshot?.time ?? 0);

  return (
    <>
      {countdownCue ? (
        <section className="countdown-banner" aria-live="assertive" aria-label="Race start countdown">
          <span>{countdownCue}</span>
        </section>
      ) : null}

      <section className="hud-top" aria-label="Match status">
        <div className="hud-pill">{setup.config.title}</div>
        <div className="hud-pill">{lapText}</div>
        <div className="hud-pill">{hitText}</div>
        <div className="hud-health" aria-label="Health">
          <span style={{ width: `${health}%` }} />
        </div>
        <div className="hud-pill weapon-pill">
          {player?.shield ? <Shield size={16} aria-hidden="true" /> : <Rocket size={16} aria-hidden="true" />}
          {player?.weapon ?? 'Empty'}
        </div>
        <button className="icon-button" type="button" onClick={onExit} aria-label="Exit match">
          <DoorOpen size={18} aria-hidden="true" />
        </button>
      </section>

      {resultText ? (
        <section className="panel result-panel" aria-label="Match result">
          <p className="eyebrow">Result</p>
          <h2>{resultText}</h2>
          <div className="result-actions">
            <button className="icon-text-button" type="button" onClick={onRestart}>
              <Rocket size={18} aria-hidden="true" />
              Again
            </button>
            <button className="icon-text-button secondary" type="button" onClick={onExit}>
              <DoorOpen size={18} aria-hidden="true" />
              Menu
            </button>
          </div>
        </section>
      ) : null}

      <section className="touch-controls" aria-label="Controls">
        <div className="drive-pad">
          <ControlButton action="accelerate" label="Forward" icon={<ArrowUp size={20} />} />
          <div>
            <ControlButton action="left" label="Left" icon={<ArrowLeft size={20} />} />
            <ControlButton action="brake" label="Brake" icon={<ArrowDown size={20} />} />
            <ControlButton action="right" label="Right" icon={<ArrowRight size={20} />} />
          </div>
        </div>
        <div className="action-pad">
          <ControlButton action="jump" label="Glide" icon={<Zap size={20} />} />
          <ControlButton action="fire" label="Fire" icon={<Rocket size={20} />} />
        </div>
      </section>
    </>
  );
}

function useCountdownSpeech(cue: CountdownCue | undefined, time: number) {
  const lastSpokenRef = useRef<CountdownCue | undefined>(undefined);
  const lastTimeRef = useRef(time);

  useEffect(() => {
    if (time < lastTimeRef.current) {
      lastSpokenRef.current = undefined;
    }

    lastTimeRef.current = time;

    if (!cue || cue === lastSpokenRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    lastSpokenRef.current = cue;

    try {
      const utterance = new SpeechSynthesisUtterance(cue === 'GO' ? 'go' : cue);
      utterance.rate = 1;
      utterance.pitch = cue === 'GO' ? 1.18 : 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // Browsers can block speech synthesis; the visual countdown remains authoritative.
    }
  }, [cue, time]);
}

function ControlButton({ action, label, icon }: { action: ActionName; label: string; icon: React.ReactNode }) {
  const setActive = (active: boolean) => {
    window.dispatchEvent(new CustomEvent('gocarts:action', { detail: { action, active } }));
  };

  return (
    <button
      className="control-button"
      type="button"
      aria-label={label}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      onPointerCancel={() => setActive(false)}
    >
      {icon}
    </button>
  );
}
