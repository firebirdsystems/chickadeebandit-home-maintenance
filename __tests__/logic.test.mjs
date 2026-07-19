import { describe, it, expect } from "vitest";
import {
  formatDays, intervalUnit,
  fmtDate, fmtDateTime,
  statusColor, formatBytes, docIcon,
  activityStatusFromLog,
  localDateToISO, isoToLocalDateInput,
} from "../src/logic.js";

// ── formatDays ────────────────────────────────────────────────────────────────

describe("formatDays", () => {
  it("formats fractional days as hours", () => {
    expect(formatDays(0.5)).toBe("12h");
    expect(formatDays(0.25)).toBe("6h");
  });

  it("formats days less than a week", () => {
    expect(formatDays(1)).toBe("1d");
    expect(formatDays(5)).toBe("5d");
  });

  it("formats weeks (7–29 days)", () => {
    expect(formatDays(7)).toBe("1w");
    expect(formatDays(14)).toBe("2w");
  });

  it("formats months (30–364 days)", () => {
    expect(formatDays(30)).toBe("1mo");
    expect(formatDays(90)).toBe("3mo");
  });

  it("formats years (365+ days)", () => {
    expect(formatDays(365)).toBe("1.0yr");
    expect(formatDays(730)).toBe("2.0yr");
  });

  it("works with negative values (uses abs)", () => {
    expect(formatDays(-7)).toBe("1w");
    expect(formatDays(-365)).toBe("1.0yr");
  });
});

// ── intervalUnit ──────────────────────────────────────────────────────────────

describe("intervalUnit", () => {
  it("formats days under a week", () => {
    expect(intervalUnit(1)).toBe("1d");
    expect(intervalUnit(6)).toBe("6d");
  });

  it("formats weeks", () => {
    expect(intervalUnit(7)).toBe("1w");
    expect(intervalUnit(14)).toBe("2w");
  });

  it("formats months", () => {
    expect(intervalUnit(30)).toBe("1mo");
    expect(intervalUnit(90)).toBe("3mo");
  });

  it("formats years", () => {
    expect(intervalUnit(365)).toBe("1.0yr");
    expect(intervalUnit(730)).toBe("2.0yr");
  });
});

// ── fmtDate ───────────────────────────────────────────────────────────────────

describe("fmtDate", () => {
  it("formats an ISO date to a readable month-day-year string", () => {
    const result = fmtDate("2025-06-15T12:00:00");
    expect(result).toMatch(/Jun \d+, 2025/);
  });
});

// ── statusColor ───────────────────────────────────────────────────────────────

describe("statusColor", () => {
  it("returns green-ish for pct = 0", () => {
    expect(statusColor(0)).toMatch(/^rgb\(22,\s*163,\s*74\)$/);
  });

  it("returns red-ish for pct = 1", () => {
    expect(statusColor(1)).toMatch(/^rgb\(220,\s*38,\s*38\)$/);
  });

  it("clamps values below 0 and above 1", () => {
    expect(statusColor(-1)).toBe(statusColor(0));
    expect(statusColor(2)).toBe(statusColor(1));
  });

  it("returns a midpoint color for pct = 0.5", () => {
    const result = statusColor(0.5);
    expect(result).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
    expect(result).not.toBe(statusColor(0));
    expect(result).not.toBe(statusColor(1));
  });
});

// ── formatBytes ───────────────────────────────────────────────────────────────

describe("formatBytes", () => {
  it("formats bytes under 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
    expect(formatBytes(2097152)).toBe("2.0 MB");
  });
});

// ── docIcon ───────────────────────────────────────────────────────────────────

describe("docIcon", () => {
  it("returns PDF icon", () => {
    expect(docIcon("report.pdf")).toBe("📄");
  });

  it("returns image icon", () => {
    expect(docIcon("photo.jpg")).toBe("🖼️");
    expect(docIcon("screenshot.PNG")).toBe("🖼️");
  });

  it("returns Word icon", () => {
    expect(docIcon("letter.docx")).toBe("📝");
  });

  it("returns spreadsheet icon", () => {
    expect(docIcon("data.xlsx")).toBe("📊");
  });

  it("returns generic icon for unknown extensions", () => {
    expect(docIcon("archive.zip")).toBe("📎");
    expect(docIcon("file")).toBe("📎");
  });
});

// ── activityStatusFromLog ─────────────────────────────────────────────────────

describe("activityStatusFromLog", () => {
  const activity = { id: "act1", interval_days: 90 };
  const member   = { id: "u1", name: "Alex" };
  const members  = [member];

  it("returns never-done status when log is null", () => {
    const status = activityStatusFromLog(activity, null, members);
    expect(status.label).toBe("Never done");
    expect(status.pct).toBe(2);
    expect(status.lastBy).toBeNull();
  });

  it("returns overdue status when past the interval", () => {
    const overdueLog = { done_by: "u1", done_at: new Date(Date.now() - 100 * 86400000).toISOString() };
    const status = activityStatusFromLog(activity, overdueLog, members);
    expect(status.pct).toBeGreaterThan(1);
    expect(status.label).toMatch(/Overdue by/);
    expect(status.lastBy.member.name).toBe("Alex");
  });

  it("returns due-in status when within the interval", () => {
    const recentLog = { done_by: "u1", done_at: new Date(Date.now() - 10 * 86400000).toISOString() };
    const status = activityStatusFromLog(activity, recentLog, members);
    expect(status.pct).toBeLessThan(1);
    expect(status.label).toMatch(/Due in/);
  });

  it("sets lastBy.member to null when actor is not in members list", () => {
    const log = { done_by: "unknown-id", done_at: new Date(Date.now() - 10 * 86400000).toISOString() };
    const status = activityStatusFromLog(activity, log, members);
    expect(status.lastBy.member).toBeNull();
  });

  it("defaults interval_days to 90 when not set", () => {
    const actNoInterval = { id: "act2" };
    const log = { done_by: "u1", done_at: new Date(Date.now() - 45 * 86400000).toISOString() };
    const status = activityStatusFromLog(actNoInterval, log, members);
    expect(status.pct).toBeCloseTo(0.5, 1);
  });
});

// ── local date round-trip ─────────────────────────────────────────────────────

describe("localDateToISO / isoToLocalDateInput", () => {
  it("round-trips a date input back to the same calendar date", () => {
    for (const d of ["2026-07-01", "2026-01-15", "2026-12-31", "2026-03-08"]) {
      expect(isoToLocalDateInput(localDateToISO(d))).toBe(d);
    }
  });

  it("anchors the stored instant to local midnight, not UTC midnight", () => {
    const dt = new Date(localDateToISO("2026-07-01"));
    expect(dt.getFullYear()).toBe(2026);
    expect(dt.getMonth()).toBe(6);
    expect(dt.getDate()).toBe(1);
    expect(dt.getHours()).toBe(0);
  });

  it("reads a stored instant back as its local calendar date", () => {
    const dt = new Date(2026, 6, 1, 23, 30);
    expect(isoToLocalDateInput(dt.toISOString())).toBe("2026-07-01");
  });

  it("returns null/empty for blank or malformed values", () => {
    expect(localDateToISO("")).toBeNull();
    expect(localDateToISO(null)).toBeNull();
    expect(localDateToISO("not-a-date")).toBeNull();
    expect(isoToLocalDateInput("")).toBe("");
    expect(isoToLocalDateInput(null)).toBe("");
    expect(isoToLocalDateInput("not-a-date")).toBe("");
  });
});
