import { Gauge, Rocket, Wind, Wrench } from 'lucide-react';
import type { StatBlock } from '../game/types';

interface PartStatBarsProps {
  stats: StatBlock;
}

const STAT_ROWS = [
  { key: 'speed', label: 'Speed', icon: Gauge, colour: '#f2c14e' },
  { key: 'handling', label: 'Handling', icon: Wrench, colour: '#8ecae6' },
  { key: 'glide', label: 'Glide', icon: Wind, colour: '#80ed99' },
  { key: 'boost', label: 'Boost', icon: Rocket, colour: '#ef476f' }
] as const;

export function PartStatBars({ stats }: PartStatBarsProps) {
  return (
    <div className="stat-bars" aria-label="Loadout stats">
      {STAT_ROWS.map(({ key, label, icon: Icon, colour }) => {
        const value = Math.min(100, Math.round(stats[key]));

        return (
          <div className="stat-row" key={key}>
            <span className="stat-label">
              <Icon aria-hidden="true" size={16} />
              {label}
            </span>
            <span className="stat-track" aria-hidden="true">
              <span className="stat-fill" style={{ width: `${value}%`, backgroundColor: colour }} />
            </span>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}
