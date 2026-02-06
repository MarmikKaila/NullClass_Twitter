// src/utils/notifications.js
const STORAGE_KEY_PREF = "twiller_notifications_enabled";
const STORAGE_KEY_NOTIFIED = "twiller_notified_posts_v1"; // versioned key

export function isNotificationSupported() {
  return "Notification" in window;
}

export function getNotificationPreference() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_PREF);
    return val === null ? null : val === "true"; // null means not chosen yet
  } catch {
    return null;
  }
}

export function setNotificationPreference(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY_PREF, enabled ? "true" : "false");
  } catch {}
}

// request permission (returns a Promise that resolves to 'granted'|'denied'|'default')
export function requestNotificationPermission() {
  if (!isNotificationSupported()) return Promise.resolve("unsupported");
  return Notification.requestPermission();
}

export function showNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, options);
    // Optionally, click behavior:
    n.onclick = (ev) => {
      // bring window to front
      window.focus && window.focus();
      // you can navigate to the specific post here if you want:
      if (options?.data?.url) window.location.href = options.data.url;
      n.close();
    };
  } catch (err) {
    console.warn("Notification failed:", err);
  }
}

// Manage list of already-notified post ids (keeps duplicates away)
export function getNotifiedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFIED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function addNotifiedId(id) {
  try {
    const arr = getNotifiedIds();
    if (!arr.includes(id)) {
      arr.push(id);
      // keep list limited to last 200 ids
      if (arr.length > 200) arr.splice(0, arr.length - 200);
      localStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(arr));
    }
  } catch {}
}
export function clearNotifiedIds() {
  try {
    localStorage.removeItem(STORAGE_KEY_NOTIFIED);
  } catch {}
}
