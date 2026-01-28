import React, { useEffect, useState, useRef } from 'react';
import { useDataStore } from '../store/dataStore';
import { socketClient } from '../lib/socket';
import { Header } from '../components/Header';
import { ServerSelector } from '../components/ServerSelector';
import { PlayerCard } from '../components/PlayerCard';
import { HuntingCard } from '../components/HuntingCard';
import { DeathCard } from '../components/DeathCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const DashboardPage: React.FC = () => {
  const {
    servers,
    selectedServerId,
    guilds,
    onlinePlayers,
    huntingSessions,
    deaths,
    isLoadingServers,
    isLoadingPlayers,
    isLoadingDeaths,
    loadServers,
    selectServer,
    handlePlayerStatus,
    handleNewDeath,
    handleHuntingUpdate,
    handleMemberUpdate,
  } = useDataStore();

  const [updatedPlayers, setUpdatedPlayers] = useState<Set<string>>(new Set());
  const [updatedHunting, setUpdatedHunting] = useState<Set<string>>(new Set());
  const [updatedDeaths, setUpdatedDeaths] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'online' | 'hunting' | 'deaths'>('online');
  
  // Refs to track user interaction - Property 28
  const isInteracting = useRef(false);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  useEffect(() => {
    if (!socketClient.isConnected()) {
      return;
    }

    // WebSocket event handlers with visual indicators (Property 27)
    const onPlayerStatus = (data: any) => {
      handlePlayerStatus(data);
      if (!isInteracting.current) {
        setUpdatedPlayers(prev => new Set(prev).add(data.player_id));
        setTimeout(() => {
          setUpdatedPlayers(prev => {
            const next = new Set(prev);
            next.delete(data.player_id);
            return next;
          });
        }, 3000);
      }
    };

    const onNewDeath = (data: any) => {
      handleNewDeath(data);
      if (!isInteracting.current) {
        setUpdatedDeaths(prev => new Set(prev).add(data.id));
        setTimeout(() => {
          setUpdatedDeaths(prev => {
            const next = new Set(prev);
            next.delete(data.id);
            return next;
          });
        }, 3000);
      }
    };

    const onHuntingUpdate = (data: any) => {
      handleHuntingUpdate(data);
      if (!isInteracting.current) {
        setUpdatedHunting(prev => new Set(prev).add(data.id));
        setTimeout(() => {
          setUpdatedHunting(prev => {
            const next = new Set(prev);
            next.delete(data.id);
            return next;
          });
        }, 3000);
      }
    };

    const onMemberUpdate = (data: any) => {
      handleMemberUpdate(data);
    };

    socketClient.on('player:status', onPlayerStatus);
    socketClient.on('death:new', onNewDeath);
    socketClient.on('hunting:update', onHuntingUpdate);
    socketClient.on('member:update', onMemberUpdate);

    return () => {
      socketClient.off('player:status', onPlayerStatus);
      socketClient.off('death:new', onNewDeath);
      socketClient.off('hunting:update', onHuntingUpdate);
      socketClient.off('member:update', onMemberUpdate);
    };
  }, [handlePlayerStatus, handleNewDeath, handleHuntingUpdate, handleMemberUpdate]);

  // Track user interaction to prevent updates from interrupting (Property 28)
  useEffect(() => {
    const handleMouseDown = () => { isInteracting.current = true; };
    const handleMouseUp = () => { isInteracting.current = false; };
    const handleTouchStart = () => { isInteracting.current = true; };
    const handleTouchEnd = () => { isInteracting.current = false; };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Filter guilds by classification
  const allyGuilds = guilds.filter(g => g.classification === 'ally' && g.is_active);
  const enemyGuilds = guilds.filter(g => g.classification === 'enemy' && g.is_active);

  // Filter players by guild classification
  const allyPlayers = onlinePlayers.filter(p => p.guild_classification === 'ally');
  const enemyPlayers = onlinePlayers.filter(p => p.guild_classification === 'enemy');
  const neutralPlayers = onlinePlayers.filter(p => !p.guild_classification || p.guild_classification === 'neutral');

  // Filter hunting sessions
  const allyHunting = huntingSessions.filter(h => h.guild_classification === 'ally');
  const enemyHunting = huntingSessions.filter(h => h.guild_classification === 'enemy');

  if (isLoadingServers) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <LoadingSpinner size="lg" text="Loading servers..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-stone-900 to-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Server Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Server</h2>
          <ServerSelector
            servers={servers}
            selectedServerId={selectedServerId}
            onSelectServer={selectServer}
          />
        </div>

        {selectedServerId && (
          <>
            {/* Guild Stats */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Allies</h3>
                <p className="text-3xl font-bold text-white">{allyGuilds.length}</p>
                <p className="text-gray-400 text-sm">Guilds</p>
              </div>
              <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Enemies</h3>
                <p className="text-3xl font-bold text-white">{enemyGuilds.length}</p>
                <p className="text-gray-400 text-sm">Guilds</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-stone-800">
              <button
                onClick={() => setActiveTab('online')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'online'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Online Players ({onlinePlayers.length})
              </button>
              <button
                onClick={() => setActiveTab('hunting')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'hunting'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Hunting ({huntingSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('deaths')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'deaths'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Killboard ({deaths.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'online' && (
              <div className="space-y-6">
                {isLoadingPlayers ? (
                  <LoadingSpinner text="Loading players..." />
                ) : onlinePlayers.length === 0 ? (
                  <EmptyState
                    title="No players online"
                    description="No players are currently online on this server"
                  />
                ) : (
                  <>
                    {allyPlayers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-green-400 mb-4">
                          Allies Online ({allyPlayers.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {allyPlayers.map(player => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              updated={updatedPlayers.has(player.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {enemyPlayers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-red-400 mb-4">
                          Enemies Online ({enemyPlayers.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {enemyPlayers.map(player => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              updated={updatedPlayers.has(player.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {neutralPlayers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                          Neutral/Unknown ({neutralPlayers.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {neutralPlayers.map(player => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              updated={updatedPlayers.has(player.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'hunting' && (
              <div className="space-y-6">
                {huntingSessions.length === 0 ? (
                  <EmptyState
                    title="No active hunting sessions"
                    description="No players are currently hunting"
                  />
                ) : (
                  <>
                    {allyHunting.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-green-400 mb-4">
                          Ally Hunters ({allyHunting.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {allyHunting.map(session => (
                            <HuntingCard
                              key={session.id}
                              session={session}
                              updated={updatedHunting.has(session.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {enemyHunting.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-red-400 mb-4">
                          Enemy Hunters ({enemyHunting.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {enemyHunting.map(session => (
                            <HuntingCard
                              key={session.id}
                              session={session}
                              updated={updatedHunting.has(session.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'deaths' && (
              <div>
                {isLoadingDeaths ? (
                  <LoadingSpinner text="Loading deaths..." />
                ) : deaths.length === 0 ? (
                  <EmptyState
                    title="No recent deaths"
                    description="No deaths have been recorded recently"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deaths.map(death => (
                      <DeathCard
                        key={death.id}
                        death={death}
                        updated={updatedDeaths.has(death.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!selectedServerId && servers.length > 0 && (
          <EmptyState
            title="Select a server"
            description="Choose a server above to view guild activity"
          />
        )}
      </main>
    </div>
  );
};
