import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=[
    "https://music-player-demo.onrender.com",
    "http://localhost:5173"
])
# MySQL connection
db = mysql.connector.connect(
    host=os.getenv('MYSQLHOST', 'localhost'),
    port=int(os.getenv('MYSQLPORT', 3306)),
    user=os.getenv('MYSQLUSER', 'root'),
    password=os.getenv('MYSQLPASSWORD', 'MySecret123'),
    database=os.getenv('MYSQLDATABASE', 'music_player_db')
)

# ============================================================================
# MUSIC PLAYER APPLICATION - BACKEND ROUTES
# ============================================================================

# ============================================================================
# FAVORITES ROUTES
# ============================================================================

# Toggle favorite song
@app.route('/api/favorites/song/toggle', methods=['POST'])
def toggle_favorite_song():
    try:
        data = request.json
        user_id = data.get('user_id')
        song_id = data.get('song_id')
        
        print(f"🌟 Toggle favorite - User: {user_id}, Song: {song_id}")
        
        cursor = db.cursor(dictionary=True)
        
        # Check if already favorited
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM Favorite_Songs
            WHERE user_id = %s AND song_id = %s
        """, (user_id, song_id))
        
        result = cursor.fetchone()
        is_favorited = result['count'] > 0
        
        if is_favorited:
            # Remove from favorites
            cursor.execute("""
                DELETE FROM Favorite_Songs
                WHERE user_id = %s AND song_id = %s
            """, (user_id, song_id))
            action = 'removed'
            print(f"❌ Removed song {song_id} from favorites")
        else:
            # Add to favorites
            cursor.execute("""
                INSERT INTO Favorite_Songs (user_id, song_id, favorited_at)
                VALUES (%s, %s, NOW())
            """, (user_id, song_id))
            action = 'added'
            print(f"✅ Added song {song_id} to favorites")
        
        db.commit()
        cursor.close()
        
        return jsonify({
            'success': True,
            'action': action,
            'is_favorited': not is_favorited
        })
        
    except Exception as e:
        print(f"❌ Error toggling favorite: {e}")
        return jsonify({'error': str(e)}), 500

# Get favorite songs for user
@app.route('/api/favorites/songs/<int:user_id>', methods=['GET'])
def get_favorite_songs(user_id):
    try:
        print(f"📋 Fetching favorite songs for user {user_id}")
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                S.song_id,
                S.title,
                A.name as artist,
                S.genre,
                CONCAT(FLOOR(S.duration / 60), ':', LPAD(S.duration % 60, 2, '0')) as duration,
                S.release_year,
                FS.favorited_at
            FROM Favorite_Songs FS
            INNER JOIN Songs S ON FS.song_id = S.song_id
            INNER JOIN Artists A ON S.artist_id = A.artist_id
            WHERE FS.user_id = %s
            ORDER BY FS.favorited_at DESC
        """, (user_id,))
        
        favorites = cursor.fetchall()
        cursor.close()
        
        print(f"✅ Found {len(favorites)} favorite songs")
        
        return jsonify({'favorites': favorites})
        
    except Exception as e:
        print(f"❌ Error fetching favorites: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ARTISTS ROUTES
# ============================================================================

# Get all artists
@app.route('/api/artists', methods=['GET'])
def get_artists():
    try:
        print("📋 Fetching all artists")
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM Artists
            ORDER BY name ASC
        """)
        
        artists = cursor.fetchall()
        cursor.close()
        
        print(f"✅ Found {len(artists)} artists")
        
        return jsonify({'artists': artists})
        
    except Exception as e:
        print(f"❌ Error fetching artists: {e}")
        return jsonify({'error': str(e)}), 500

# Get artist details and their songs
@app.route('/api/artist/<int:artist_id>', methods=['GET'])
def get_artist_details(artist_id):
    try:
        print(f"📋 Fetching details for artist {artist_id}")
        cursor = db.cursor(dictionary=True)
        
        # Get artist info
        cursor.execute("""
            SELECT * FROM Artists
            WHERE artist_id = %s
        """, (artist_id,))
        
        artist = cursor.fetchone()
        
        # Get artist's songs
        cursor.execute("""
            SELECT 
                S.song_id,
                S.title,
                S.genre,
                CONCAT(FLOOR(S.duration / 60), ':', LPAD(S.duration % 60, 2, '0')) as duration,
                S.release_year
            FROM Songs S
            WHERE S.artist_id = %s
            ORDER BY S.title ASC
        """, (artist_id,))
        
        songs = cursor.fetchall()
        cursor.close()
        
        if artist:
            artist['songs'] = songs
            print(f"✅ Found artist: {artist['name']} with {len(songs)} songs")
            return jsonify({'artist': artist})
        else:
            print("❌ Artist not found")
            return jsonify({'error': 'Artist not found'}), 404
        
    except Exception as e:
        print(f"❌ Error fetching artist details: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# SONGS ROUTES
# ============================================================================

# Get all songs
@app.route('/api/songs', methods=['GET'])
def get_songs():
    try:
        print("📋 Fetching all songs")
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
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
        """)
        
        songs = cursor.fetchall()
        cursor.close()
        
        print(f"✅ Found {len(songs)} songs")
        
        return jsonify({'songs': songs})
        
    except Exception as e:
        print(f"❌ Error fetching songs: {e}")
        return jsonify({'error': str(e)}), 500

# Get song details
@app.route('/api/song/<int:song_id>', methods=['GET'])
def get_song_details(song_id):
    try:
        print(f"📋 Fetching details for song {song_id}")
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                S.song_id,
                S.title,
                A.name as artist,
                S.genre,
                S.lyrics,
                S.duration,
                S.release_year
            FROM Songs S
            INNER JOIN Artists A ON S.artist_id = A.artist_id
            WHERE S.song_id = %s
        """, (song_id,))
        
        song = cursor.fetchone()
        cursor.close()
        
        if song:
            print(f"✅ Found song: {song['title']}")
            return jsonify({'song': song})
        else:
            print("❌ Song not found")
            return jsonify({'error': 'Song not found'}), 404
        
    except Exception as e:
        print(f"❌ Error fetching song details: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# PLAYLISTS ROUTES
# ============================================================================

# Get user's playlists
@app.route('/api/playlists/<int:user_id>', methods=['GET'])
def get_playlists(user_id):
    try:
        print(f"📋 Fetching playlists for user {user_id}")
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM Playlists
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        
        playlists = cursor.fetchall()
        cursor.close()
        
        print(f"✅ Found {len(playlists)} playlists")
        
        return jsonify({'playlists': playlists})
        
    except Exception as e:
        print(f"❌ Error fetching playlists: {e}")
        return jsonify({'error': str(e)}), 500

# Get playlist details
@app.route('/api/playlist/<int:playlist_id>', methods=['GET'])
def get_playlist_details(playlist_id):
    try:
        print(f"📋 Fetching details for playlist {playlist_id}")
        cursor = db.cursor(dictionary=True)
        
        # Get playlist info
        cursor.execute("""
            SELECT * FROM Playlists
            WHERE playlist_id = %s
        """, (playlist_id,))
        
        playlist = cursor.fetchone()
        
        # Get playlist's songs
        cursor.execute("""
            SELECT 
                S.song_id,
                S.title,
                A.name as artist,
                S.genre,
                CONCAT(FLOOR(S.duration / 60), ':', LPAD(S.duration % 60, 2, '0')) as duration,
                S.release_year
            FROM Playlist_Songs PS
            INNER JOIN Songs S ON PS.song_id = S.song_id
            INNER JOIN Artists A ON S.artist_id = A.artist_id
            WHERE PS.playlist_id = %s
            ORDER BY S.title ASC
        """, (playlist_id,))
        
        songs = cursor.fetchall()
        cursor.close()
        
        if playlist:
            playlist['songs'] = songs
            print(f"✅ Found playlist: {playlist['name']} with {len(songs)} songs")
            return jsonify({'playlist': playlist})
        else:
            print("❌ Playlist not found")
            return jsonify({'error': 'Playlist not found'}), 404
        
    except Exception as e:
        print(f"❌ Error fetching playlist details: {e}")
        return jsonify({'error': str(e)}), 500

# Create new playlist
@app.route('/api/playlist', methods=['POST'])
def create_playlist():
    try:
        data = request.json
        user_id = data.get('user_id')
        name = data.get('name')
        
        print(f"🎵 Creating playlist - User: {user_id}, Name: {name}")
        
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            INSERT INTO Playlists (user_id, name, created_at)
            VALUES (%s, %s, NOW())
        """, (user_id, name))
        
        db.commit()
        cursor.close()
        
        print("✅ Playlist created successfully")
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"❌ Error creating playlist: {e}")
        return jsonify({'error': str(e)}), 500

# Add song to playlist
@app.route('/api/playlist/song/add', methods=['POST'])
def add_song_to_playlist():
    try:
        data = request.json
        playlist_id = data.get('playlist_id')
        song_id = data.get('song_id')
        
        print(f"🎶 Adding song to playlist - Playlist: {playlist_id}, Song: {song_id}")
        
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            INSERT INTO Playlist_Songs (playlist_id, song_id)
            VALUES (%s, %s)
        """, (playlist_id, song_id))
        
        db.commit()
        cursor.close()
        
        print("✅ Song added to playlist successfully")
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"❌ Error adding song to playlist: {e}")
        return jsonify({'error': str(e)}), 500

# Remove song from playlist
@app.route('/api/playlist/song/remove', methods=['POST'])
def remove_song_from_playlist():
    try:
        data = request.json
        playlist_id = data.get('playlist_id')
        song_id = data.get('song_id')
        
        print(f"🗑️ Removing song from playlist - Playlist: {playlist_id}, Song: {song_id}")
        
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            DELETE FROM Playlist_Songs
            WHERE playlist_id = %s AND song_id = %s
        """, (playlist_id, song_id))
        
        db.commit()
        cursor.close()
        
        print("✅ Song removed from playlist successfully")
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"❌ Error removing song from playlist: {e}")
        return jsonify({'error': str(e)}), 500

# Delete playlist
@app.route('/api/playlist/delete', methods=['POST'])
def delete_playlist():
    try:
        data = request.json
        playlist_id = data.get('playlist_id')
        
        print(f"🗑️ Deleting playlist - Playlist: {playlist_id}")
        
        cursor = db.cursor(dictionary=True)
        
        # Remove all songs from the playlist
        cursor.execute("""
            DELETE FROM Playlist_Songs
            WHERE playlist_id = %s
        """, (playlist_id,))
        
        # Delete the playlist
        cursor.execute("""
            DELETE FROM Playlists
            WHERE playlist_id = %s
        """, (playlist_id,))
        
        db.commit()
        cursor.close()
        
        print("✅ Playlist deleted successfully")
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"❌ Error deleting playlist: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# USER SEARCH AND PROFILE ROUTES
# ============================================================================

# Search users by username or email
@app.route('/api/users/search', methods=['GET'])
def search_users():
    try:
        query = request.args.get('q', '').strip()
        
        if not query or len(query) < 2:
            return jsonify({'users': []})
        
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                user_id,
                username,
                email,
                created_at
            FROM Users
            WHERE username LIKE %s OR email LIKE %s
            LIMIT 10
        """, (f'%{query}%', f'%{query}%'))
        
        users = cursor.fetchall()
        cursor.close()
        
        return jsonify({'users': users})
        
    except Exception as e:
        print(f"Error searching users: {e}")
        return jsonify({'error': str(e)}), 500

# Get public profile of any user
@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    try:
        cursor = db.cursor(dictionary=True)
        
        # Get user basic info
        cursor.execute("""
            SELECT 
                user_id,
                username,
                email,
                created_at
            FROM Users
            WHERE user_id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get playlist count
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM Playlists
            WHERE user_id = %s
        """, (user_id,))
        user['playlist_count'] = cursor.fetchone()['count']
        
        # Get total songs in playlists
        cursor.execute("""
            SELECT COUNT(DISTINCT PS.song_id) as count
            FROM Playlist_Songs PS
            INNER JOIN Playlists P ON PS.playlist_id = P.playlist_id
            WHERE P.user_id = %s
        """, (user_id,))
        user['total_songs'] = cursor.fetchone()['count']
        
        cursor.close()
        
        return jsonify({'user': user})
        
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        return jsonify({'error': str(e)}), 500

# Get public playlists of a user
@app.route('/api/users/<int:user_id>/playlists', methods=['GET'])
def get_user_playlists_public(user_id):
    try:
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                P.playlist_id as id,
                P.name,
                P.description,
                P.color_hex as color,
                P.created_at,
                COUNT(PS.song_id) as count
            FROM Playlists P
            LEFT JOIN Playlist_Songs PS ON P.playlist_id = PS.playlist_id
            WHERE P.user_id = %s
            GROUP BY P.playlist_id, P.name, P.description, P.color_hex, P.created_at
            ORDER BY P.created_at DESC
        """, (user_id,))
        
        playlists = cursor.fetchall()
        cursor.close()
        
        return jsonify({'playlists': playlists})
        
    except Exception as e:
        print(f"Error fetching user playlists: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# USER PROFILE UPDATE ROUTE
# ============================================================================

@app.route('/api/users/<int:user_id>/profile', methods=['PUT'])
def update_user_profile(user_id):
    """
    Updates user profile information (username, bio)
    Called when user clicks 'Save Changes' button on profile page
    """
    try:
        data = request.json
        username = data.get('username')
        bio = data.get('bio', '')
        
        print(f"📝 Updating profile for user {user_id}: username={username}")
        
        cursor = db.cursor(dictionary=True)
        
        # Check if username is already taken by another user
        cursor.execute("""
            SELECT user_id FROM Users 
            WHERE username = %s AND user_id != %s
        """, (username, user_id))
        
        if cursor.fetchone():
            cursor.close()
            return jsonify({'error': 'Username already taken'}), 400
        
        # Update user profile
        cursor.execute("""
            UPDATE Users 
            SET username = %s
            WHERE user_id = %s
        """, (username, user_id))
        
        db.commit()
        cursor.close()
        
        print(f"✅ Profile updated successfully for user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error updating profile: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# BILLBOARD ROUTES
# ============================================================================

@app.route('/api/billboard/top10', methods=['GET'])
def get_billboard_top10():
    """
    Fetch Billboard Hot 100 Top 10 songs
    """
    try:
        print("📊 Fetching Billboard Top 10...")
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                b.rank,
                b.last_week,
                b.weeks_on_chart,
                s.song_id,
                s.title,
                a.name as artist,
                s.genre,
                CONCAT(FLOOR(s.duration / 60), ':', LPAD(s.duration % 60, 2, '0')) as duration
            FROM Billboard_Top_Songs b
            INNER JOIN Songs s ON b.song_id = s.song_id
            INNER JOIN Artists a ON s.artist_id = a.artist_id
            ORDER BY b.rank ASC
            LIMIT 10
        """)

        songs = cursor.fetchall()
        cursor.close()

        print(f"✅ Billboard Top 10 loaded: {len(songs)} songs")

        return jsonify({'songs': songs})

    except Exception as e:
        print(f"❌ Error fetching Billboard Top 10: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

