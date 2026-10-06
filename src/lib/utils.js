import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatMinutes(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h <= 0) return `${rest} min`;
  if (rest === 0) return `${h} h`;
  return `${h} h ${rest} min`;
}
function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
function localDateISO(d = /* @__PURE__ */ new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function localMinutesNow(d = /* @__PURE__ */ new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}
function weekdayFromISO(iso) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day).getDay();
}
function hostFromInput(raw) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProto);
    return url.hostname.replace(/^www\./, "");
  } catch {
    const host = trimmed.replace(/^www\./, "").split("/")[0];
    if (!host.includes(".")) return null;
    return host;
  }
}
function lastSeenLabel(iso, online) {
  if (online) return "En l\xEDnea ahora";
  if (!iso) return "Sin actividad";
  try {
    return `Visto ${formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es })}`;
  } catch {
    return "Visto hace un rato";
  }
}
const WEEKDAYS = [
  { id: 1, short: "Lun", full: "Lunes" },
  { id: 2, short: "Mar", full: "Martes" },
  { id: 3, short: "Mi\xE9", full: "Mi\xE9rcoles" },
  { id: 4, short: "Jue", full: "Jueves" },
  { id: 5, short: "Vie", full: "Viernes" },
  { id: 6, short: "S\xE1b", full: "S\xE1bado" },
  { id: 0, short: "Dom", full: "Domingo" }
];
export {
  WEEKDAYS,
  cn,
  formatMinutes,
  formatSeconds,
  hostFromInput,
  lastSeenLabel,
  localDateISO,
  localMinutesNow,
  weekdayFromISO
};
