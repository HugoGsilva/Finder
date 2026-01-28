import React from 'react';
import type { HuntingSession } from '../types';
import { getVocationColor, getClassificationColor, formatXpPerHour, formatDuration } from '../utils/format';
import { formatRelativeTime } from '../utils/date';
import clsx from 'clsx';

interface HuntingCardProps {
  session: HuntingSession;
  updated?: boolean;
}

export const HuntingCard: React.FC<HuntingCardProps> = ({ session, updated = false }) => {
  const xpGained = session.xp_gained ? BigInt(session.xp_gained) : BigInt(0);
  const avgXpPerHour = session.avg_xp_per_hour ? parseFloat(session.avg_xp_per_hour) : 0;

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border bg-stone-800/50 border-stone-700 transition-all duration-300',
        updated && 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-lg">{session.player_name}</h3>
          <p className={clsx('text-sm', getVocationColor(session.vocation))}>
            Level {session.level} {session.vocation}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-amber-500 text-xs font-medium">Hunting</span>
        </div>
      </div>

      {session.guild_name && (
        <div className="mb-3">
          <span className="text-gray-400 text-sm">Guild: </span>
          <span className={clsx('text-sm font-medium', getClassificationColor(session.guild_classification || 'neutral'))}>
            {session.guild_name}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-stone-900/50 p-2 rounded">
          <p className="text-gray-400 text-xs mb-1">XP Gained</p>
          <p className="text-white font-medium">{xpGained.toLocaleString()}</p>
        </div>
        <div className="bg-stone-900/50 p-2 rounded">
          <p className="text-gray-400 text-xs mb-1">XP/Hour</p>
          <p className="text-green-400 font-medium">{formatXpPerHour(avgXpPerHour)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Duration: <span className="text-white">{formatDuration(session.duration_minutes || 0)}</span>
        </span>
        <span className="text-gray-500 text-xs">{formatRelativeTime(session.start_time)}</span>
      </div>
    </div>
  );
};
