import React from 'react';
import type { Player } from '../types';
import { getVocationColor, getClassificationColor, getClassificationBg } from '../utils/format';
import { formatRelativeTime } from '../utils/date';
import clsx from 'clsx';

interface PlayerCardProps {
  player: Player;
  updated?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, updated = false }) => {
  return (
    <div
      className={clsx(
        'p-4 rounded-lg border transition-all duration-300',
        getClassificationBg(player.guild_classification || 'neutral'),
        updated && 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-white font-semibold text-lg">{player.name}</h3>
          <p className={clsx('text-sm', getVocationColor(player.vocation))}>
            Level {player.level} {player.vocation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {player.is_online && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 text-xs font-medium">Online</span>
            </span>
          )}
        </div>
      </div>

      {player.guild_name && (
        <div className="mb-2">
          <span className="text-gray-400 text-sm">Guild: </span>
          <span className={clsx('text-sm font-medium', getClassificationColor(player.guild_classification || 'neutral'))}>
            {player.guild_name}
          </span>
        </div>
      )}

      {player.last_seen && (
        <div className="text-gray-400 text-xs">
          Last seen: {formatRelativeTime(player.last_seen)}
        </div>
      )}
    </div>
  );
};
