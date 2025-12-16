const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'MySecrect123',  // Your MySQL password
  database: 'music_player_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

// ============================================================================
// AUTH ROUTES
// ============================================================================

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('📝 Registration attempt:', email);
    
    const [existing] = await pool.query(
      'SELECT user_id FROM Users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO Users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, password]
    );
    
    console.log('✅ User registered:', email);
    
    res.json({
      success: true,
      user_id: result.insertId,
      username,
      email
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', email);
    
    const [users] = await pool.query(
      'SELECT user_id, username, email FROM Users WHERE email = ? AND password_hash = ?',
      [email, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    console.log('✅ Login successful:', email);
    
    res.json({
      success: true,
      user_id: user.user_id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DATA LOADING ROUTES
// ============================================================================

// Load all app data (songs, artists, playlists)
app.get('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📦 Loading app data for user:', userId);
    
    // Get songs with artists
    const [songs] = await pool.query(`
      SELECT 
        S.song_id,
        S.title,
        A.name as artist,
        S.genre,
        CONCAT(FLOOR(S.duration / 60), ':', LPAD(S.duration % 60, 2, '0')) as duration,
        S.release_year
      FROM Songs S
      INNER JOIN Artists A ON S.artist_id = A.artist_id
      ORDER BY S.title ASC
    `);
    
    // Get artists
    const [artists] = await pool.query(`
      SELECT artist_id, name
      FROM Artists
      ORDER BY name ASC
    `);
    
    // Get user's playlists
    const [playlists] = await pool.query(`
      SELECT 
        P.playlist_id as id,
        P.name,
        P.description,
        P.color_hex as color,
        COUNT(PS.song_id) as count
      FROM Playlists P
      LEFT JOIN Playlist_Songs PS ON P.playlist_id = PS.playlist_id
      WHERE P.user_id = ?
      GROUP BY P.playlist_id, P.name, P.description, P.color_hex
      ORDER BY P.created_at DESC
    `, [userId]);
    
    console.log(`✅ Loaded ${songs.length} songs, ${artists.length} artists, ${playlists.length} playlists`);
    
    res.json({ songs, artists, playlists });
  } catch (error) {
    console.error('❌ Error loading data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PLAYLIST ROUTES
// ============================================================================

// Get songs in a playlist
app.get('/api/playlists/:playlistId/songs', async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    const [songs] = await pool.query(`
      SELECT 
        S.song_id,
        S.title,
        A.name as artist,
        S.genre,
        CONCAT(FLOOR(S.duration / 60), ':', LPAD(S.duration % 60, 2, '0')) as duration
      FROM Playlist_Songs PS
      INNER JOIN Songs S ON PS.song_id = S.song_id
      INNER JOIN Artists A ON S.artist_id = A.artist_id
      WHERE PS.playlist_id = ?
      ORDER BY PS.track_order ASC
    `, [playlistId]);
    
    res.json({ songs });
  } catch (error) {
    console.error('❌ Error fetching playlist songs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new playlist
app.post('/api/playlists', async (req, res) => {
  try {
    const { user_id, name, description, color_hex } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO Playlists (user_id, name, description, color_hex, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, name, description, color_hex]
    );
    
    console.log('✅ Playlist created:', name);
    
    res.json({
      success: true,
      playlist_id: result.insertId
    });
  } catch (error) {
    console.error('❌ Error creating playlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add song to playlist
app.post('/api/playlists/:playlistId/songs', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { song_id, track_order } = req.body;
    
    await pool.query(
      'INSERT INTO Playlist_Songs (playlist_id, song_id, track_order, added_at) VALUES (?, ?, ?, NOW())',
      [playlistId, song_id, track_order]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error adding song to playlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete playlist
app.delete('/api/playlists/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    // Delete playlist songs first
    await pool.query('DELETE FROM Playlist_Songs WHERE playlist_id = ?', [playlistId]);
    
    // Delete playlist
    await pool.query('DELETE FROM Playlists WHERE playlist_id = ?', [playlistId]);
    
    console.log('✅ Playlist deleted:', playlistId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting playlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user playlists
app.get('/api/users/:userId/playlists', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [playlists] = await pool.query(`
      SELECT 
        P.playlist_id as id,
        P.name,
        P.description,
        P.color_hex as color,
        COUNT(PS.song_id) as count
      FROM Playlists P
      LEFT JOIN Playlist_Songs PS ON P.playlist_id = PS.playlist_id
      WHERE P.user_id = ?
      GROUP BY P.playlist_id, P.name, P.description, P.color_hex
      ORDER BY P.created_at DESC
    `, [userId]);
    
    res.json({ playlists });
  } catch (error) {
    console.error('❌ Error fetching playlists:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USER PROFILE ROUTES
// ============================================================================

// Update user profile
app.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, bio } = req.body;
    
    console.log(`📝 Updating profile for user ${userId}: username=${username}`);
    
    // Check if username is taken by another user
    const [existing] = await pool.query(
      'SELECT user_id FROM Users WHERE username = ? AND user_id != ?',
      [username, userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Update user profile
    await pool.query(
      'UPDATE Users SET username = ? WHERE user_id = ?',
      [username, userId]
    );
    
    console.log(`✅ Profile updated successfully for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users
app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }
    
    const [users] = await pool.query(`
      SELECT 
        user_id,
        username,
        email,
        created_at
      FROM Users
      WHERE username LIKE ? OR email LIKE ?
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);
    
    res.json({ users });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get public user profile
app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [users] = await pool.query(`
      SELECT 
        user_id,
        username,
        email,
        created_at
      FROM Users
      WHERE user_id = ?
    `, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    // Get playlist count
    const [playlistCount] = await pool.query(
      'SELECT COUNT(*) as count FROM Playlists WHERE user_id = ?',
      [userId]
    );
    user.playlist_count = playlistCount[0].count;
    
    // Get total songs
    const [songCount] = await pool.query(`
      SELECT COUNT(DISTINCT PS.song_id) as count
      FROM Playlist_Songs PS
      INNER JOIN Playlists P ON PS.playlist_id = P.playlist_id
      WHERE P.user_id = ?
    `, [userId]);
    user.total_songs = songCount[0].count;
    
    res.json({ user });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's public playlists
app.get('/api/users/:userId/playlists-public', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [playlists] = await pool.query(`
      SELECT 
        P.playlist_id as id,
        P.name,
        P.description,
        P.color_hex as color,
        P.created_at,
        COUNT(PS.song_id) as count
      FROM Playlists P
      LEFT JOIN Playlist_Songs PS ON P.playlist_id = PS.playlist_id
      WHERE P.user_id = ?
      GROUP BY P.playlist_id, P.name, P.description, P.color_hex, P.created_at
      ORDER BY P.created_at DESC
    `, [userId]);
    
    res.json({ playlists });
  } catch (error) {
    console.error('❌ Error fetching user playlists:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BILLBOARD ROUTES
// ============================================================================

// Billboard Hot 100 Top 10
app.get('/api/billboard/top10', async (req, res) => {
  try {
    console.log('📊 Fetching Billboard Top 10...');
    
    const query = `
      SELECT 
        b.\`rank\`,
        s.song_id,
        s.title,
        a.name AS artist,
        CONCAT(FLOOR(s.duration / 60), ':', LPAD(s.duration % 60, 2, '0')) as duration,
        b.last_week,
        b.weeks_on_chart
      FROM Billboard_Top_Songs b
      JOIN Songs s ON b.song_id = s.song_id
      JOIN Artists a ON s.artist_id = a.artist_id
      WHERE b.chart_date = CURDATE()
      ORDER BY b.\`rank\`
    `;
    
    const [results] = await pool.query(query);
    
    console.log('✅ Billboard Top 10 loaded:', results.length, 'songs');
    
    res.json({
      success: true,
      songs: results
    });
  } catch (error) {
    console.error('❌ Error fetching Billboard Top 10:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Node.js backend server running on http://localhost:${PORT}`);
});
