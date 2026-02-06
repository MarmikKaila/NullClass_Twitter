// src/Pages/Feed/Tweetbox/Tweetbox.js
import React, { useState, useEffect } from "react";
import "./Tweetbox.css"; // keep your styles (if not exist, create minimal)
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Tweetbox(props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [tweetLimit, setTweetLimit] = useState({ canPost: true, remaining: -1 });
  const [limitError, setLimitError] = useState("");

  // get user email (if stored on login); fall back to default
  function getUserEmail() {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "me@example.com";
      const u = JSON.parse(raw);
      return u?.email || "me@example.com";
    } catch {
      return "me@example.com";
    }
  }

  // Check tweet limit on component mount
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const email = getUserEmail();
        const res = await fetch(`${API}/check-tweet-limit?email=${email}`);
        const data = await res.json();
        setTweetLimit(data);
      } catch (err) {
        console.error("Failed to check tweet limit:", err);
      }
    };
    checkLimit();
  }, []);

  const handleTweet = async (e) => {
    e.preventDefault();
    if (!text || !text.trim()) return;
    
    setLimitError("");
    
    // Check tweet limit
    if (!tweetLimit.canPost) {
      setLimitError("You have reached your tweet limit for this month. Please upgrade your subscription.");
      return;
    }

    setLoading(true);

    const payload = {
      post: text.trim(), // backend expects `post` (based on your feed)
      email: getUserEmail(),
      profilephoto: "" // optional: add profile photo url if you have it
    };

    try {
      const res = await fetch(`${API}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error("Post failed", res.statusText);
        setLoading(false);
        return;
      }
      
      // Increment tweet count
      await fetch(`${API}/increment-tweet-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: getUserEmail() }),
      });
      
      // Update local state
      setTweetLimit(prev => ({
        ...prev,
        remaining: prev.remaining > 0 ? prev.remaining - 1 : prev.remaining,
        canPost: prev.remaining === -1 || prev.remaining > 1
      }));

      // success: clear input
      setText("");
      // ask parent to refresh immediately
      if (typeof props.onPostCreated === "function") {
        try { await props.onPostCreated(); } catch (err) { console.warn("onPostCreated callback failed", err); }
      }
      // optionally show a small in-app toast
      if (typeof window !== "undefined" && typeof window.showInAppToast === "function") {
        window.showInAppToast("Posted", payload.post);
      }
    } catch (err) {
      console.error("Tweet error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tweetbox" style={{ padding: 12, borderBottom: "1px solid #e6ecf0" }}>
      {limitError && (
        <div style={{ 
          background: "#ffebee", 
          color: "#c62828", 
          padding: 10, 
          borderRadius: 8, 
          marginBottom: 10,
          fontSize: 14 
        }}>
          {limitError}
          <a href="/home/subscription" style={{ marginLeft: 10, color: "#1da1f2" }}>
            Upgrade Plan
          </a>
        </div>
      )}
      
      {tweetLimit.remaining >= 0 && (
        <div style={{ 
          background: "#e3f2fd", 
          color: "#1565c0", 
          padding: 8, 
          borderRadius: 8, 
          marginBottom: 10,
          fontSize: 13 
        }}>
          Tweets remaining this month: {tweetLimit.remaining}
        </div>
      )}

      <form onSubmit={handleTweet} style={{ display: "flex", gap: 12 }}>
        <img src="/logo192.png" alt="avatar" style={{ width: 48, height: 48, borderRadius: 24 }} />
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening?"
            rows={3}
            style={{ width: "100%", padding: 8, fontSize: 15, borderRadius: 8, resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div />
            <button
              type="submit"
              disabled={loading || !tweetLimit.canPost}
              style={{
                background: tweetLimit.canPost ? "#50b7f5" : "#ccc",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 20,
                cursor: loading || !tweetLimit.canPost ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Posting..." : "Tweets"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
