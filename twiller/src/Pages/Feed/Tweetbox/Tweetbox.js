// src/Pages/Feed/Tweetbox/Tweetbox.js
import React, { useState } from "react";
import "./Tweetbox.css"; // keep your styles (if not exist, create minimal)
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Tweetbox(props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleTweet = async (e) => {
    e.preventDefault();
    if (!text || !text.trim()) return;
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
              disabled={loading}
              style={{
                background: "#50b7f5",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 20,
                cursor: loading ? "not-allowed" : "pointer",
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
