import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { api } from '../lib/api';
import type { User, Guild, Server } from '../types';
import { formatDateTime } from '../utils/date';
import { getClassificationColor } from '../utils/format';
import clsx from 'clsx';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'guilds'>('users');
  
  // New guild form
  const [showGuildForm, setShowGuildForm] = useState(false);
  const [newGuild, setNewGuild] = useState({
    name: '',
    classification: 'neutral' as 'ally' | 'enemy' | 'neutral',
  });

  useEffect(() => {
    loadUsers();
    loadServers();
  }, []);

  useEffect(() => {
    if (selectedServerId) {
      loadGuilds(selectedServerId);
    }
  }, [selectedServerId]);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadServers = async () => {
    try {
      const data = await api.getServers();
      setServers(data);
      if (data.length > 0) {
        setSelectedServerId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadGuilds = async (serverId: string) => {
    try {
      setIsLoadingGuilds(true);
      const data = await api.getGuilds(serverId);
      setGuilds(data);
    } catch (error) {
      console.error('Failed to load guilds:', error);
    } finally {
      setIsLoadingGuilds(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await api.approveUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServerId) return;

    try {
      await api.createGuild({
        server_id: selectedServerId,
        name: newGuild.name,
        classification: newGuild.classification,
        is_active: true,
      });
      setNewGuild({ name: '', classification: 'neutral' });
      setShowGuildForm(false);
      loadGuilds(selectedServerId);
    } catch (error) {
      console.error('Failed to create guild:', error);
    }
  };

  const handleUpdateGuild = async (guildId: string, updates: Partial<Guild>) => {
    try {
      await api.updateGuild(guildId, updates);
      loadGuilds(selectedServerId);
    } catch (error) {
      console.error('Failed to update guild:', error);
    }
  };

  const handleDeleteGuild = async (guildId: string) => {
    if (!confirm('Are you sure you want to delete this guild?')) return;

    try {
      await api.deleteGuild(guildId);
      loadGuilds(selectedServerId);
    } catch (error) {
      console.error('Failed to delete guild:', error);
    }
  };

  const pendingUsers = users.filter(u => !u.is_approved);
  const approvedUsers = users.filter(u => u.is_approved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-stone-900 to-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-stone-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('guilds')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'guilds'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Guild Management
          </button>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            {isLoadingUsers ? (
              <LoadingSpinner text="Loading users..." />
            ) : (
              <>
                {/* Pending Users */}
                {pendingUsers.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-amber-400 mb-4">
                      Pending Approval ({pendingUsers.length})
                    </h2>
                    <div className="grid gap-4">
                      {pendingUsers.map(user => (
                        <div
                          key={user.id}
                          className="bg-stone-800 rounded-lg p-4 border border-stone-700 flex items-center justify-between"
                        >
                          <div>
                            <h3 className="text-white font-semibold">{user.username}</h3>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Registered: {formatDateTime(user.created_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved Users */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Approved Users ({approvedUsers.length})
                  </h2>
                  <div className="bg-stone-800 rounded-lg border border-stone-700 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-stone-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Username</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedUsers.map(user => (
                          <tr key={user.id} className="border-t border-stone-700">
                            <td className="px-4 py-3 text-white">{user.username}</td>
                            <td className="px-4 py-3 text-gray-400">{user.email}</td>
                            <td className="px-4 py-3">
                              {user.is_admin ? (
                                <span className="px-2 py-1 bg-amber-600 text-white text-xs rounded">Admin</span>
                              ) : (
                                <span className="px-2 py-1 bg-stone-700 text-gray-300 text-xs rounded">User</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {formatDateTime(user.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Guild Management Tab */}
        {activeTab === 'guilds' && (
          <div className="space-y-6">
            {/* Server Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Server</label>
              <select
                value={selectedServerId}
                onChange={(e) => setSelectedServerId(e.target.value)}
                className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {servers.map(server => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Guild Button */}
            <button
              onClick={() => setShowGuildForm(!showGuildForm)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              {showGuildForm ? 'Cancel' : 'Add Guild'}
            </button>

            {/* New Guild Form */}
            {showGuildForm && (
              <form onSubmit={handleCreateGuild} className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Guild</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Guild Name</label>
                    <input
                      type="text"
                      value={newGuild.name}
                      onChange={(e) => setNewGuild({ ...newGuild, name: e.target.value })}
                      className="w-full px-4 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Classification</label>
                    <select
                      value={newGuild.classification}
                      onChange={(e) => setNewGuild({ ...newGuild, classification: e.target.value as any })}
                      className="w-full px-4 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="ally">Ally</option>
                      <option value="enemy">Enemy</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Create Guild
                  </button>
                </div>
              </form>
            )}

            {/* Guilds List */}
            {isLoadingGuilds ? (
              <LoadingSpinner text="Loading guilds..." />
            ) : (
              <div className="space-y-4">
                {guilds.map(guild => (
                  <div
                    key={guild.id}
                    className="bg-stone-800 rounded-lg p-4 border border-stone-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={clsx('text-lg font-semibold', getClassificationColor(guild.classification))}>
                          {guild.name}
                        </h3>
                        <p className="text-gray-400 text-sm">Members: {guild.member_count}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={guild.classification}
                          onChange={(e) => handleUpdateGuild(guild.id, { classification: e.target.value as any })}
                          className="px-3 py-1 bg-stone-900 border border-stone-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="ally">Ally</option>
                          <option value="enemy">Enemy</option>
                          <option value="neutral">Neutral</option>
                        </select>
                        <button
                          onClick={() => handleUpdateGuild(guild.id, { is_active: !guild.is_active })}
                          className={clsx(
                            'px-3 py-1 rounded text-sm transition-colors',
                            guild.is_active
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          )}
                        >
                          {guild.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteGuild(guild.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
