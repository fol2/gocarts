import { Bot, Flag, Play, Swords, Target, Wifi, Wrench } from 'lucide-react';
import { GAME_MODES } from '../game/catalogue';
import { getOpponentLabel } from '../game/match';
import type { GameMode, OpponentType, StatBlock } from '../game/types';
import { PartStatBars } from './PartStatBars';

interface MainMenuProps {
  mode: GameMode;
  opponentType: OpponentType;
  onlineRoomId: string;
  stats: StatBlock;
  onModeChange: (mode: GameMode) => void;
  onOpponentChange: (opponentType: OpponentType) => void;
  onOnlineRoomChange: (roomId: string) => void;
  onOpenGarage: () => void;
  onStart: () => void;
}

const MODE_ICONS = {
  race: Flag,
  battleground: Target,
  'battleground-race': Swords
};

export function MainMenu({
  mode,
  opponentType,
  onlineRoomId,
  stats,
  onModeChange,
  onOpponentChange,
  onOnlineRoomChange,
  onOpenGarage,
  onStart
}: MainMenuProps) {
  return (
    <section className="panel menu-panel" aria-label="Game setup">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Go-Carts</p>
          <h1>Pick your match</h1>
        </div>
        <button className="icon-text-button" type="button" onClick={onOpenGarage}>
          <Wrench size={18} aria-hidden="true" />
          Garage
        </button>
      </div>

      <div className="choice-group" aria-label="Mode">
        {GAME_MODES.map((gameMode) => {
          const Icon = MODE_ICONS[gameMode.id];

          return (
            <button
              className="choice-button"
              data-active={mode === gameMode.id}
              key={gameMode.id}
              type="button"
              aria-label={gameMode.name}
              onClick={() => onModeChange(gameMode.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{gameMode.shortName}</strong>
                <small>{gameMode.objective}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="segmented" aria-label="Opponents">
        {(['computers', 'online'] as OpponentType[]).map((type) => {
          const Icon = type === 'computers' ? Bot : Wifi;

          return (
            <button
              type="button"
              key={type}
              data-active={opponentType === type}
              aria-label={getOpponentLabel(type)}
              onClick={() => onOpponentChange(type)}
            >
              <Icon size={17} aria-hidden="true" />
              {getOpponentLabel(type)}
            </button>
          );
        })}
      </div>

      {opponentType === 'online' ? (
        <label className="room-field">
          <span>Room</span>
          <input
            aria-label="Online room"
            value={onlineRoomId}
            maxLength={6}
            onChange={(event) => onOnlineRoomChange(event.target.value)}
          />
        </label>
      ) : null}

      <PartStatBars stats={stats} />

      <button className="start-button" type="button" aria-label="Start match" onClick={onStart}>
        <Play size={20} aria-hidden="true" />
        Start
      </button>
    </section>
  );
}
