import {
  state,
  LEAVE_TYPES,
  DEFAULT_WORKDAY_HOURS,
} from "./state.js";

export function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c]));
}

export function workshopName(id) {
  return (state.workshops.find((w) => w.id === id) || {}).name || "?";
}

export function workdayHours(emp) {
  const hours = Number(emp && emp.workdayHours);
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_WORKDAY_HOURS;
}

export function clampHours(emp, value) {
  const max = workdayHours(emp);
  const num = Number(value);
  if (!Number.isFinite(num)) return max;
  const bounded = Math.min(Math.max(num, 0), max);
  return Math.round(bounded * 4) / 4;
}

export function formatHoursValue(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(2)));
}

export function leaveTypeLabel(type) {
  const cfg = LEAVE_TYPES.find((opt) => opt.value === type);
  if (cfg) return cfg.label;
  return capitalize(String(type || ""));
}

export function leaveCodeForType(type) {
  const cfg = LEAVE_TYPES.find((opt) => opt.value === type);
  if (cfg && cfg.code) return cfg.code;
  const cleaned = String(type || "").replace(/[^a-z0-9]/gi, "");
  if (!cleaned) return "";
  return cleaned.slice(0, 2).toUpperCase();
}

export function buildLeaveReasonOptions(entry) {
  const options = LEAVE_TYPES.slice();
  if (entry && entry.type && !options.some((opt) => opt.value === entry.type)) {
    options.push({ value: entry.type, label: leaveTypeLabel(entry.type), code: entry.code || leaveCodeForType(entry.type) });
  }
  return options;
}

export function normaliseLeaveEntry(entry, emp) {
  if (!entry) return null;
  if (!entry.type) entry.type = LEAVE_TYPES[0].value;
  if (!entry.code) entry.code = leaveCodeForType(entry.type);
  entry.hours = clampHours(emp, entry.hours);
  return entry;
}

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseISODate(str) {
  if (!str) return null;
  const match = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  )
    return null;
  return date;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfISOWeek(date) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = result.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}

export function isoWeek(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNr);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - yearStart) / DAY_MS) + 1) / 7);
  return { week, year: target.getUTCFullYear() };
}

export function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function safeHours(val) {
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function isDone(status) {
  return String(status || "").toLowerCase() === "gereed";
}

export function totalCapacity(map) {
  const values = Object.values(map)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0);
}

export function currentCapacity() {
  const map = state.capacityByWorkshop || {};
  const fallback = Number.isFinite(state.defaultCapacity) ? Number(state.defaultCapacity) : 0;
  if (state.filters.workshop_id) {
    const id = Number(state.filters.workshop_id);
    if (Number.isFinite(map[id])) return Number(map[id]);
    const total = totalCapacity(map);
    return total > 0 ? total : fallback;
  }
  const total = totalCapacity(map);
  return total > 0 ? total : fallback;
}

export function formatWeekLabel(value) {
  const date = parseISODate(value);
  if (!date) return value;
  const info = isoWeek(date);
  return `Week ${String(info.week).padStart(2, "0")} (${value})`;
}

export function formatISODate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
