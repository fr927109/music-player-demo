-- ============================================================================
-- MUSIC PLAYER DATABASE - SAMPLE DATA INSERTION SCRIPT
-- Database: music_player_db
-- Purpose: Populate tables with sample data for testing and demonstration
-- ============================================================================

USE music_player_db;

-- ============================================================================
-- INSERT SAMPLE ARTISTS (Functional Dependency: artist_id → name, bio)
-- ============================================================================
INSERT INTO Artists (name, bio) VALUES
('Ava Lumen', 'Ava Lumen is an electronic music producer known for creating atmospheric synth-pop tracks with ethereal vocals.'),
('Violet Drive', 'A rock/alternative band combining powerful guitar riffs with introspective lyrics about urban life.'),
('Kairo', 'Kairo is a minimalist electronic artist focusing on ambient and downtempo compositions for meditation and focus.'),
('Sky Lanterns', 'An indie folk band drawing inspiration from nature and storytelling traditions across diverse cultures.'),
('North & Pine', 'A lo-fi hip-hop collective creating sample-based beats for studying, relaxing, and creative work.'),
('Luna Waves', 'Luna Waves produces synth-wave and synthpop music with 80s and 90s influences.'),
('Echo Chamber', 'A post-rock experimental group exploring complex rhythms and layered instrumental arrangements.'),
('Neon Nights', 'A synthwave musician creating retro-futuristic electronic music with nostalgic 80s aesthetics.'),
('The Cosmic Few', 'An indie rock band blending space rock with psychedelic elements.'),
('Ember Falls', 'A folk-pop duo known for heartfelt acoustic melodies and harmonies.'),
('Digital Horizons', 'Electronic producer specializing in future bass and melodic dubstep.'),
('Velvet Storm', 'Alternative metal band with progressive and experimental influences.'),
('Mariah Carey', 'An American singer, songwriter, actress, and record producer, known for her five-octave vocal range and melismatic singing style.'),
('Wham!', 'A British pop duo formed in the early 1980s, known for their catchy tunes and energetic performances.'),
('Brenda Lee', 'An American singer known for her powerful voice and rockabilly hits.'),
('Bobby Helms', 'An American country music singer best known for his 1957 Christmas hit "Jingle Bell Rock".'),
('HUNTR/X: EJAE, Audrey Nuna & REI AMI', 'A collaborative project blending R&B, pop, and electronic music styles.'),
('Taylor Swift', 'An American singer-songwriter known for narrative songs about her personal life, which have received widespread media coverage and critical praise.'),
('Alex Warren', 'An indie artist known for his introspective lyrics and melodic compositions.'),
('Ariana Grande', 'An American singer and actress known for her wide vocal range and pop hits.'),
('Nat King Cole', 'An American jazz pianist and vocalist, renowned for his smooth voice and timeless classics.'),
('Andy Williams', 'An American singer known for his easy listening and traditional pop music.'),
('Doja Cat', 'An American rapper, singer, and songwriter known for her eclectic style and viral hits.'),
('SZA', 'An American singer and songwriter known for her alternative R&B style and introspective lyrics.'),
('Zach Bryan', 'An American singer-songwriter known for his raw, heartfelt country and folk music.'),
('Gunna', 'An American rapper known for his melodic style and collaborations with top artists.'),
('Kenya Grace', 'An American singer-songwriter known for her pop and R&B influenced music.'),
('Olivia Rodrigo', 'An American singer-songwriter and actress known for her powerful vocals and emotional pop songs.'),
('Jack Harlow', 'An American rapper known for his smooth flow and charismatic personality.'),
('Tate McRae', 'A Canadian singer-songwriter and dancer known for her emotional pop ballads and catchy tunes.'),
('Morgan Wallen', 'An American country music singer known for his distinctive voice and chart-topping hits.');
-- ============================================================================
-- INSERT SAMPLE SONGS 
-- (Functional Dependency: song_id → title, duration, genre, release_year, artist_id)
-- Note: artist_id references Artists table to avoid data duplication (3NF compliance)
-- ============================================================================
INSERT INTO Songs (artist_id, title, duration, genre, release_year) VALUES
(1, 'Neon Nights', 201, 'Synth-pop', 2023),
(2, 'Midnight Engine', 248, 'Rock', 2022),
(3, 'Glass River', 179, 'Ambient', 2023),
(4, 'Orbiting', 222, 'Indie Folk', 2023),
(5, 'Paper Kites', 190, 'Lo-fi Hip-hop', 2021),
(1, 'Electric Dreams', 215, 'Synth-pop', 2023),
(6, 'Luminescence', 203, 'Synthwave', 2022),
(3, 'Whispered Echoes', 165, 'Ambient', 2023),
(7, 'Crystalline Structures', 267, 'Post-rock', 2022),
(2, 'Echoing Thunder', 256, 'Rock', 2023),
(5, 'Vinyl Memories', 185, 'Lo-fi Hip-hop', 2022),
(8, 'Synthwave Horizon', 210, 'Synthwave', 2023),
(4, 'Autumn Whispers', 198, 'Indie Folk', 2023),
(6, 'Retro Future', 225, 'Synthwave', 2022),
(1, 'Aurora', 192, 'Synth-pop', 2023),
(3, 'Zen Garden', 154, 'Ambient', 2023),
(5, 'Coffee Shop Blues', 172, 'Lo-fi Hip-hop', 2023),
(9, 'All I Want For Christmas Is You', 240, 'Pop', 1994),          -- Mariah Carey
(10, 'Last Christmas', 210, 'Pop', 1984),                          -- Wham!
(11, 'Rockin Around The Christmas Tree', 120, 'Rockabilly', 1958), -- Brenda Lee
(12, 'Jingle Bell Rock', 150, 'Rock and Roll', 1957),              -- Bobby Helms
(13, 'Golden', 200, 'Pop', 2020),                                  -- HUNTR/X
(14, 'Fate of Ophelia', 230, 'Folk', 2025),                        -- Taylor Swift
(15, 'Ordinary', 220, 'R&B', 2024),                                -- Alex Warren
(16, 'Santa Tell Me', 180, 'Pop', 2014),                           -- Ariana Grande
(17, 'The Christmas Song', 170, 'Jazz', 1946),                     -- Nat King Cole
(18, 'It''s the Most Wonderful Time of the Year', 160, 'Traditional Pop', 1963), -- Andy Williams
(14, 'Cruel Summer', 215, 'Pop', 2019),                            -- Taylor Swift
(23, 'Paint The Town Red', 205, 'Indie Rock', 2023),               -- Doja Cat
(33, 'Snooze', 195, 'Alternative R&B', 2023),                      -- SZA
(34, 'I Remember Everything', 250, 'Country', 2022),               -- Zach Bryan
(35, 'Fukumean', 230, 'Hip-hop', 2022),                            -- Gunna
(36, 'Strangers', 210, 'Pop', 2023),                               -- Kenya Grace
(37, 'Vampire', 180, 'Pop Rock', 2021),                            -- Olivia Rodrigo
(38, 'Lovin On Me', 200, 'Hip-hop', 2022),                         -- Jack Harlow
(39, 'Greedy', 190, 'Pop', 2020),                                  -- Tate McRae
(40, 'Last Night', 240, 'Country', 2021);                          -- Morgan Wallen
-- ============================================================================
-- INSERT SAMPLE PLAYLISTS
-- (Functional Dependency: playlist_id → name, description, color_hex, user_id)
-- Note: user_id references Users table; user data not duplicated here (3NF compliance)
-- ============================================================================
INSERT INTO Playlists (user_id, name, description, color_hex) VALUES
(1, 'Daily Mix', 'My favorite tracks for daily listening', '#a855f7'),
(1, 'Focus Flow', 'Ambient music for concentration and work', '#10b981'),
(1, 'Roadtrip 25', 'High-energy tracks for road trips', '#f59e0b'),
(1, 'Workout Energy', 'High-tempo tracks for exercise', '#ef4444'),
(1, 'Chill Vibes', 'Relaxing music for unwinding', '#3b82f6');

-- ============================================================================
-- INSERT SAMPLE PLAYLIST_SONGS (Junction Table)
-- (Functional Dependency: (playlist_id, song_id) → track_order, added_at)
-- Purpose: Implements many-to-many relationship between Playlists and Songs
-- Note: Unique constraint on (playlist_id, song_id) prevents duplicate entries
-- ============================================================================

-- Playlist 1: Daily Mix (user_id=1)
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order) VALUES
(1, 1, 1),  -- Neon Nights
(1, 3, 2),  -- Glass River
(1, 6, 3),  -- Electric Dreams
(1, 7, 4),  -- Luminescence
(1, 12, 5); -- Synthwave Horizon

-- Playlist 2: Focus Flow (user_id=1)
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order) VALUES
(2, 3, 1),  -- Glass River
(2, 8, 2),  -- Whispered Echoes
(2, 11, 3), -- Vinyl Memories
(2, 13, 4), -- Autumn Whispers
(2, 5, 5),  -- Paper Kites
(2, 24, 6); -- Zen Garden

-- Playlist 3: Roadtrip 25 (user_id=1)
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order) VALUES
(3, 2, 1),  -- Midnight Engine
(3, 10, 2), -- Echoing Thunder
(3, 4, 3),  -- Orbiting
(3, 6, 4),  -- Electric Dreams
(3, 12, 5), -- Synthwave Horizon
(3, 9, 6),  -- Crystalline Structures
(3, 16, 7); -- Starlight Odyssey

-- Playlist 4: Workout Energy (user_id=1)
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order) VALUES
(4, 2, 1),   -- Midnight Engine
(4, 10, 2),  -- Echoing Thunder
(4, 19, 3),  -- Iron Sky
(4, 18, 4),  -- Neon Paradise
(4, 22, 5);  -- Digital Rain

-- Playlist 5: Chill Vibes (user_id=1)
INSERT INTO Playlist_Songs (playlist_id, song_id, track_order) VALUES
(5, 3, 1),   -- Glass River
(5, 5, 2),   -- Paper Kites
(5, 11, 3),  -- Vinyl Memories
(5, 17, 4),  -- Mountain Echo
(5, 21, 5),  -- Golden Hour
(5, 25, 6);  -- Coffee Shop Blues

-- ============================================================================
-- INSERT BILLBOARD TOP 10 CHART DATA
-- (Functional Dependency: chart_entry_id → song_id, rank, last_week, weeks_on_chart, chart_date)
-- Purpose: Stores current Billboard Hot 100 Top 10 chart positions
-- Note: Unique constraint on (song_id, chart_date) prevents duplicate entries
-- ============================================================================
INSERT INTO Billboard_Top_Songs (song_id, `rank`, last_week, weeks_on_chart, chart_date) VALUES
(27, 1, 2, 24, CURDATE()),      -- Cruel Summer (Taylor Swift)
(28, 2, 1, 16, CURDATE()),      -- Paint The Town Red (Doja Cat)
(29, 3, 3, 28, CURDATE()),      -- Snooze (SZA)
(30, 4, 5, 8, CURDATE()),       -- I Remember Everything (Zach Bryan)
(31, 5, 4, 12, CURDATE()),      -- Fukumean (Gunna)
(32, 6, 7, 19, CURDATE()),      -- Strangers (Kenya Grace)
(33, 7, 6, 15, CURDATE()),      -- Vampire (Olivia Rodrigo)
(34, 8, NULL, 1, CURDATE()),    -- Lovin On Me (Jack Harlow) - New entry!
(35, 9, 10, 9, CURDATE()),      -- Greedy (Tate McRae)
(36, 10, 8, 22, CURDATE());     -- Last Night (Morgan Wallen)


