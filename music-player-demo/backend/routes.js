// ============================================================================
// API ROUTES FOR MUSIC PLAYER
// Purpose: Handle data retrieval from MySQL database
// ============================================================================

import express from 'express';
import { pool } from './db.js';

const router = express.Router();

// ============================================================================
// ARTISTS ENDPOINTS
// ============================================================================

/**
 * GET /api/artists
 * Description: Retrieve all artists from database
 * Returns: Array of artists with id, name, bio
 */
router.get('/artists', async (req, res) => {
  try {
    const query = 'SELECT artist_id, name, bio FROM Artists ORDER BY name ASC';
    const [artists] = await pool.query(query);
    res.json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

/**
 * GET /api/artists/:id
 * Description: Retrieve single artist by ID
 */
router.get('/artists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT artist_id, name, bio FROM Artists WHERE artist_id = ?';
    const [artists] = await pool.query(query, [id]);
    
    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    res.json(artists[0]);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Failed to fetch artist' });
  }
});

// ============================================================================
// SONGS ENDPOINTS
// ============================================================================

/**
 * GET /api/songs
 * Description: Retrieve all songs with artist information
 * Returns: Array of songs with title, artist, duration, genre, etc.
 */
router.get('/songs', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.song_id,
        s.title,
        a.artist_id,
        a.name AS artist,
        CONCAT(FLOOR(s.duration / 60), ':', LPAD(s.duration % 60, 2, '0')) AS duration,
        s.genre,
        s.release_year,
        s.created_at
      FROM Songs s
      JOIN Artists a ON s.artist_id = a.artist_id
      ORDER BY a.name, s.title ASC
    `;
    const [songs] = await pool.query(query);
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

/**
 * GET /api/songs/:id
 * Description: Retrieve single song by ID with artist info
 */
router.get('/songs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        s.song_id,
        s.title,
        a.artist_id,
        a.name AS artist,
        CONCAT(FLOOR(s.duration / 60), ':', LPAD(s.duration % 60, 2, '0')) AS duration,
        s.genre,
        s.release_year
      FROM Songs s
      JOIN Artists a ON s.artist_id = a.artist_id
      WHERE s.song_id = ?
    `;
    const [songs] = await pool.query(query, [id]);
    
    if (songs.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(songs[0]);
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

/**
 * GET /api/songs/by-artist/:artistId
 * Description: Get all songs by a specific artist
 */
router.get('/songs/by-artist/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    const query = `
      SELECT 
        s.song_id,
        s.title,
        a.name AS artist,
        CONCAT(FLOOR(s.duration / 60), ':', LPAD(s.duration % 60, 2, '0')) AS duration,
        s.genre,
        s.release_year
      FROM Songs s
      JOIN Artists a ON s.artist_id = a.artist_id
      WHERE s.artist_id = ?
      ORDER BY s.title ASC
    `;
    const [songs] = await pool.query(query, [artistId]);
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs by artist:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// ============================================================================
// USERS ENDPOINTS
// ============================================================================

/**
 * GET /api/users/:id
 * Description: Retrieve user profile (without password hash)
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT user_id, email, username, created_at 
      FROM Users 
      WHERE user_id = ?
    `;
    const [users] = await pool.query(query, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/auth/login
 * Description: User login (simplified for demo)
 * Body: { email, password }
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const query = 'SELECT user_id, email, username FROM Users WHERE email = ?';
    const [users] = await pool.query(query, [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Note: In production, verify password hash with bcrypt
    res.json({
      success: true,
      user: users[0],
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/signup
 * Description: Create new user account
 * Body: { email, password, username }
 */
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if email already exists
    const checkQuery = 'SELECT user_id FROM Users WHERE email = ?';
    const [existing] = await pool.query(checkQuery, [email]);
    
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Create username from email if not provided
    const finalUsername = username || email.split('@')[0];
    
    // Insert new user (Note: In production, hash password with bcrypt)
    const insertQuery = 'INSERT INTO Users (email, username, password_hash) VALUES (?, ?, ?)';
    const [result] = await pool.query(insertQuery, [email, finalUsername, password]);
    
    const newUserId = result.insertId;
    console.log('Backend: New user created with ID:', newUserId);
    
    // Create default playlists for new user
    const defaultPlaylists = [
      { name: 'Daily Mix', description: 'My favorite tracks for daily listening', color: '#a855f7', songs: [1, 3, 6, 7, 12] },
      { name: 'Focus Flow', description: 'Ambient music for concentration and work', color: '#10b981', songs: [3, 8, 11, 13, 5] },
      { name: 'Roadtrip 25', description: 'High-energy tracks for road trips', color: '#f59e0b', songs: [2, 10, 4, 6, 12, 9] }
    ];
    
    for (const playlist of defaultPlaylists) {
      // Check if playlist_id = 1 is available
      const checkOneQuery = 'SELECT playlist_id FROM Playlists WHERE playlist_id = 1';
      const [checkOne] = await pool.query(checkOneQuery);
      
      let playlistId;
      
      if (checkOne.length === 0) {
        playlistId = 1;
      } else {
        const findGapQuery = `
          SELECT t1.playlist_id + 1 AS next_id
          FROM Playlists t1
          WHERE NOT EXISTS (
            SELECT 1 FROM Playlists t2 
            WHERE t2.playlist_id = t1.playlist_id + 1
          )
          ORDER BY t1.playlist_id
          LIMIT 1
        `;
        
        const [gapResult] = await pool.query(findGapQuery);
        
        if (gapResult.length > 0) {
          playlistId = gapResult[0].next_id;
        } else {
          const maxIdQuery = 'SELECT MAX(playlist_id) + 1 AS next_id FROM Playlists';
          const [maxResult] = await pool.query(maxIdQuery);
          playlistId = maxResult[0].next_id || 1;
        }
      }
      
      // Create playlist
      const createPlaylistQuery = `
        INSERT INTO Playlists (playlist_id, user_id, name, description, color_hex)
        VALUES (?, ?, ?, ?, ?)
      `;
      await pool.query(createPlaylistQuery, [playlistId, newUserId, playlist.name, playlist.description, playlist.color]);
      
      // Add songs to playlist
      for (let i = 0; i < playlist.songs.length; i++) {
        const addSongQuery = `
          INSERT INTO Playlist_Songs (playlist_id, song_id, track_order)
          VALUES (?, ?, ?)
        `;
        await pool.query(addSongQuery, [playlistId, playlist.songs[i], i + 1]);
      }
      
      console.log(`Backend: Created default playlist "${playlist.name}" (ID: ${playlistId}) for user ${newUserId}`);
    }
    
    res.status(201).json({
      success: true,
      user: {
        user_id: newUserId,
        email: email,
        username: finalUsername
      },
      message: 'Account created successfully with default playlists'
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ============================================================================
// PLAYLISTS ENDPOINTS
// ============================================================================

/**
 * GET /api/playlists/:userId
 * Description: Get all playlists for a user
 */
router.get('/playlists/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Backend: Fetching playlists for user', userId);
    
    const query = `
      SELECT 
        p.playlist_id,
        p.user_id,
        p.name,
        p.description,
        p.color_hex,
        COUNT(ps.song_id) AS song_count,
        p.created_at
      FROM Playlists p
      LEFT JOIN Playlist_Songs ps ON p.playlist_id = ps.playlist_id
      WHERE p.user_id = ?
      GROUP BY p.playlist_id, p.user_id, p.name, p.description, p.color_hex, p.created_at
      ORDER BY p.created_at DESC
    `;
    const [playlists] = await pool.query(query, [userId]);
    console.log('Backend: Found', playlists.length, 'playlists');
    console.log('Backend: Playlists:', playlists);
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

/**
 * GET /api/playlists/:playlistId/songs
 * Description: Get all songs in a specific playlist
 */
router.get('/playlists/:playlistId/songs', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const query = `
      SELECT 
        ps.playlist_song_id,
        s.song_id,
        s.title,
        a.artist_id,
        a.name AS artist,
        CONCAT(FLOOR(s.duration / 60), ':', LPAD(s.duration % 60, 2, '0')) AS duration,
        s.genre,
        ps.track_order,
        ps.added_at
      FROM Playlist_Songs ps
      JOIN Songs s ON ps.song_id = s.song_id
      JOIN Artists a ON s.artist_id = a.artist_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.track_order ASC
    `;
    const [songs] = await pool.query(query, [playlistId]);
    res.json(songs);
  } catch (error) {
    console.error('Error fetching playlist songs:', error);
    res.status(500).json({ error: 'Failed to fetch playlist songs' });
  }
});

/**
 * POST /api/playlists
 * Description: Create new playlist (reuses deleted IDs per user)
 * Body: { user_id, name, description, color_hex }
 */
router.post('/playlists', async (req, res) => {
  try {
    const { user_id, name, description, color_hex } = req.body;
    
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id and name required' });
    }
    
    // Check if playlist_id = 1 is available
    const checkOneQuery = 'SELECT playlist_id FROM Playlists WHERE playlist_id = 1';
    const [checkOne] = await pool.query(checkOneQuery);
    
    let nextId;
    
    if (checkOne.length === 0) {
      // ID 1 is available, use it
      nextId = 1;
    } else {
      // Find the first gap in the sequence
      const findGapQuery = `
        SELECT t1.playlist_id + 1 AS next_id
        FROM Playlists t1
        WHERE NOT EXISTS (
          SELECT 1 FROM Playlists t2 
          WHERE t2.playlist_id = t1.playlist_id + 1
        )
        ORDER BY t1.playlist_id
        LIMIT 1
      `;
      
      const [gapResult] = await pool.query(findGapQuery);
      
      if (gapResult.length > 0) {
        nextId = gapResult[0].next_id;
      } else {
        // No gaps, get max + 1
        const maxIdQuery = 'SELECT MAX(playlist_id) + 1 AS next_id FROM Playlists';
        const [maxResult] = await pool.query(maxIdQuery);
        nextId = maxResult[0].next_id || 1;
      }
    }
    
    console.log('Backend: Creating playlist with ID:', nextId, 'for user', user_id);
    
    // Insert playlist with specific ID
    const query = `
      INSERT INTO Playlists (playlist_id, user_id, name, description, color_hex)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(query, [nextId, user_id, name, description || '', color_hex || '#a855f7']);
    
    console.log('Backend: Playlist created successfully with ID:', nextId);
    
    res.status(201).json({
      success: true,
      playlist_id: nextId,
      message: 'Playlist created successfully'
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

/**
 * POST /api/playlists/:playlistId/songs
 * Description: Add song to playlist
 * Body: { song_id, track_order }
 */
router.post('/playlists/:playlistId/songs', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { song_id, track_order } = req.body;
    
    if (!song_id) {
      return res.status(400).json({ error: 'song_id required' });
    }
    
    const query = `
      INSERT INTO Playlist_Songs (playlist_id, song_id, track_order)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [playlistId, song_id, track_order || 999]);
    
    res.status(201).json({
      success: true,
      message: 'Song added to playlist'
    });
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ error: 'Failed to add song to playlist' });
  }
});

/**
 * DELETE /api/playlists/:playlistId
 * Description: Delete a playlist and all its associated songs
 */
router.delete('/playlists/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    console.log('Backend: Deleting playlist', playlistId);
    
    // First delete all songs from the playlist (due to foreign key constraint)
    const deleteSongsQuery = 'DELETE FROM Playlist_Songs WHERE playlist_id = ?';
    await pool.query(deleteSongsQuery, [playlistId]);
    
    // Then delete the playlist itself
    const deletePlaylistQuery = 'DELETE FROM Playlists WHERE playlist_id = ?';
    const [result] = await pool.query(deletePlaylistQuery, [playlistId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    console.log('Backend: Playlist deleted successfully');
    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// ============================================================================
// SEARCH ENDPOINT
// ============================================================================

/**
 * GET /api/search
 * Description: Search songs and artists by query string
 * Query params: q (search query)
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ songs: [], artists: [] });
    }
    
    const searchTerm = `%${q}%`;
    
    // Search songs
    const songQuery = `
      SELECT 
        s.song_id,
        s.title,
        a.artist_id,
        a.name AS artist,
        CONCAT(FLOOR(s.duration / 60), ':', LPAD(s.duration % 60, 2, '0')) AS duration,
        s.genre
      FROM Songs s
      JOIN Artists a ON s.artist_id = a.artist_id
      WHERE s.title LIKE ? OR a.name LIKE ?
      LIMIT 20
    `;
    
    // Search artists
    const artistQuery = `
      SELECT artist_id, name, bio
      FROM Artists
      WHERE name LIKE ?
      LIMIT 10
    `;
    
    const [songs] = await pool.query(songQuery, [searchTerm, searchTerm]);
    const [artists] = await pool.query(artistQuery, [searchTerm]);
    
    res.json({ songs, artists });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /api/health
 * Description: Check API health status
 */
router.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

export default router;
