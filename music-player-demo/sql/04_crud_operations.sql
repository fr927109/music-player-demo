-- ============================================================================
-- MUSIC PLAYER APPLICATION - CRUD OPERATIONS
-- Database: music_player_db
-- Purpose: Create, Read, Update, Delete operations for playlists and songs
-- ============================================================================

USE music_player_db;

-- ============================================================================
-- PLAYLIST CRUD OPERATIONS
-- ============================================================================

-- CREATE: Add a new playlist
-- UI Feature: "Create Playlist" button/form
-- Parameters: user_id, name, description, color_hex
-- ============================================================================
INSERT INTO Playlists (user_id, name, description, color_hex)
VALUES (1, 'My New Playlist', 'Description here', '#a855f7');

-- Get the newly created playlist_id
SELECT LAST_INSERT_ID() AS new_playlist_id;


-- READ: Get all playlists for a user (covered in Query 2 of 03_application_queries.sql)


-- UPDATE: Edit playlist details
-- UI Feature: "Edit Playlist" button with form
-- Parameters: playlist_id, name, description, color_hex
-- ============================================================================
UPDATE Playlists
SET name = 'Updated Playlist Name',
    description = 'Updated description',
    color_hex = '#10b981'
WHERE playlist_id = 1 AND user_id = 1;  -- Parameters: playlist_id, user_id (security)


-- DELETE: Remove a playlist
-- UI Feature: "Delete Playlist" button with confirmation
-- Parameters: playlist_id, user_id
-- Note: CASCADE delete will automatically remove all songs from Playlist_Songs
-- ============================================================================
DELETE FROM Playlists
WHERE playlist_id = 1 AND user_id = 1;  -- Parameters: playlist_id, user_id (security)


-- ============================================================================
-- PLAYLIST SONGS CRUD OPERATIONS
-- ============================================================================

-- CREATE: Add a song to a playlist
-- UI Feature: "Add to Playlist" button on song items
-- Parameters: playlist_id, song_id
-- Note: track_order is automatically set to max + 1
-- ============================================================================
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order)
SELECT 
    1 AS playlist_id,                    -- Parameter: selected playlist_id
    6 AS song_id,                        -- Parameter: selected song_id
    COALESCE(MAX(track_order), 0) + 1    -- Auto-increment track_order
FROM Playlist_Songs
WHERE playlist_id = 1;                   -- Parameter: selected playlist_id


-- Alternative: Add song with explicit track_order
-- UI Feature: Insert song at specific position
-- ============================================================================
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order)
VALUES (1, 6, 3);  -- Parameters: playlist_id, song_id, track_order


-- READ: Get all songs in a playlist (covered in Query 3 of 03_application_queries.sql)


-- READ: Check if a song is already in a playlist
-- UI Feature: Show "Added" checkmark or disable "Add" button
-- Parameters: playlist_id, song_id
-- ============================================================================
SELECT EXISTS(
    SELECT 1 
    FROM Playlist_Songs 
    WHERE playlist_id = 1 AND song_id = 6
) AS is_in_playlist;


-- READ: Get all available songs NOT in a specific playlist
-- UI Feature: "Add Songs" modal showing songs that can be added
-- Parameters: playlist_id
-- ============================================================================
SELECT 
    S.song_id,
    S.title AS song_title,
    A.name AS artist_name,
    S.genre,
    S.duration
FROM Songs S
INNER JOIN Artists A ON S.artist_id = A.artist_id
WHERE S.song_id NOT IN (
    SELECT song_id 
    FROM Playlist_Songs 
    WHERE playlist_id = 1  -- Parameter: selected playlist_id
)
ORDER BY S.title ASC;


-- UPDATE: Reorder songs in a playlist
-- UI Feature: Drag-and-drop to reorder songs
-- Parameters: playlist_id, song_id, new_track_order
-- ============================================================================
UPDATE Playlist_Songs
SET track_order = 2  -- Parameter: new_track_order
WHERE playlist_id = 1  -- Parameter: playlist_id
  AND song_id = 6;     -- Parameter: song_id


-- UPDATE: Reorder all songs when one is moved
-- UI Feature: Drag-and-drop reordering (shift other songs)
-- This is a more complex operation that might require application logic
-- Example: Move song from position 5 to position 2
-- ============================================================================
-- Step 1: Shift songs down (increment track_order for positions 2-4)
UPDATE Playlist_Songs
SET track_order = track_order + 1
WHERE playlist_id = 1
  AND track_order >= 2  -- Parameter: new_position
  AND track_order < 5   -- Parameter: old_position
  AND song_id != 6;     -- Parameter: song_id being moved

-- Step 2: Update the moved song to new position
UPDATE Playlist_Songs
SET track_order = 2  -- Parameter: new_position
WHERE playlist_id = 1
  AND song_id = 6;   -- Parameter: song_id being moved


-- DELETE: Remove a song from a playlist
-- UI Feature: "Remove from Playlist" button or swipe action
-- Parameters: playlist_id, song_id
-- ============================================================================
DELETE FROM Playlist_Songs
WHERE playlist_id = 1   -- Parameter: playlist_id
  AND song_id = 6;      -- Parameter: song_id


-- DELETE: Remove a song and reorder remaining songs
-- UI Feature: Remove song and close gaps in track_order
-- ============================================================================
-- Step 1: Get the track_order of the song being deleted
SET @deleted_track_order = (
    SELECT track_order 
    FROM Playlist_Songs 
    WHERE playlist_id = 1 AND song_id = 6
);

-- Step 2: Delete the song
DELETE FROM Playlist_Songs
WHERE playlist_id = 1 AND song_id = 6;

-- Step 3: Shift remaining songs up (decrement track_order)
UPDATE Playlist_Songs
SET track_order = track_order - 1
WHERE playlist_id = 1
  AND track_order > @deleted_track_order;


-- ============================================================================
-- BATCH OPERATIONS
-- ============================================================================

-- Add multiple songs to a playlist at once
-- UI Feature: "Add all" or "Select multiple songs"
-- Parameters: playlist_id, array of song_ids
-- ============================================================================
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order)
SELECT 
    1 AS playlist_id,
    song_id,
    (SELECT COALESCE(MAX(track_order), 0) FROM Playlist_Songs WHERE playlist_id = 1) + ROW_NUMBER() OVER (ORDER BY song_id)
FROM Songs
WHERE song_id IN (7, 8, 9, 10);  -- Parameters: array of song_ids


-- Remove all songs from a playlist (clear playlist)
-- UI Feature: "Clear all songs" button
-- Parameters: playlist_id
-- ============================================================================
DELETE FROM Playlist_Songs
WHERE playlist_id = 1;  -- Parameter: playlist_id


-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify playlist ownership before operations
-- UI Feature: Security check before any playlist modification
-- Parameters: playlist_id, user_id
-- Returns: 1 if user owns playlist, 0 otherwise
-- ============================================================================
SELECT EXISTS(
    SELECT 1 
    FROM Playlists 
    WHERE playlist_id = 1 AND user_id = 1
) AS is_owner;


-- Get current song count and total duration after adding/removing
-- UI Feature: Update playlist statistics in real-time
-- Parameters: playlist_id
-- ============================================================================
SELECT 
    COUNT(PS.song_id) AS total_songs,
    ROUND(SUM(S.duration) / 60.0, 2) AS total_duration_minutes
FROM Playlist_Songs PS
INNER JOIN Songs S ON PS.song_id = S.song_id
WHERE PS.playlist_id = 1;  -- Parameter: playlist_id
