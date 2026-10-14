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

/** The name of the hub glyph that marks a file type — drawn with the SDK's glyph(). */
export function docGlyph(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext))                          return "document";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "frame";
  if (["doc", "docx"].includes(ext))                  return "note";
  if (["xls", "xlsx"].includes(ext))                  return "poll-bars";
  return "folder";
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

/**
 * The line a failed write shows ("Refused, gone, or failed" in the app-template
 * guide): "try again" only when retrying can work, and never the hub's text.
 * `thing` and `action` are the app's own nouns. `found` is the caller's re-read
 * after a write that changed nothing: false = the row is gone, true = it is
 * still there (on a plain `WHERE id = ?` write the row policy narrowed it, the
 * permission line; on a `guarded` write its state moved), null = the re-read
 * itself failed. A `forUser` error keeps the message the app wrote for it.
 */
export function failureLine(e, { action, thing, found, guarded = false } = {}) {
  if (e?.forUser) return e.message;
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return `That ${thing} already exists.`;
  if (e?.status === 403 || (found === true && !guarded)) return `You don’t have permission to ${action}.`;
  if (e?.status === 507) return "The household’s storage is full — free up space first.";
  if (e?.status === 429) return "Too many tries — wait a minute and try again.";
  if (found === null) return `Couldn’t ${action} — try again.`;
  if (found === false || (found === undefined && e?.status === 404)) return `This ${thing} has been removed.`;
  if (found === true || e?.status === 409) return `This ${thing} was changed by someone else — check it first.`;
  return `Couldn’t ${action} — try again.`;
}

/**
 * Whether a failed write may nonetheless have been stored ("retry after a lost
 * response"): no status, a 400 (a timed-out write, or a retry meeting the first
 * try's row under its pinned id), or a 5xx other than 507. Anything else is a
 * refusal that stored nothing.
 */
export function outcomeUnknown(e) {
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return true;
  const status = Number(e?.status) || 0;
  return status === 0 || status === 400 || (status >= 500 && status !== 507);
}
