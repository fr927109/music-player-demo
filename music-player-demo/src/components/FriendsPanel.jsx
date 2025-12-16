import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, X, Music, Calendar, User } from 'lucide-react';
import { searchUsers, fetchUserProfile, fetchUserPublicPlaylists } from '../services/api';
import UserProfile from './UserProfile';

export default function FriendsPanel({ currentUserId, onPlaySong, onAddToQueue }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  async function handleSearch() {
    if (searchQuery.length === 0) {
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }

  function handleAddFriend(userId) {
    // Logic to add a friend
  }

  function handlePlaylistClick(playlist) {
    if (playlist.songs && playlist.songs.length > 0) {
      onPlaySong(playlist.songs[0]);
      playlist.songs.slice(1).forEach(song => onAddToQueue(song));
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Search bar */}
      <div className="p-4 bg-gray-800 rounded-lg shadow-md mb-4">
        <div className="flex items-center">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search for users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
          />
          <button
            onClick={handleSearch}
            className="ml-3 px-4 py-2 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Search results */}
      {isSearching ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <User className="w-12 h-12 text-purple-400 mr-4" />
                    <div className="text-white">
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-gray-400">
                        Member since {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(user.id)}
                    className="px-4 py-2 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 transition-colors"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friends list - Existing code for friends list */}

      {/* UserProfile component for selected friend */}
      {selectedFriend && (
        <UserProfile
          userId={selectedFriend.user_id}
          onClose={() => setSelectedFriend(null)}
          onPlaylistClick={handlePlaylistClick}
        />
      )}
    </div>
  );
}