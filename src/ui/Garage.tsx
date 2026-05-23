import { Check, Disc3, Gauge, Lock, Sparkles, Wind, X } from 'lucide-react';
import { getPartsByCategory } from '../game/catalogue';
import { calculateLoadoutStats, getSpeedLabel, isPartUnlocked, trySelectPart } from '../game/progression';
import type { Loadout, PartCategory, PartDefinition, PlayerProgress } from '../game/types';
import { PartStatBars } from './PartStatBars';

interface GarageProps {
  progress: PlayerProgress;
  loadout: Loadout;
  onLoadoutChange: (loadout: Loadout) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<PartCategory, string> = {
  cart: 'Carts',
  wheels: 'Wheels',
  glider: 'Gliders'
};

const CATEGORY_ICONS = {
  cart: Gauge,
  wheels: Disc3,
  glider: Wind
};

export function Garage({ progress, loadout, onLoadoutChange, onClose }: GarageProps) {
  const stats = calculateLoadoutStats(loadout);

  return (
    <section className="panel garage-panel" aria-label="Garage">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Garage</p>
          <h2>{getSpeedLabel(stats)} setup</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close garage">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <PartStatBars stats={stats} />

      <div className="garage-grid">
        {(['cart', 'wheels', 'glider'] as PartCategory[]).map((category) => {
          const Icon = CATEGORY_ICONS[category];

          return (
            <div className="garage-column" key={category}>
              <h3>
                <Icon size={17} aria-hidden="true" />
                {CATEGORY_LABELS[category]}
              </h3>
              {getPartsByCategory(category).map((part) => (
                <PartButton
                  key={part.id}
                  part={part}
                  progress={progress}
                  selected={isSelected(loadout, part)}
                  onSelect={() => onLoadoutChange(trySelectPart(loadout, part, progress))}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="progress-strip" aria-label="Progress">
        <span>
          <Sparkles size={16} aria-hidden="true" />
          Wins {progress.wins}
        </span>
        <span>Hits {progress.knockouts}</span>
      </div>
    </section>
  );
}

function PartButton({
  part,
  progress,
  selected,
  onSelect
}: {
  part: PartDefinition;
  progress: PlayerProgress;
  selected: boolean;
  onSelect: () => void;
}) {
  const unlocked = isPartUnlocked(part, progress);

  return (
    <button className="part-button" type="button" disabled={!unlocked} onClick={onSelect}>
      <span className="part-swatch" style={{ backgroundColor: part.colour }} />
      <span>
        <strong>{part.name}</strong>
        <small>{part.summary}</small>
      </span>
      {selected ? <Check size={16} aria-label="Selected" /> : unlocked ? null : <Lock size={16} aria-label="Locked" />}
    </button>
  );
}

function isSelected(loadout: Loadout, part: PartDefinition): boolean {
  if (part.category === 'cart') {
    return loadout.cartId === part.id;
  }

  if (part.category === 'wheels') {
    return loadout.wheelsId === part.id;
  }

  return loadout.gliderId === part.id;
}
