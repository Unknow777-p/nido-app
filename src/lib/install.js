import { create } from "zustand";
const useInstallStore = create((set) => ({
  deferred: null,
  standalone: false,
  setDeferred: (deferred) => set({ deferred }),
  setStandalone: (standalone) => set({ standalone })
}));
function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || window.matchMedia("(display-mode: minimal-ui)").matches;
}
function detectInstallPlatform() {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const touch = navigator.maxTouchPoints || 0;
  const ios = /iPhone|iPod/.test(ua) || /iPad/.test(ua) || /Macintosh/.test(ua) && touch > 1;
  if (ios) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}
export {
  detectInstallPlatform,
  isStandaloneDisplay,
  useInstallStore
};
