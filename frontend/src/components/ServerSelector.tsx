import React from 'react';
import type { Server } from '../types';

interface ServerSelectorProps {
  servers: Server[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
}

export const ServerSelector: React.FC<ServerSelectorProps> = ({
  servers,
  selectedServerId,
  onSelectServer,
}) => {
  const activeServers = servers.filter(s => s.is_active);

  return (
    <div className="flex flex-wrap gap-2">
      {activeServers.map((server) => (
        <button
          key={server.id}
          onClick={() => onSelectServer(server.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedServerId === server.id
              ? 'bg-amber-600 text-white shadow-lg'
              : 'bg-stone-800 text-gray-300 hover:bg-stone-700 border border-stone-700'
          }`}
        >
          {server.name}
          <span className="ml-2 text-xs opacity-70">({server.type})</span>
        </button>
      ))}
    </div>
  );
};
