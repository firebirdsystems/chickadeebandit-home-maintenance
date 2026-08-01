/**
 * Pure business logic for the Home Maintenance app.
 * No DOM, no fetch — importable in both browser and test environments.
 */

export function formatDays(d) {
  const n = Math.abs(d);
  if (n < 1)   return `${Math.round(n * 24)}h`;
  if (n < 7)   return `${Math.round(n)}d`;
  if (n < 30)  return `${Math.round(n / 7)}w`;
  if (n < 365) return `${Math.round(n / 30)}mo`;
  return `${(n / 365).toFixed(1)}yr`;
}

export function intervalUnit(v) {
  if (v >= 365) return `${(v / 365).toFixed(1)}yr`;
  if (v >= 30)  return `${Math.round(v / 30)}mo`;
  if (v >= 7)   return `${Math.round(v / 7)}w`;
  return `${v}d`;
}

// Date inputs carry a calendar date with no timezone. Round-tripping one through
// `new Date("2026-07-01")` parses it as UTC midnight, which reads back as the
// previous day west of UTC — so convert against the local calendar instead.
export function localDateToISO(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

export function isoToLocalDateInput(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function statusColor(pct) {
  const c = Math.min(1, Math.max(0, pct));
  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
  let r, g, b;
  if (c < 0.5) {
    const t = c / 0.5;
    [r, g, b] = [lerp(22, 217, t), lerp(163, 119, t), lerp(74, 6, t)];
  } else {
    const t = (c - 0.5) / 0.5;
    [r, g, b] = [lerp(217, 220, t), lerp(119, 38, t), lerp(6, 38, t)];
  }
  return `rgb(${r},${g},${b})`;
}

export function formatBytes(bytes) {
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function docIcon(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext))                          return "📄";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
  if (["doc", "docx"].includes(ext))                  return "📝";
  if (["xls", "xlsx"].includes(ext))                  return "📊";
  return "📎";
}

export function activityStatusFromLog(activity, log, members, now = new Date()) {
  const days = activity.interval_days ?? 90;
  if (!log) return { pct: 2, label: "Never done", lastBy: null };
  const lastDone = new Date(log.done_at);
  const elapsedD = (now - lastDone) / 86400000;
  const pct      = elapsedD / days;
  const nextDue  = new Date(lastDone.getTime() + days * 86400000);
  const diffDays = (nextDue - now) / 86400000;
  const label    = pct >= 1 ? `Overdue by ${formatDays(-diffDays)}` : `Due in ${formatDays(diffDays)}`;
  const member   = members.find(m => m.id === log.done_by) ?? null;
  return { pct, label, lastBy: { member, agoD: elapsedD, date: fmtDate(log.done_at) } };
}

/**
 * Fields the document search matches against (see hub-sdk `searchMatch`). The
 * mime type is included so "pdf" finds the receipts and manuals by kind, which
 * is how a maintenance folder is usually browsed.
 */
export function searchableFields(doc) {
  return [doc.title, doc.mimeType];
}
