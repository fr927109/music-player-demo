// ============================================================================
// API SERVICE MODULE
// Purpose: Centralized API client for communicating with backend
// Usage: Import and use functions to fetch/post data from database
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================================================
// ERROR HANDLING
// ============================================================================

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return handleResponse(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error', message: error.message };
  }
}

// ============================================================================
// ARTISTS
// ============================================================================

/**
 * Fetch all artists from database
 * @returns {Promise<Array>} Array of artist objects
 */
export async function fetchArtists() {
  try {
    const response = await fetch(`${API_URL}/artists`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching artists:', error);
    throw error;
  }
}

/**
 * Fetch single artist by ID
 * @param {number} artistId - ID of artist to fetch
 * @returns {Promise<Object>} Artist object
 */
export async function fetchArtist(artistId) {
  try {
    const response = await fetch(`${API_URL}/artists/${artistId}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching artist ${artistId}:`, error);
    throw error;
  }
}

// ============================================================================
// SONGS
// ============================================================================

/**
 * Fetch all songs from database
 * @returns {Promise<Array>} Array of song objects with artist info
 */
export async function fetchSongs() {
  try {
    const response = await fetch(`${API_URL}/songs`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
}

/**
 * Fetch single song by ID
 * @param {number} songId - ID of song to fetch
 * @returns {Promise<Object>} Song object with artist info
 */
export async function fetchSong(songId) {
  try {
    const response = await fetch(`${API_URL}/songs/${songId}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching song ${songId}:`, error);
    throw error;
  }
}

/**
 * Fetch all songs by a specific artist
 * @param {number} artistId - ID of artist
 * @returns {Promise<Array>} Array of song objects
 */
export async function fetchSongsByArtist(artistId) {
  try {
    const response = await fetch(`${API_URL}/songs/by-artist/${artistId}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching songs by artist ${artistId}:`, error);
    throw error;
  }
}

// ============================================================================
// USERS
// ============================================================================

/**
 * Fetch user profile (without password)
 * @param {number} userId - ID of user to fetch
 * @returns {Promise<Object>} User object
 */
export async function fetchUser(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object and success status
 */
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

/**
 * Sign up new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} username - Username (optional)
 * @returns {Promise<Object>} User object and success status
 */
export async function signupUser(email, password, username = '') {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error during signup:', error);
    throw error;
  }
}

/**
 * Search users by username or email
 * @param {string} query - Search query string
 * @returns {Promise<Object>} Object with users array
 */
export async function searchUsers(query) {
  try {
    if (!query || query.trim().length === 0) {
      return { users: [] };
    }
    
    const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error during user search:', error);
    throw error;
  }
}

/**
 * Get public profile of a user
 * @param {number} userId - ID of user
 * @returns {Promise<Object>} User profile object
 */
export async function fetchUserProfile(userId) {
  try {
    // Use the simpler /users/{id} endpoint which should already exist
    const response = await fetch(`${API_URL}/users/${userId}`);
    const data = await handleResponse(response);
    
    // Remove email from public profile view
    const { email, password, ...publicProfile } = data;
    
    // Wrap in a 'user' property to maintain consistent API structure
    return { user: publicProfile };
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get public playlists of a user
 * @param {number} userId - ID of user
 * @returns {Promise<Array>} Array of playlist objects
 */
export async function fetchUserPublicPlaylists(userId) {
  try {
    // Use the regular playlists endpoint - it should work for viewing other users' playlists
    const response = await fetch(`${API_URL}/playlists/${userId}`);
    const playlists = await handleResponse(response);
    
    // Transform to match expected structure
    return {
      playlists: playlists.map(playlist => ({
        id: playlist.playlist_id || playlist.id,
        name: playlist.name,
        count: playlist.song_count || playlist.count || 0,
        color: playlist.color_hex || playlist.color || '#a855f7',
        image: playlist.image || null,
        description: playlist.description || ''
      }))
    };
  } catch (error) {
    console.error(`Error fetching public playlists for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get public playlists of a user with their songs
 * @param {number} userId - ID of user
 * @returns {Promise<Array>} Array of playlist objects with songs
 */
export async function fetchUserPublicPlaylistsWithSongs(userId) {
  try {
    const playlistsData = await fetchUserPublicPlaylists(userId);
    const playlists = playlistsData.playlists;
    
    // Fetch songs for each playlist
    const playlistsWithSongs = await Promise.all(
      playlists.map(async (playlist) => {
        try {
          const songs = await fetchPlaylistSongs(playlist.id);
          return { ...playlist, songs };
        } catch (error) {
          console.error(`Error fetching songs for playlist ${playlist.id}:`, error);
          return { ...playlist, songs: [] };
        }
      })
    );
    
    return { playlists: playlistsWithSongs };
  } catch (error) {
    console.error(`Error fetching public playlists with songs for user ${userId}:`, error);
    throw error;
  }
}

// ============================================================================
// PLAYLISTS
// ============================================================================

/**
 * Fetch all playlists for a user
 * @param {number} userId - ID of user
 * @returns {Promise<Array>} Array of playlist objects with song count
 */
export async function fetchUserPlaylists(userId) {
  try {
    const response = await fetch(`${API_URL}/playlists/${userId}`);
    const playlists = await handleResponse(response);
    
    // Transform backend data to match frontend expectations
    return playlists.map(playlist => ({
      id: playlist.playlist_id || playlist.id,
      name: playlist.name,
      count: playlist.song_count || playlist.count || 0,
      color: playlist.color_hex || playlist.color || '#a855f7',
      image: playlist.image || null,
      description: playlist.description || ''
    }));
  } catch (error) {
    console.error(`Error fetching playlists for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Fetch all songs in a specific playlist
 * @param {number} playlistId - ID of playlist
 * @returns {Promise<Array>} Array of songs in playlist with artist info
 */
export async function fetchPlaylistSongs(playlistId) {
  try {
    const response = await fetch(`${API_URL}/playlists/${playlistId}/songs`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching songs for playlist ${playlistId}:`, error);
    throw error;
  }
}

/**
 * Create new playlist
 * @param {number} userId - User ID
 * @param {string} name - Playlist name
 * @param {string} description - Playlist description (optional)
 * @param {string} colorHex - Hex color code (optional, defaults to #a855f7)
 * @returns {Promise<Object>} Response with new playlist_id
 */
export async function createPlaylist(userId, name, description = '', colorHex = '#a855f7') {
  try {
    const response = await fetch(`${API_URL}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name,
        description,
        color_hex: colorHex
      })
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

/**
 * Add song to playlist
 * @param {number} playlistId - ID of playlist
 * @param {number} songId - ID of song to add
 * @param {number} trackOrder - Position in playlist (optional)
 * @returns {Promise<Object>} Response indicating success
 */
export async function addSongToPlaylist(playlistId, songId, trackOrder = 999) {
  try {
    const response = await fetch(`${API_URL}/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        song_id: songId,
        track_order: trackOrder
      })
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
}

/**
 * Delete a playlist
 * @param {number} playlistId - ID of playlist to delete
 * @returns {Promise<Object>} Response indicating success
 */
export async function deletePlaylist(playlistId) {
  try {
    const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search for songs and artists
 * @param {string} query - Search query string
 * @returns {Promise<Object>} Object with songs and artists arrays
 */
export async function searchMusic(query) {
  try {
    if (!query || query.trim().length === 0) {
      return { songs: [], artists: [] };
    }
    
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error during search:', error);
    throw error;
  }
}

// ============================================================================
// BILLBOARD
// ============================================================================

/**
 * Fetch Billboard Hot 100 top 10 songs
 * @returns {Promise<Array>} Array of top 10 song objects
 */
export async function fetchBillboardTop10() {
  try {
    const response = await fetch(`${API_URL}/billboard/top10`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching Billboard Top 10:', error);
    throw error;
  }
}

// ============================================================================
// BATCH OPERATIONS (Helper Functions)
// ============================================================================

/**
 * Load all data needed for initial app load
 * @param {number} userId - Current user ID
 * @returns {Promise<Object>} Object containing songs, artists, playlists
 */
export async function loadAppData(userId) {
  try {
    console.log('🔍 API: Loading app data for user', userId);
    
    const [songs, artists, playlists] = await Promise.all([
      fetchSongs(),
      fetchArtists(),
      fetchUserPlaylists(userId)
    ]);
    
    console.log('📦 API: Loaded', songs.length, 'songs,', artists.length, 'artists,', playlists.length, 'playlists');
    console.log('📋 API: Playlists:', playlists);
    
    return { songs, artists, playlists };
  } catch (error) {
    console.error('Error loading app data:', error);
    throw error;
  }
}

/**
 * Create playlist with songs
 * @param {number} userId - User ID
 * @param {string} name - Playlist name
 * @param {Array<number>} songIds - Array of song IDs to add
 * @param {string} colorHex - Hex color code
 * @returns {Promise<Object>} Created playlist info
 */
export async function createPlaylistWithSongs(userId, name, songIds, colorHex) {
  try {
    // Create playlist
    const playlistResponse = await createPlaylist(userId, name, '', colorHex);
    const playlistId = playlistResponse.playlist_id;
    
    // Add songs to playlist
    for (let i = 0; i < songIds.length; i++) {
      await addSongToPlaylist(playlistId, songIds[i], i + 1);
    }
    
    return playlistResponse;
  } catch (error) {
    console.error('Error creating playlist with songs:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {number} userId - ID of user to update
 * @param {Object} profileData - Object containing profile fields to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUserProfile(userId, profileData) {
  const response = await fetch(`${API_URL}/users/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }
  
  return response.json();
}

export default {
  // Health
  checkAPIHealth,
  // Artists
  fetchArtists,
  fetchArtist,
  // Songs
  fetchSongs,
  fetchSong,
  fetchSongsByArtist,
  // Users
  fetchUser,
  loginUser,
  signupUser,
  searchUsers,
  fetchUserProfile,
  fetchUserPublicPlaylists,
  fetchUserPublicPlaylistsWithSongs,
  // Playlists
  fetchUserPlaylists,
  fetchPlaylistSongs,
  createPlaylist,
  addSongToPlaylist,
  deletePlaylist,
  // Search
  searchMusic,
  // Billboard
  fetchBillboardTop10,
  // Batch
  loadAppData,
  createPlaylistWithSongs,
  // Update
  updateUserProfile
};