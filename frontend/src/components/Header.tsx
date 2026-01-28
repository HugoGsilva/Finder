import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-stone-900 border-b border-stone-800 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-amber-400">Guild Monitor</h1>
            <span className="text-gray-500 text-sm">Rubinot</span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-gray-400 text-sm">
                  Welcome, <span className="text-white font-medium">{user.username}</span>
                  {user.is_admin && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-600 text-white text-xs rounded">Admin</span>
                  )}
                </span>
                {user.is_admin && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-gray-300 text-sm rounded-lg border border-stone-700 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 text-sm rounded-lg border border-red-800 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
