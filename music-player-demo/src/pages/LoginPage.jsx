import React, { useState } from "react";
import { Headphones, LogIn, Plus } from "lucide-react";
import { loginUser, signupUser } from "../services/api";

export default function LoginPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    
    if (authMode === "login") {
      try {
        console.log('Attempting login for:', authEmail);
        const response = await loginUser(authEmail, authPassword);
        
        if (response.success && response.user) {
          const userId = response.user.user_id;
          
          // Save to localStorage
          localStorage.setItem('musicPlayerUserId', userId.toString());
          localStorage.setItem('musicPlayerEmail', authEmail.toLowerCase());
          localStorage.setItem('musicPlayerAuthed', 'true');
          
          console.log('Login successful, User ID:', userId);
          onLoginSuccess(userId, authEmail);
        } else {
          setAuthError("No account found. Please create an account.");
        }
      } catch (error) {
        console.error('Login failed:', error);
        setAuthError("No account found. Please create an account.");
      }
    } else {
      try {
        console.log('Creating account for:', authEmail);
        const response = await signupUser(authEmail, authPassword);
        
        if (response.success && response.user) {
          const userId = response.user.user_id;
          
          // Save to localStorage
          localStorage.setItem('musicPlayerUserId', userId.toString());
          localStorage.setItem('musicPlayerEmail', authEmail.toLowerCase());
          localStorage.setItem('musicPlayerAuthed', 'true');
          
          console.log('Account created successfully, User ID:', userId);
          onLoginSuccess(userId, authEmail);
        }
      } catch (error) {
        console.error('Signup failed:', error);
        if (error.message.includes('already registered')) {
          setAuthError("This email is already registered. Please log in instead.");
          setAuthMode("login");
        } else {
          setAuthError(error.message || "Signup failed. Please try again.");
        }
      }
    }
  }

  return (
    <div style={{ 
      background: "#F8F7F3",
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ 
        background: "white", 
        borderRadius: "16px", 
        padding: "48px", 
        maxWidth: "450px", 
        width: "100%",
        boxShadow: "0 4px 20px rgba(36, 53, 74, 0.1)",
        border: "1px solid #E6E2D9"
      }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <div style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "16px", 
              background: "#24354A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Headphones style={{ width: "36px", height: "36px", color: "white" }} />
            </div>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#24354A", margin: 0 }}>
            McMusic Hub
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
            {authMode === "login" ? "Welcome back! Log in to continue" : "Create your account to get started"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {authError && (
            <div style={{ 
              padding: "12px", 
              background: "#FEE2E2", 
              color: "#991B1B", 
              borderRadius: "8px", 
              fontSize: "14px", 
              border: "1px solid #FCA5A5" 
            }}>
              {authError}
            </div>
          )}

          <div>
            <label style={{ 
              fontSize: "14px", 
              fontWeight: 600, 
              color: "#24354A", 
              display: "block", 
              marginBottom: "8px" 
            }}>
              Email
            </label>
            <input 
              required 
              type="email" 
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="you@example.com" 
              style={{ 
                width: "100%",
                padding: "12px", 
                border: "2px solid #E6E2D9", 
                borderRadius: "8px", 
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                background: "#F8F7F3"
              }}
              onFocus={(e) => e.target.style.borderColor = "#24354A"}
              onBlur={(e) => e.target.style.borderColor = "#E6E2D9"}
            />
          </div>

          <div>
            <label style={{ 
              fontSize: "14px", 
              fontWeight: 600, 
              color: "#24354A", 
              display: "block", 
              marginBottom: "8px" 
            }}>
              Password
            </label>
            <input 
              required 
              type="password" 
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••" 
              style={{ 
                width: "100%",
                padding: "12px", 
                border: "2px solid #E6E2D9", 
                borderRadius: "8px", 
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                background: "#F8F7F3"
              }}
              onFocus={(e) => e.target.style.borderColor = "#24354A"}
              onBlur={(e) => e.target.style.borderColor = "#E6E2D9"}
            />
          </div>

          {authMode === "signup" && (
            <div>
              <label style={{ 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#24354A", 
                display: "block", 
                marginBottom: "8px" 
              }}>
                Confirm Password
              </label>
              <input 
                required 
                type="password" 
                placeholder="••••••••" 
                style={{ 
                  width: "100%",
                  padding: "12px", 
                  border: "2px solid #E6E2D9", 
                  borderRadius: "8px", 
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "#F8F7F3"
                }}
                onFocus={(e) => e.target.style.borderColor = "#24354A"}
                onBlur={(e) => e.target.style.borderColor = "#E6E2D9"}
              />
            </div>
          )}

          <button 
            type="submit" 
            style={{ 
              width: "100%",
              background: "#24354A", 
              color: "white", 
              fontWeight: 600, 
              padding: "14px", 
              borderRadius: "8px", 
              border: "none", 
              fontSize: "16px", 
              cursor: "pointer",
              transition: "transform 0.2s, background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.background = "#1a2838";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.background = "#24354A";
            }}
          >
            {authMode === "login" ? (
              <>
                <LogIn style={{ width: "20px", height: "20px" }}/>
                Log in
              </>
            ) : (
              <>
                <Plus style={{ width: "20px", height: "20px" }}/>
                Sign up
              </>
            )}
          </button>

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button 
              type="button" 
              onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
              style={{ 
                background: "transparent", 
                color: "#24354A", 
                border: "none", 
                fontSize: "14px", 
                cursor: "pointer",
                fontWeight: 600,
                textDecoration: "underline"
              }}
            >
              {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
