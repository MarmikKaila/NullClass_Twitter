// src/Pages/Feed/Feed.js
import React, { useEffect, useState, useCallback } from "react";
import "./Feed.css";
import Posts from "./Posts/Posts";
import Tweetbox from "./Tweetbox/Tweetbox";

import useKeywordNotifier from "../../hooks/useKeywordNotifier";
import { getNotificationPreference, requestNotificationPermission, setNotificationPreference } from "../../utils/notifications";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Feed = () => {
  const [post, setPost] = useState([]);
  const [notifyEnabled, setNotifyEnabled] = useState(getNotificationPreference() ?? false);
  const [showEnableCTA, setShowEnableCTA] = useState(false);

  // Stable fetchPosts so child can call it
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/post`);
      const data = await res.json();
      setPost(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  }, []);

  useEffect(() => {
    // initial load + periodic poll
    fetchPosts();
    const interval = setInterval(fetchPosts, 20 * 1000); // poll every 20s
    return () => clearInterval(interval);
  }, [fetchPosts]);

  // expose in-app toast helper (guaranteed visible)
  function showInAppToast(title, body) {
    const id = "twiller-dev-toast";
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement("div");
      container.id = id;
      container.style.position = "fixed";
      container.style.right = "20px";
      container.style.bottom = "20px";
      container.style.zIndex = 999999;
      container.style.maxWidth = "420px";
      document.body.appendChild(container);
    }
    container.innerHTML = `<div style="
        background:#0b2436;color:#fff;padding:12px;border-radius:10px;max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,0.3);font-family:Arial,Helvetica,sans-serif">
        <strong style="display:block;margin-bottom:6px">${title}</strong>
        <div style="font-size:13px;line-height:1.25">${body}</div>
      </div>`;
    setTimeout(() => { if (container) container.innerHTML = ""; }, 7000);
  }

  // make global so hook can call easily (safe)
  // eslint-disable-next-line no-undef
  if (typeof window !== "undefined") window.showInAppToast = showInAppToast;

  // notifier hook (will attempt native notification and we've added in-app fallback)
  const onMissingPermission = () => {
    setShowEnableCTA(true);
  };
  useKeywordNotifier({ posts: post, enabled: notifyEnabled, onMissingPermission });

  const toggleNotifications = async () => {
    if (!notifyEnabled) {
      const perm = await requestNotificationPermission();
      if (perm === "granted") {
        setNotifyEnabled(true);
        setNotificationPreference(true);
        setShowEnableCTA(false);
        alert("Notifications enabled. You'll receive keyword alerts.");
      } else if (perm === "denied") {
        setNotifyEnabled(false);
        setNotificationPreference(false);
        alert("Notifications denied. Allow them in browser settings to receive alerts.");
      } else {
        setNotifyEnabled(false);
        setNotificationPreference(false);
        setShowEnableCTA(true);
      }
    } else {
      setNotifyEnabled(false);
      setNotificationPreference(false);
      alert("Notifications disabled.");
    }
  };

  return (
    <div className="feed">
      <div className="feed__header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2>Home</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={toggleNotifications} style={{ padding: "6px 10px", borderRadius: 8 }}>
            {notifyEnabled ? "Disable notifications" : "Enable notifications"}
          </button>
        </div>
      </div>

      <Tweetbox onPostCreated={fetchPosts} />

      {showEnableCTA && (
        <div style={{ padding: 10, background: "#fff3", borderRadius: 8, margin: "8px 12px" }}>
          Notifications are not granted. <button onClick={toggleNotifications}>Allow Notifications</button>
        </div>
      )}

      {post.map((p) => (
        <Posts key={p._id || p.id} p={p} />
      ))}
    </div>
  );
};

export default Feed;
