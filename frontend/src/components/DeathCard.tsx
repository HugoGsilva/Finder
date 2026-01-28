import React from 'react';
import type { Death } from '../types';
import { getClassificationColor } from '../utils/format';
import { formatRelativeTime, formatTime } from '../utils/date';
import clsx from 'clsx';

interface DeathCardProps {
  death: Death;
  updated?: boolean;
}

export const DeathCard: React.FC<DeathCardProps> = ({ death, updated = false }) => {
  return (
    <div
      className={clsx(
        'p-4 rounded-lg border bg-stone-800/50 border-stone-700 transition-all duration-300',
        updated && 'ring-2 ring-red-400 shadow-lg shadow-red-400/20'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold">
              {death.player_name}
              {death.player_guild && (
                <span className={clsx('ml-2 text-sm', getClassificationColor(death.player_guild_classification || 'neutral'))}>
                  [{death.player_guild}]
                </span>
              )}
            </h3>
          </div>
          <p className="text-gray-400 text-sm">Level {death.level}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs">{formatTime(death.death_time)}</p>
          <p className="text-gray-500 text-xs">{formatRelativeTime(death.death_time)}</p>
        </div>
      </div>

      <div className="border-t border-stone-700 pt-3">
        <p className="text-gray-400 text-sm mb-2">Killed by:</p>
        <div className="space-y-1">
          {death.killers.map((killer, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-white text-sm">{killer}</span>
              {death.killer_guilds[index] && (
                <span className={clsx('text-xs', getClassificationColor(death.killer_classifications[index] || 'neutral'))}>
                  [{death.killer_guilds[index]}]
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
