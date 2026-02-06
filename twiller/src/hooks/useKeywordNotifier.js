// src/hooks/useKeywordNotifier.js
import { useEffect, useRef } from "react";
import {
  getNotificationPreference,
  isNotificationSupported,
  showNotification,
  getNotifiedIds,
  addNotifiedId,
} from "../utils/notifications";

// keywords (lowercase). Edit as needed.
const KEYWORDS = ["cricket", "science"].map(k => (k || "").toString().trim().toLowerCase()).filter(Boolean);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function useKeywordNotifier({ posts = [], enabled = null, onMissingPermission } = {}) {
  const notifiedRef = useRef(getNotifiedIds());

  useEffect(() => {
    // header debug
    // eslint-disable-next-line no-console
    console.log("useKeywordNotifier run — posts:", posts.length, "permission:", (typeof Notification !== "undefined") ? Notification.permission : "none", "pref:", getNotificationPreference(), "enabled:", enabled, "keywords:", KEYWORDS);

    if (!isNotificationSupported()) {
      // eslint-disable-next-line no-console
      console.log("Notifications not supported.");
      return;
    }

    const pref = getNotificationPreference();
    if (pref === false) {
      // eslint-disable-next-line no-console
      console.log("User pref: notifications disabled.");
      return;
    }
    if (enabled === false) {
      // eslint-disable-next-line no-console
      console.log("Caller disabled notifications.");
      return;
    }

    if (Notification.permission !== "granted") {
      // eslint-disable-next-line no-console
      console.log("Permission not granted; will notify caller.");
      if (typeof onMissingPermission === "function") onMissingPermission();
      return;
    }

    if (!Array.isArray(posts) || posts.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No posts to check.");
      return;
    }

    // prebuild regex list (whole-word)
    const regexes = KEYWORDS.map(k => new RegExp(`\\b${escapeRegExp(k)}\\b`, "i"));

    posts.forEach((post) => {
      try {
        const id = post && (post._id || post.id || null);
        // IMPORTANT: only test the main post text field (do NOT append username)
        const rawText = (post && (post.post || post.text || "")) ?? "";
        const text = rawText.toString().trim();

        // debug: show exactly what we're checking
        // eslint-disable-next-line no-console
        console.log("check post:", id, "-> text(length):", text.length, "| repr:", text);

        if (!id) {
          // eslint-disable-next-line no-console
          console.log("skip (no id)", post);
          return;
        }

        if (!text) {
          // eslint-disable-next-line no-console
          console.log("skip (empty text) id:", id);
          return;
        }

        // already notified?
        if (notifiedRef.current.includes(id)) {
          // eslint-disable-next-line no-console
          // console.log("skip (already notified) id:", id);
          return;
        }

        // find a matching keyword using whole-word regex
        let matchedKeyword = null;
        for (let i = 0; i < regexes.length; i++) {
          if (regexes[i].test(text)) {
            matchedKeyword = KEYWORDS[i];
            break;
          }
        }

        if (!matchedKeyword) {
          // eslint-disable-next-line no-console
          // console.log("no keyword match for id:", id);
          return;
        }

        // If we reach here, we have a valid match on the post text only
        const title = `New ${matchedKeyword} post`;
        const body = text;
        const icon = post.profilephoto || post.avatar || "/logo192.png";

        // show in-app toast if available (fallback)
        try {
          if (typeof window !== "undefined" && typeof window.showInAppToast === "function") {
            window.showInAppToast(title, body);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("in-app toast failed:", e);
        }

        // try native notification
        try {
          showNotification(title, { body, icon, data: { postId: id } });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("showNotification failed:", err);
        }

        // mark as notified
        try {
          addNotifiedId(id);
          notifiedRef.current.push(id);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("addNotifiedId failed:", e);
        }

        // eslint-disable-next-line no-console
        console.log("NOTIFIED id:", id, "keyword:", matchedKeyword);

      } catch (outerErr) {
        // eslint-disable-next-line no-console
        console.error("error checking post:", outerErr, post);
      }
    });

  }, [posts, enabled, onMissingPermission]);
}
