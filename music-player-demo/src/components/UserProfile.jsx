import React, { useState, useEffect } from 'react';
import { X, Music, Calendar, User } from 'lucide-react';
import { fetchUserProfile, fetchUserPublicPlaylistsWithSongs } from '../services/api';

export default function UserProfile({ userId, onClose, onPlaylistClick }) {
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  async function loadUserData() {
    try {
      setLoading(true);
      setError(null);
      
      const [profileData, playlistsData] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserPublicPlaylistsWithSongs(userId)
      ]);
      
      setProfile(profileData.user);
      setPlaylists(playlistsData.playlists);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl p-8 max-w-md">
          <p className="text-red-400">{error || 'Profile not found'}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-purple-500 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">
                {profile.username || 'User'}
              </h1>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {profile.username}'s Playlists
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No public playlists yet</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => onPlaylistClick?.(playlist)}
                  className="group bg-gray-800/50 hover:bg-gray-800 rounded-xl p-5 transition-all hover:scale-[1.02] text-left"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: playlist.color }}
                    >
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                        {playlist.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {playlist.count} {playlist.count === 1 ? 'song' : 'songs'}
                      </p>
                      {playlist.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
