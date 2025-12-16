import React, { useState, useEffect } from "react";
import MusicPlayerMock from "./MusicPlayerMock";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('musicPlayerUserId');
    const savedEmail = localStorage.getItem('musicPlayerEmail');
    const savedAuth = localStorage.getItem('musicPlayerAuthed');
    
    if (savedUserId && savedEmail && savedAuth === 'true') {
      console.log('🔐 Found saved session for:', savedEmail, 'User ID:', savedUserId);
      setCurrentUserId(parseInt(savedUserId));
      setLoginEmail(savedEmail);
      setAuthed(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userId, email) => {
    setCurrentUserId(userId);
    setLoginEmail(email);
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('musicPlayerUserId');
    localStorage.removeItem('musicPlayerEmail');
    localStorage.removeItem('musicPlayerAuthed');
    console.log('🔓 Session cleared');
    
    setCurrentUserId(null);
    setLoginEmail("");
    setAuthed(false);
  };

  if (loading) {
    return null; // or a loading spinner
  }

  if (!authed) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <MusicPlayerMock 
      currentUserId={currentUserId}
      loginEmail={loginEmail}
      onLogout={handleLogout}
    />
  );
}
