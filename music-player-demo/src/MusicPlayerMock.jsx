import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { Plus, Search, Music, Play, Pause, SkipForward, SkipBack, ListPlus, Headphones, Shuffle, Repeat, Volume2, Users, Library, User, Lock, Link2, Trash2, SettingsIcon, Check } from "lucide-react";
import Cropper from "react-easy-crop";
import { loadAppData, deletePlaylist, fetchPlaylistSongs, createPlaylist, addSongToPlaylist, fetchUserPlaylists, searchUsers, fetchUserProfile, fetchUserPublicPlaylists, updateUserProfile, fetchBillboardTop10 } from "./services/api";

const DEMO_PLAYLISTS = [];

export default function MusicPlayerMock({ currentUserId, loginEmail, onLogout }) {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Remove auth state - now passed as props
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [playlists, setPlaylists] = useState(DEMO_PLAYLISTS);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [newPlaylistImage, setNewPlaylistImage] = useState(null);
  const [playlistImagePreview, setPlaylistImagePreview] = useState(null);
  const [selectedSongsForPlaylist, setSelectedSongsForPlaylist] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [profileTab, setProfileTab] = useState("profile");
  const [userName, setUserName] = useState("Demo User");
  const [username, setUsername] = useState("demouser");
  const [userBio, setUserBio] = useState("");
  const [theme, setTheme] = useState("System");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [viewingUserPlaylists, setViewingUserPlaylists] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState("");
  const [showAdModal, setShowAdModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendUserId, setFriendUserId] = useState("");
  const [friends, setFriends] = useState([]);
  const [billboardTop10, setBillboardTop10] = useState([]);
  const canvasRef = useRef(null);
  const userSearchRef = useRef(null);

  // Load data from backend on mount
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log('Calling loadAppData for user ID:', currentUserId);
    
    // TEMPORARILY SIMPLIFIED - just load main data
    loadAppData(currentUserId)
      .then((appData) => {
        console.log('Full API Response:', appData);
        const { songs, artists, playlists } = appData;
        
        setSongs(songs || []);
        setArtists(artists || []);
        setPlaylists(playlists || []);
        
        if (songs && songs.length > 0) {
          setCurrentTrack(songs[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load app data:', err);
        setLoading(false);
      });
    
    // Load Billboard Top 10
    fetchBillboardTop10()
      .then((data) => {
        console.log('Billboard Top 10:', data);
        setBillboardTop10(data.songs || []);
      })
      .catch(err => {
        console.error('Failed to load Billboard Top 10:', err);
      });
  }, [currentUserId]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (selectedPlaylist || showProfile || showCropModal || showCreatePlaylist || showAdModal || showFriendsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPlaylist, showProfile, showCropModal, showCreatePlaylist, showAdModal, showFriendsModal]);

  // Handle click outside user search
  useEffect(() => {
    function handleClickOutside(event) {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target)) {
        setShowUserSearch(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users as user types
  useEffect(() => {
    if (userSearchQuery.length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await searchUsers(userSearchQuery);
        setUserSearchResults(response.users || []);
        setShowUserSearch(true);
      } catch (error) {
        console.error('Failed to search users:', error);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Helper function to get avatar initials from email
  function getAvatarInitials(email) {
    if (!email) return "?";
    const username = email.split('@')[0]; // Get part before @
    const letters = username.replace(/[^a-zA-Z]/g, ''); // Remove non-letters
    if (letters.length === 0) return email.charAt(0).toUpperCase();
    if (letters.length === 1) return letters.charAt(0).toUpperCase();
    return letters.substring(0, 2).toUpperCase();
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropImage(event.target?.result);
        setShowCropModal(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImage = useCallback(async () => {
    if (!cropImage || !croppedAreaPixels || !canvasRef.current) return;

    const image = new Image();
    image.src = cropImage;

    image.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const croppedImage = canvas.toDataURL("image/jpeg", 0.9);
      setAvatarPreview(croppedImage);
      setShowCropModal(false);
      setCropImage(null);
    };
  }, [cropImage, croppedAreaPixels]);

  // UPDATED: Use songs and artists from state
  const filteredSongs = useMemo(
    () =>
      songs.filter(
        (s) => s.title.toLowerCase().includes(query.toLowerCase()) || s.artist.toLowerCase().includes(query.toLowerCase())
      ),
    [query, songs]
  );

  const filteredArtists = useMemo(
    () => artists.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())),
    [query, artists]
  );

  function handleCreatePlaylist() {
    setShowCreatePlaylist(true);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setSelectedSongsForPlaylist([]);
    setNewPlaylistImage(null);
    setPlaylistImagePreview(null);
  }

  async function handleConfirmCreatePlaylist(e) {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    try {
      const n = playlists.length + 1;
      const colors = ["#a855f7", "#10b981", "#f59e0b", "#3b82f6", "#f43f5e"];
      const colorHex = colors[n % colors.length];
      
      console.log('Creating playlist for user ID:', currentUserId);
      console.log('Playlist image data length:', newPlaylistImage?.length || 0);
      console.log('Image preview:', newPlaylistImage ? newPlaylistImage.substring(0, 50) + '...' : 'No image');
      
      // Create playlist in database with current user's ID and image
      const response = await createPlaylist(currentUserId, newPlaylistName, newPlaylistDesc, colorHex, newPlaylistImage);
      const playlistId = response.playlist_id;
      
      console.log('Playlist created with ID:', playlistId);
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      // Add songs to playlist in database
      if (selectedSongsForPlaylist.length > 0) {
        console.log('Adding', selectedSongsForPlaylist.length, 'songs to playlist');
        for (let i = 0; i < selectedSongsForPlaylist.length; i++) {
          await addSongToPlaylist(playlistId, selectedSongsForPlaylist[i], i + 1);
        }
        console.log('Songs added to playlist');
      }
      
      // Refresh playlists from database to get accurate data including the image
      const updatedPlaylists = await fetchUserPlaylists(currentUserId);
      console.log('Updated playlists:', updatedPlaylists);
      console.log('Looking for playlist with ID:', playlistId);
      const newPlaylist = updatedPlaylists.find(p => p.id === playlistId);
      console.log('New playlist data:', newPlaylist);
      console.log('New playlist image:', newPlaylist?.image ? newPlaylist.image.substring(0, 50) + '...' : 'No image in response');
      setPlaylists(updatedPlaylists);
      
      // If songs were added, store them in playlistSongs state
      if (selectedSongsForPlaylist.length > 0) {
        const songsInPlaylist = songs.filter((s) => selectedSongsForPlaylist.includes(s.song_id));
        setPlaylistSongs((prev) => ({ ...prev, [playlistId]: songsInPlaylist }));
      }
      
      console.log('Playlist created successfully!');
      
      // Close modal and reset form
      setShowCreatePlaylist(false);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      setSelectedSongsForPlaylist([]);
      setNewPlaylistImage(null);
      setPlaylistImagePreview(null);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('Failed to create playlist. Please try again.');
    }
  }

  function toggleSongForPlaylist(songId) {
    setSelectedSongsForPlaylist((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  }

  async function handleSelectPlaylist(playlist) {
    setSelectedPlaylist(playlist);
    
    // Fetch songs for this playlist from backend
    try {
      console.log('Fetching songs for playlist:', playlist.id);
      const songs = await fetchPlaylistSongs(playlist.id);
      console.log('Loaded', songs.length, 'songs for playlist');
      
      setPlaylistSongs((prev) => ({
        ...prev,
        [playlist.id]: songs
      }));
    } catch (error) {
      console.error('Failed to load playlist songs:', error);
    }
  }

  const handlePlaylistImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name, 'Size:', file.size, 'bytes');
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result;
        console.log('Base64 length:', base64?.length, 'Preview:', base64?.substring(0, 50));
        setPlaylistImagePreview(base64);
        setNewPlaylistImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleDeletePlaylist(playlistId) {
    if (!window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deletePlaylist(playlistId);
      // Remove playlist from state
      setPlaylists(playlists.filter(p => p.id !== playlistId));
      // Close the modal
      setSelectedPlaylist(null);
      console.log('Playlist deleted successfully');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Failed to delete playlist. Please try again.');
    }
  }

  // Show loading state only when authenticated and loading data
  if (loading) {
    return (
      <div style={{ background: "#F8F7F3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Headphones style={{ width: "48px", height: "48px", marginBottom: "16px", color: "#24354A" }} />
          <p style={{ color: "#24354A", fontSize: "18px", fontWeight: 600 }}>Loading McMusic Hub...</p>
        </div>
      </div>
    );
  }

  // Handle no current track
  if (!currentTrack && songs.length > 0) {
    setCurrentTrack(songs[0]);
  }

  async function handleViewUserProfile(userId) {
    try {
      const [profileData, playlistsData] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserPublicPlaylists(userId)
      ]);
      
      setViewingUser(profileData.user);
      setViewingUserPlaylists(playlistsData.playlists || []);
      setShowUserSearch(false);
      setUserSearchQuery("");
    } catch (error) {
      console.error('Failed to load user profile:', error);
      alert('Failed to load user profile. Please try again.');
    }
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    setProfileSaveMessage("");
    
    try {
      await updateUserProfile(currentUserId, {
        display_name: userName,
        username: username,
        bio: userBio
      });
      
      setProfileSaveMessage("Profile updated successfully!");
      setTimeout(() => setProfileSaveMessage(""), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setProfileSaveMessage(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAddFriend() {
    if (!friendUserId.trim()) {
      alert('Please enter a user ID');
      return;
    }
    
    const userId = parseInt(friendUserId.trim());
    if (isNaN(userId)) {
      alert('Please enter a valid numeric user ID');
      return;
    }
    
    try {
      console.log('Fetching user profile for ID:', userId);
      
      // Fetch user profile to verify user exists
      const response = await fetchUserProfile(userId);
      console.log('User profile response:', response);
      
      if (!response || !response.user) {
        alert('User not found. Please check the user ID and try again.');
        return;
      }
      
      const user = response.user;
      
      // Check if trying to add yourself
      if (user.user_id === currentUserId) {
        alert('You cannot add yourself as a friend!');
        return;
      }
      
      // Check if already friends
      if (friends.some(f => f.user_id === user.user_id)) {
        alert('This user is already in your friends list');
        return;
      }
      
      // Add to friends list
      setFriends([...friends, user]);
      setFriendUserId("");
      alert(`Successfully added ${user.username || user.email} to your friends list!`);
    } catch (error) {
      console.error('Failed to add friend:', error);
      
      // More specific error messages
      if (error.message && error.message.includes('404')) {
        alert('User not found. Please check the user ID and try again.');
      } else if (error.message && error.message.includes('Network')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert(`Failed to add friend: ${error.message || 'Unknown error occurred'}`);
      }
    }
  }

  function handleRemoveFriend(userId) {
    setFriends(friends.filter(f => f.user_id !== userId));
  }

  return (
    <div style={{ background: "#F8F7F3" }} className="min-h-screen w-full">
      {/* Header */}
      <header className="header sticky top-0 z-20">
        <div className="header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Headphones style={{ width: "24px", height: "24px" }} />
            <span style={{ fontWeight: 600, letterSpacing: "0.05em" }}>McMusic Hub</span>
          </div>

          <div className="header-right">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                className="btn btn-icon" 
                onClick={() => { setShowProfile(true); setProfileTab("profile"); }}
                style={{ padding: "0", background: "transparent", border: "none" }}
              >
                <div 
                  key={avatarPreview}
                  className="avatar avatar-sm" 
                  style={{ 
                    background: avatarPreview ? "white" : "white", 
                    border: "2px solid #10b981", 
                    color: "#24354A", 
                    cursor: "pointer",
                    backgroundImage: avatarPreview ? `url(${avatarPreview})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700
                  }}
                >
                  {!avatarPreview && getAvatarInitials(loginEmail)}
                </div>
              </button>
              <button className="btn btn-secondary" onClick={onLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="main-grid" style={{ paddingTop: "16px", paddingBottom: "120px" }}>
        {/* Sidebar: Playlists */}
        <aside>
          <div className="card" style={{ borderRadius: "16px" }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Library style={{ width: "20px", height: "20px" }} /> Your Playlists
              </h3>
            </div>
            <div className="card-content">
              <button className="btn btn-primary btn-full-width" onClick={handleCreatePlaylist} style={{ marginBottom: "12px" }}>
                <ListPlus style={{ width: "16px", height: "16px", marginRight: "8px" }}/>New playlist
              </button>
              <div className="scroll-area" style={{ maxHeight: "calc(100vh - 400px)", minHeight: "420px", overflowY: "auto" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {playlists.map((p) => (
                    <li key={p.id} className="list-item" style={{ cursor: "pointer" }} onClick={() => handleSelectPlaylist(p)}>
                      <div className="list-item-icon" style={{ background: p.color, overflow: "hidden" }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Music style={{ width: "16px", height: "16px", color: "white" }}/>
                        )}
                      </div>
                      <div className="list-item-content">
                        <div className="list-item-title">{p.name}</div>
                        <div className="list-item-subtitle">{p.count} songs</div>
                      </div>
                      {/* REMOVED: Star button for playlists */}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Friends List Card */}
          <div className="card" style={{ borderRadius: "16px", marginTop: "16px" }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users style={{ width: "20px", height: "20px" }} /> Your Friends
              </h3>
            </div>
            <div className="card-content">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <div key={friend.user_id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "8px", background: "#F8F7F3", cursor: "pointer", transition: "background 0.2s" }} onClick={() => handleViewUserProfile(friend.user_id)}>
                      <div className="avatar avatar-sm" style={{ background: "#10b981", color: "white", flexShrink: 0 }}>
                        {friend.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#24354A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{friend.username}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ID: {friend.user_id}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFriend(friend.user_id);
                        }}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px", borderRadius: "8px", background: "#F8F7F3", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
                    No friends added yet. Add friends by their user ID!
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search Card */}
          <div className="card" style={{ borderRadius: "16px" }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Search style={{ width: "20px", height: "20px" }} /> Browse & Search
              </h3>
            </div>
            <div className="card-content">
              <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "stretch", flexWrap: "wrap" }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <Search style={{ width: "16px", height: "16px" }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs, artists..." />
                </div>
                <div className="tabs-list">
                  {["search", "songs", "artists"].map((tab) => (
                    <button
                      key={tab}
                      className={`tab-trigger ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="separator" style={{ margin: "16px 0" }}></div>

              {/* Results */}
              <div>
                {activeTab === "search" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                    <div className="card" style={{ borderRadius: "16px" }}>
                      <div className="card-header"><h4 className="card-title">Top Songs - Billboard Hot 100</h4></div>
                      <div className="card-content">
                        <div style={{ border: "1px solid #E6E2D9", borderRadius: "12px", overflow: "hidden" }}>
                          <div className="scroll-area" style={{ maxHeight: "460px", overflowY: "auto" }}>
                            {billboardTop10.map((s, idx) => (
                              <div
                                key={s.song_id}
                                onClick={() => {setCurrentTrack(s); setIsPlaying(true);}}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "50px 1fr 80px 60px",
                                  alignItems: "center",
                                  padding: "12px 16px",
                                  borderBottom: idx === billboardTop10.length - 1 ? "none" : "1px solid #E6E2D9",
                                  cursor: "pointer",
                                  transition: "background 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#F8F7F3"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                              >
                                <div style={{ fontSize: "24px", fontWeight: 700, color: "#24354A" }}>{s.rank}</div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#24354A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.artist}</div>
                                </div>
                                <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                                  <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#9ca3af" }}>LW</div>
                                  <div style={{ fontWeight: 600 }}>{s.last_week || '-'}</div>
                                </div>
                                <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                                  <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#9ca3af" }}>WKS</div>
                                  <div style={{ fontWeight: 600 }}>{s.weeks_on_chart || '-'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ borderRadius: "16px" }}>
                      <div className="card-header"><h4 className="card-title">Top Artists</h4></div>
                      <div className="card-content">
                        <div className="scroll-area" style={{ maxHeight: "460px", overflowY: "auto" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                            {filteredArtists.map((a) => (
                              <div key={a.artist_id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", background: "#F8F7F3", minWidth: 0, height: "fit-content" }}>
                                <div className="avatar avatar-sm" style={{ background: "#24354A", color: "white", fontWeight: 600, flexShrink: 0 }}>
                                  {a.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                                  <div style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <Users style={{ width: "12px", height: "12px" }}/> Artist
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "songs" && (
                  <div style={{ border: "1px solid #E6E2D9", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", background: "#F1EEE6", padding: "8px 16px" }}>
                      <div>Title</div>
                      <div>Artist</div>
                      <div style={{ textAlign: "right" }}>Duration</div>
                    </div>
                    <div className="scroll-area" style={{ height: "360px" }}>
                      {filteredSongs.map((s, i) => (
                        <div key={s.song_id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #E6E2D9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button className="btn btn-icon" style={{ padding: "4px" }} onClick={() => {setCurrentTrack(s); setIsPlaying(true);}}>
                              <Play style={{ width: "16px", height: "16px" }}/>
                            </button>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i + 1}. {s.title}</span>
                          </div>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.artist}</div>
                          <div style={{ textAlign: "right" }}>{s.duration}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "artists" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                    {filteredArtists.map((a) => (
                      <div key={a.artist_id} className="card" style={{ borderRadius: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                        <div className="avatar avatar-lg" style={{ background: "#24354A", color: "white", fontWeight: 600 }}>
                          {a.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>Artist profile</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Friends Button - Bottom Left */}
      <button
        onClick={() => setShowFriendsModal(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          fontSize: "14px",
          fontWeight: 700,
          zIndex: 50,
          transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <Users style={{ width: "24px", height: "24px" }}/>
      </button>

      {/* Ad Button - Bottom Right */}
      <button
        onClick={() => setShowAdModal(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "#f59e0b",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          fontSize: "14px",
          fontWeight: 700,
          zIndex: 50,
          transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        AD
      </button>

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="dialog-overlay open" style={{ zIndex: 100 }} onClick={() => setShowFriendsModal(false)}>
          <div 
            className="dialog-content" 
            style={{ maxWidth: "500px", width: "90%", background: "#F8F7F3", color: "#24354A", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#24354A" }}>Friends</h2>
              <button 
                onClick={() => setShowFriendsModal(false)}
                style={{ background: "transparent", color: "#24354A", padding: "4px 8px", fontSize: "18px", cursor: "pointer", fontWeight: 600, border: "none" }}
              >
                ✕
              </button>
            </div>

            {/* Add Friend Section */}
            <div style={{ marginBottom: "24px", padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px 0", color: "#24354A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Add Friend</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={friendUserId}
                  onChange={(e) => setFriendUserId(e.target.value)}
                  placeholder="Enter user ID"
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid #E6E2D9", borderRadius: "6px", background: "#F8F7F3" }}
                />
                <button
                  onClick={handleAddFriend}
                  className="btn btn-primary"
                  style={{ padding: "8px 16px", whiteSpace: "nowrap" }}
                >
                  <Plus style={{ width: "16px", height: "16px", marginRight: "4px" }}/> Add
                </button>
              </div>
            </div>

            {/* Friends List */}
            <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px 0", color: "#24354A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Your Friends ({friends.length})
              </h3>
              {friends.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                  {friends.map((friend) => (
                    <div
                      key={friend.user_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "#F8F7F3",
                        cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F1EEE6"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#F8F7F3"}
                    >
                      <div 
                        className="avatar avatar-sm" 
                        style={{ background: "#10b981", color: "white", flexShrink: 0 }}
                        onClick={() => {
                          handleViewUserProfile(friend.user_id);
                          setShowFriendsModal(false);
                        }}
                      >
                        {friend.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div 
                        style={{ flex: 1, minWidth: 0 }}
                        onClick={() => {
                          handleViewUserProfile(friend.user_id);
                          setShowFriendsModal(false);
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#24354A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {friend.username}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          ID: {friend.user_id}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFriend(friend.user_id);
                        }}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "#6b7280", margin: "20px 0", fontSize: "14px" }}>
                  No friends added yet. Add friends by their user ID!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ad Modal */}
      {showAdModal && (
        <div className="dialog-overlay open" style={{ zIndex: 100 }} onClick={() => setShowAdModal(false)}>
          <div 
            className="dialog-content" 
            style={{ maxWidth: "800px", width: "90%", background: "#24354A", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "white" }}>Advertisement</h2>
              <button 
                onClick={() => setShowAdModal(false)}
                style={{ background: "transparent", color: "white", padding: "4px 8px", fontSize: "18px", cursor: "pointer", fontWeight: 600, border: "none" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px" }}>
              <iframe
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Special Offer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="dialog-overlay open">
          <div className="dialog-content" style={{ maxHeight: "90vh", overflowY: "auto", maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "white" }}>Create playlist</h2>
              <button type="button" className="btn" style={{ background: "transparent", color: "white", padding: "4px", textDecoration: "underline" }} onClick={() => setShowCreatePlaylist(false)}>Close</button>
            </div>

            <form onSubmit={handleConfirmCreatePlaylist} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="dialog-form-group">
                <label style={{ fontSize: "12px", color: "white", fontWeight: 600, textTransform: "uppercase" }}>NAME</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My playlist"
                  style={{ background: "white", border: "2px dashed #E6E2D9", color: "#24354A", padding: "10px 12px", borderRadius: "6px" }}
                />
              </div>

              <div className="dialog-form-group">
                <label style={{ fontSize: "12px", color: "white", fontWeight: 600, textTransform: "uppercase" }}>DESCRIPTION</label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Optional"
                  style={{ background: "white", border: "2px dashed #E6E2D9", color: "#24354A", padding: "10px 12px", borderRadius: "6px" }}
                />
              </div>

              <div className="dialog-form-group">
                <label style={{ fontSize: "12px", color: "white", fontWeight: 600, textTransform: "uppercase" }}>PLAYLIST PICTURE</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {playlistImagePreview && (
                    <div style={{ width: "100%", height: "150px", borderRadius: "8px", background: "white", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={playlistImagePreview} alt="Playlist preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePlaylistImageChange}
                    style={{ 
                      background: "white", 
                      border: "2px dashed #E6E2D9", 
                      color: "#24354A", 
                      padding: "10px 12px", 
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  />
                  {playlistImagePreview && (
                    <button
                      type="button"
                      onClick={() => { setPlaylistImagePreview(null); setNewPlaylistImage(null); }}
                      style={{ background: "#dc2626", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>

              <div className="dialog-form-group">
                <label style={{ fontSize: "12px", color: "white", fontWeight: 600, textTransform: "uppercase" }}>ADD SONGS</label>
                <input
                  type="text"
                  placeholder="Search songs or artists"
                  style={{ background: "white", border: "2px dashed #E6E2D9", color: "#24354A", padding: "10px 12px", borderRadius: "6px" }}
                />
              </div>

              {/* UPDATED: Use songs from state */}
              <div style={{ background: "white", border: "1px solid #E6E2D9", borderRadius: "6px", maxHeight: "300px", overflowY: "auto", padding: "0" }}>
                {songs.map((song) => (
                  <div
                    key={song.song_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderBottom: "1px solid #E6E2D9",
                      cursor: "pointer",
                      background: selectedSongsForPlaylist.includes(song.song_id) ? "#F0F0F0" : "transparent"
                    }}
                    onClick={() => toggleSongForPlaylist(song.song_id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSongsForPlaylist.includes(song.song_id)}
                      onChange={() => toggleSongForPlaylist(song.song_id)}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: "#24354A" }}>{song.title} — {song.artist}</div>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}>{song.duration}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "13px", color: "white", marginTop: "8px" }}>
                {selectedSongsForPlaylist.length === 0 ? "No songs selected yet." : `${selectedSongsForPlaylist.length} song(s) selected`}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "white", color: "#24354A", border: "1px solid #E6E2D9", padding: "8px 20px", fontWeight: 500 }}
                  onClick={() => setShowCreatePlaylist(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#24354A", color: "white", padding: "8px 20px", fontWeight: 600 }}
                >
                  Create playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Playlist Detail View Modal */}
      {selectedPlaylist && (
        <div className="dialog-overlay open" onClick={() => setSelectedPlaylist(null)}>
          <div 
            className="dialog-content" 
            style={{ maxHeight: "90vh", overflowY: "auto", maxWidth: "700px", background: "#F8F7F3", color: "#24354A" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #E6E2D9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: selectedPlaylist.color, display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
                  {selectedPlaylist.image ? (
                    <img src={selectedPlaylist.image} alt={selectedPlaylist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Music style={{ width: "40px", height: "40px", color: "white" }}/>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#24354A" }}>{selectedPlaylist.name}</h2>
                  <p className="text-[#7C8893]">{selectedPlaylist.count} songs</p>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                  style={{ 
                    background: "#dc2626", 
                    color: "white", 
                    padding: "8px 16px", 
                    fontSize: "14px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                >
                  <Trash2 style={{ width: "16px", height: "16px" }}/>
                  Delete
                </button>
                <button 
                  onClick={() => setSelectedPlaylist(null)}
                  style={{ background: "transparent", color: "#24354A", padding: "4px 8px", fontSize: "14px", cursor: "pointer", fontWeight: 600, border: "none" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div>
              {playlistSongs[selectedPlaylist.id] && playlistSongs[selectedPlaylist.id].length > 0 ? (
                <div style={{ border: "1px solid #E6E2D9", borderRadius: "12px", overflow: "hidden", background: "white" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", background: "#F1EEE6", padding: "12px 16px", color: "#6b7280", fontWeight: 700 }}>
                    <div>#</div>
                    <div>TITLE & ARTIST</div>
                    <div style={{ textAlign: "right" }}>DURATION</div>
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {playlistSongs[selectedPlaylist.id].map((song, idx) => (
                      <div
                        key={song.song_id}
                        onClick={() => { setCurrentTrack(song); setIsPlaying(true); }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#F8F7F3"}
                        onMouseLeave={(e) => e.currentTarget.style.background = currentTrack?.song_id === song.song_id ? "#F1EEE6" : "transparent"}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "60px 1fr 100px",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderBottom: idx === playlistSongs[selectedPlaylist.id].length - 1 ? "none" : "1px solid #E6E2D9",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          background: currentTrack?.song_id === song.song_id ? "#F1EEE6" : "transparent"
                        }}
                      >
                        <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>{idx + 1}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#24354A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
                          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>{song.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280", background: "#F8F7F3", borderRadius: "12px", border: "2px dashed #E6E2D9" }}>
                  <Music style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.3, color: "#24354A" }}/>
                  <p style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>No songs in this playlist yet.</p>
                  <p style={{ fontSize: "13px", margin: "8px 0 0 0", opacity: 0.7 }}>Add songs to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Crop Image Modal */}
      {showCropModal && (
        <div className="dialog-overlay open" style={{ zIndex: 100 }}>
          <div className="dialog-content" style={{ maxWidth: "500px", width: "100%" }}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "white" }}>Crop your image</h2>
            </div>

            <div style={{ position: "relative", width: "100%", height: "300px", borderRadius: "12px", overflow: "hidden", background: "#F8F7F3" }}>
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{ containerStyle: { width: "100%", height: "100%" } }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
              <button
                type="button"
                className="btn"
                style={{ background: "white", color: "#24354A", border: "1px solid #E6E2D9", padding: "8px 16px", fontWeight: 500 }}
                onClick={() => setShowCropModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#24354A", color: "white", padding: "8px 16px", fontWeight: 600 }}
                onClick={getCroppedImage}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="dialog-overlay open" style={{ zIndex: 60 }} onClick={() => setShowProfile(false)}>
          <div 
            className="dialog-content" 
            style={{ maxHeight: "90vh", overflowY: "auto", maxWidth: "600px", background: "#F8F7F3", color: "#24354A" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #E6E2D9" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#24354A" }}>Profile</h2>
              <button 
                onClick={() => setShowProfile(false)}
                style={{ background: "transparent", color: "#24354A", padding: "4px 8px", fontSize: "18px", cursor: "pointer", fontWeight: 600, border: "none" }}
              >
                ✕
              </button>
            </div>

            {/* Profile Tabs */}
            <div className="tabs-list" style={{ marginBottom: "24px" }}>
              <button
                className={`tab-trigger ${profileTab === "profile" ? "active" : ""}`}
                onClick={() => setProfileTab("profile")}
              >
                <User style={{ width: "16px", height: "16px", marginRight: "6px" }}/> Profile
              </button>
              <button
                className={`tab-trigger ${profileTab === "settings" ? "active" : ""}`}
                onClick={() => setProfileTab("settings")}
              >
                <SettingsIcon style={{ width: "16px", height: "16px", marginRight: "6px" }}/> Settings
              </button>
            </div>

            {/* Profile Tab Content */}
            {profileTab === "profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Avatar Section */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9" }}>
                  <div 
                    className="avatar" 
                    style={{ 
                      width: "120px", 
                      height: "120px", 
                      background: avatarPreview ? "white" : "white",
                      border: "3px solid #10b981",
                      fontSize: "48px",
                      fontWeight: 700,
                      backgroundImage: avatarPreview ? `url(${avatarPreview})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {!avatarPreview && getAvatarInitials(loginEmail)}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#24354A" }}>{userName}</h3>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>{loginEmail}</p>
                    <p style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0 0 0" }}>User ID: {currentUserId}</p>
                  </div>
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                    <span className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <User style={{ width: "16px", height: "16px" }}/> Change Avatar
                    </span>
                  </label>
                </div>

                {/* Stats Section */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#24354A" }}>{playlists.length}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Playlists</div>
                  </div>
                  <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#24354A" }}>0</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Songs</div>
                  </div>
                  <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#24354A" }}>0</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Total Plays</div>
                  </div>
                </div>

                {/* Profile Info */}
                <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px 0", color: "#24354A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile Information</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Display Name</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #E6E2D9", borderRadius: "6px", background: "#F8F7F3" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #E6E2D9", borderRadius: "6px", background: "#F8F7F3" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Bio</label>
                      <textarea
                        value={userBio}
                        onChange={(e) => setUserBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #E6E2D9", borderRadius: "6px", background: "#F8F7F3", resize: "vertical" }}
                      />
                    </div>
                    
                    {/* Save Button */}
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="btn btn-primary"
                      style={{ 
                        width: "100%", 
                        marginTop: "8px",
                        justifyContent: "center",
                        opacity: isSavingProfile ? 0.6 : 1,
                        cursor: isSavingProfile ? "not-allowed" : "pointer"
                      }}
                    >
                      <Check style={{ width: "16px", height: "16px" }}/>
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    
                    {/* Save Message */}
                    {profileSaveMessage && (
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        textAlign: "center",
                        background: profileSaveMessage.includes("success") ? "#dcfce7" : "#fee2e2",
                        color: profileSaveMessage.includes("success") ? "#166534" : "#991b1b",
                        border: `1px solid ${profileSaveMessage.includes("success") ? "#bbf7d0" : "#fecaca"}`
                      }}>
                        {profileSaveMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab Content */}
            {profileTab === "settings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px 0", color: "#24354A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Appearance</h4>
                  <div>
                    <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #E6E2D9", borderRadius: "6px", background: "#F8F7F3" }}
                    >
                      <option value="System">System</option>
                      <option value="Light">Light</option>
                      <option value="Dark">Dark</option>
                    </select>
                  </div>
                </div>

                <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px 0", color: "#24354A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button className="btn btn-secondary btn-full-width" style={{ justifyContent: "flex-start" }}>
                      <Lock style={{ width: "16px", height: "16px", marginRight: "8px" }}/> Change Password
                    </button>
                    <button className="btn btn-secondary btn-full-width" style={{ justifyContent: "flex-start" }}>
                      <Link2 style={{ width: "16px", height: "16px", marginRight: "8px" }}/> Connected Accounts
                    </button>
                  </div>
                </div>

                <div style={{ padding: "20px", background: "#FEE2E2", borderRadius: "12px", border: "1px solid #FCA5A5" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px 0", color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Danger Zone</h4>
                  <button 
                    className="btn" 
                    style={{ background: "#dc2626", color: "white", fontWeight: 600, width: "100%" }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        // Handle account deletion
                        alert('Account deletion functionality would be implemented here');
                      }
                    }}
                  >
                    <Trash2 style={{ width: "16px", height: "16px", marginRight: "8px" }}/> Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Profile View Modal */}
      {viewingUser && (
        <div className="dialog-overlay open" style={{ zIndex: 60 }} onClick={() => setViewingUser(null)}>
          <div 
            className="dialog-content" 
            style={{ maxHeight: "90vh", overflowY: "auto", maxWidth: "700px", background: "#F8F7F3", color: "#24354A" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #E6E2D9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: viewingUser.color, display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
                  {viewingUser.image ? (
                    <img src={viewingUser.image} alt={viewingUser.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Music style={{ width: "40px", height: "40px", color: "white" }}/>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#24354A" }}>
                    {viewingUser.user_id === currentUserId ? "Your Profile" : `${viewingUser.username}'s Profile`}
                  </h2>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>{viewingUser.email}</p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0  0" }}>
                    User ID: {viewingUser.user_id}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: "4px  0  0" }}>
                    Member since {new Date(viewingUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={() => setViewingUser(null)}
                  style={{ background: "transparent", color: "#24354A", padding: "4px 8px", fontSize: "18px", cursor: "pointer", fontWeight: 600, border: "none" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
              <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9", textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "#24354A" }}>{viewingUserPlaylists.length}</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Playlists</div>
              </div>
              <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9", textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "#24354A" }}>{viewingUser.total_songs || 0}</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Songs</div>
              </div>
            </div>

            {/* Playlists Section */}
            <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid #E6E2D9" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0", color: "#24354A" }}>
                {viewingUser.user_id === currentUserId ? "Your" : `${viewingUser.username}'s`} Playlists
              </h4>
              {viewingUserPlaylists.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {viewingUserPlaylists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={async () => {
                        // Allow clicking on any user's playlists (own or friend's)
                        try {
                          // Fetch and display the playlist
                          await handleSelectPlaylist(playlist);
                          setViewingUser(null);
                        } catch (error) {
                          console.error('Failed to view playlist:', error);
                          alert('Failed to load playlist. Please try again.');
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "#F8F7F3",
                        cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F1EEE6"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#F8F7F3"}
                    >
                      <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: playlist.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Music style={{ width: "24px", height: "24px", color: "white" }}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#24354A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {playlist.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {playlist.count} songs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "#6b7280", margin: "20px 0" }}>
                  {viewingUser.user_id === currentUserId ? "You haven't" : "This user hasn't"} created any playlists yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}