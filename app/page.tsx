"use client";

import {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------ *
 * Theme system — a single object drives every color, font, and radius
 * ------------------------------------------------------------------ */

type Theme = {
  label: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  navActive: string;
  display: string; // font-family stack for headings
  body: string; // font-family stack for body
  titleWeight: number;
  radius: string;
  chipRadius: string;
  dark: boolean;
};

type StartingStyle = "Editorial" | "Technical" | "Bold";

const PRESETS: Record<StartingStyle, Theme> = {
  Editorial: {
    label: "Editorial",
    bg: "#f5f1ea",
    surface: "#fffdf8",
    text: "#201c17",
    muted: "#8a8073",
    border: "#e4ddd1",
    accent: "#a8552f",
    accentText: "#fffdf8",
    navActive: "#efe7da",
    display: "'Newsreader', serif",
    body: "'Instrument Sans', sans-serif",
    titleWeight: 500,
    radius: "14px",
    chipRadius: "8px",
    dark: false,
  },
  Technical: {
    label: "Technical",
    bg: "#f3f5f7",
    surface: "#ffffff",
    text: "#14171c",
    muted: "#6b7484",
    border: "#dee3ea",
    accent: "#2f6f5e",
    accentText: "#ffffff",
    navActive: "#e7edf0",
    display: "'Space Grotesk', sans-serif",
    body: "'JetBrains Mono', monospace",
    titleWeight: 600,
    radius: "6px",
    chipRadius: "4px",
    dark: false,
  },
  Bold: {
    label: "Bold",
    bg: "#121210",
    surface: "#1b1a17",
    text: "#f3f1ec",
    muted: "#8f8d85",
    border: "#2b2926",
    accent: "#d6f24b",
    accentText: "#121210",
    navActive: "#242320",
    display: "'Archivo', sans-serif",
    body: "'Archivo', sans-serif",
    titleWeight: 800,
    radius: "12px",
    chipRadius: "7px",
    dark: true,
  },
};

/* ------------------------------------------------------------------ *
 * Content (typed arrays)
 * ------------------------------------------------------------------ */

const NAV = [
  { key: "about", label: "About" },
  { key: "work", label: "Work" },
  { key: "articles", label: "Articles" },
  { key: "schedule", label: "Schedule" },
  { key: "contact", label: "Contact" },
] as const;

type NavKey = (typeof NAV)[number]["key"];

const FOCUS = [
  "Distributed systems",
  "Developer tooling",
  "API & platform design",
  "Go · TypeScript · Postgres",
];

const WORK = [
  {
    period: "2023 — Now",
    role: "Senior Software Engineer · Vantage",
    desc: "Lead the backend for the data platform team. Own an ingestion pipeline processing 2B+ events a day and mentor a group of four engineers.",
  },
  {
    period: "2021 — 2023",
    role: "Software Engineer · Northwind Labs",
    desc: "Built the internal developer platform and CI tooling used by 200+ engineers, cutting average build times by roughly 40%.",
  },
  {
    period: "2019 — 2021",
    role: "Software Engineer · Rello",
    desc: "Full-stack work on the payments product. Designed and shipped the company's first public API.",
  },
];

const ARTICLES = [
  {
    title: "Designing idempotent APIs that don't lie",
    meta: "Jun 2026 · 8 min",
    blurb:
      "Retries are inevitable. Here's how to make sure they never corrupt your data.",
  },
  {
    title: "What I learned rewriting our ingestion pipeline in Go",
    meta: "Apr 2026 · 12 min",
    blurb:
      "A candid postmortem of a six-month rewrite — what paid off and what didn't.",
  },
  {
    title: "The case for boring infrastructure",
    meta: "Feb 2026 · 6 min",
    blurb:
      "Why the least exciting choice is often the one that lets you sleep at night.",
  },
  {
    title: "Testing distributed systems without losing your mind",
    meta: "Nov 2025 · 10 min",
    blurb:
      "Deterministic simulation, fault injection, and the tests that actually catch bugs.",
  },
];

const SLOTS = ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

const CONTACTS = [
  { label: "Email", value: "genna@hey.com", href: "mailto:genna@hey.com" },
  {
    label: "LinkedIn",
    value: "/in/gennacervantes",
    href: "https://www.linkedin.com/in/gennacervantes",
  },
  {
    label: "GitHub",
    value: "@gennacervantes",
    href: "https://github.com/gennacervantes",
  },
  { label: "X / Twitter", value: "@gennac", href: "https://x.com/gennac" },
];

/* ------------------------------------------------------------------ *
 * Font loading — inject Google Fonts links at runtime
 * ------------------------------------------------------------------ */

function loadFonts(fonts: string[]) {
  if (typeof document === "undefined") return;
  for (const name of fonts) {
    if (!name) continue;
    const id = "gf-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    const family = name.trim().replace(/\s+/g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }
}

/* ------------------------------------------------------------------ *
 * Restyle response validation
 * ------------------------------------------------------------------ */

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PX = /^\d+px$/;
const FALLBACKS = new Set(["serif", "sans-serif", "monospace"]);

type Restyled = { theme: Theme; fonts: string[] };

function validateRestyle(raw: string, current: Theme): Restyled {
  // Strip any markdown fences before parsing.
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(cleaned);
  } catch {
    // Last resort: pull the first {...} block out of the text.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse the theme.");
    data = JSON.parse(match[0]);
  }

  const hex = (key: keyof Theme, fallback: string) => {
    const v = data[key];
    return typeof v === "string" && HEX.test(v) ? v : fallback;
  };

  const fallback =
    typeof data.fontFallback === "string" && FALLBACKS.has(data.fontFallback)
      ? (data.fontFallback as string)
      : "sans-serif";

  const displayFont =
    typeof data.displayFont === "string" && data.displayFont.trim()
      ? data.displayFont.trim()
      : "";
  const bodyFont =
    typeof data.bodyFont === "string" && data.bodyFont.trim()
      ? data.bodyFont.trim()
      : "";

  const display = displayFont
    ? `'${displayFont}', ${fallback}`
    : current.display;
  const body = bodyFont ? `'${bodyFont}', ${fallback}` : current.body;

  let titleWeight = Number(data.titleWeight);
  if (!Number.isFinite(titleWeight)) titleWeight = current.titleWeight;
  titleWeight = Math.min(800, Math.max(400, Math.round(titleWeight)));

  const radius =
    typeof data.radius === "string" && PX.test(data.radius)
      ? data.radius
      : current.radius;
  const chipRadius =
    typeof data.chipRadius === "string" && PX.test(data.chipRadius)
      ? data.chipRadius
      : current.chipRadius;

  const vibe =
    typeof data.vibe === "string" && data.vibe.trim()
      ? data.vibe.trim()
      : "Custom";

  const theme: Theme = {
    label: vibe,
    bg: hex("bg", current.bg),
    surface: hex("surface", current.surface),
    text: hex("text", current.text),
    muted: hex("muted", current.muted),
    border: hex("border", current.border),
    accent: hex("accent", current.accent),
    accentText: hex("accentText", current.accentText),
    navActive: hex("navActive", current.navActive),
    display,
    body,
    titleWeight,
    radius,
    chipRadius,
    dark: typeof data.dark === "boolean" ? data.dark : current.dark,
  };

  return { theme, fonts: [displayFont, bodyFont].filter(Boolean) };
}

/* ------------------------------------------------------------------ *
 * History log
 * ------------------------------------------------------------------ */

const LOG_KEY = "pf-restyle-log";
const WIDTH_KEY = "pf-sidebar-w";

type LogEntry = { label: string; ts: number; theme: Theme; fonts: string[] };

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/* ------------------------------------------------------------------ *
 * Styles factory — every style object is derived from the theme
 * ------------------------------------------------------------------ */

function styles(t: Theme) {
  const s = {
    shell: {
      display: "flex",
      minHeight: "100vh",
      background: t.bg,
      color: t.text,
      fontFamily: t.body,
    } as CSSProperties,
    sidebar: {
      position: "sticky",
      top: 0,
      alignSelf: "flex-start",
      height: "100vh",
      overflowY: "auto",
      background: t.surface,
      borderRight: `1px solid ${t.border}`,
      display: "flex",
      flexDirection: "column",
      padding: "28px 22px",
      flexShrink: 0,
    } as CSSProperties,
    resizer: {
      width: 7,
      flexShrink: 0,
      cursor: "col-resize",
      background: "transparent",
    } as CSSProperties,
    main: {
      flex: 1,
      minWidth: 0,
      padding: "64px 80px",
    } as CSSProperties,
    brandName: {
      fontFamily: t.display,
      fontWeight: t.titleWeight,
      fontSize: 21,
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
    } as CSSProperties,
    brandRole: {
      marginTop: 6,
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: t.muted,
    } as CSSProperties,
    nav: {
      marginTop: 36,
      display: "flex",
      flexDirection: "column",
      gap: 2,
    } as CSSProperties,
    navItem: (active: boolean) =>
      ({
        appearance: "none",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: t.body,
        fontSize: 14,
        padding: "9px 12px",
        borderRadius: t.chipRadius,
        background: active ? t.navActive : "transparent",
        color: active ? t.accent : t.text,
        fontWeight: active ? 600 : 400,
      }) as CSSProperties,
    section: (last: boolean) =>
      ({
        maxWidth: 660,
        paddingBottom: last ? 0 : 56,
        marginBottom: last ? 0 : 56,
        borderBottom: last ? "none" : `1px solid ${t.border}`,
      }) as CSSProperties,
    eyebrow: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: t.accent,
    } as CSSProperties,
    title: {
      fontFamily: t.display,
      fontWeight: t.titleWeight,
      fontSize: 32,
      lineHeight: 1.1,
      letterSpacing: "-0.015em",
      margin: "14px 0 0",
    } as CSSProperties,
    lead: {
      fontFamily: t.body,
      fontSize: 16,
      lineHeight: 1.65,
      maxWidth: 560,
      opacity: 0.85,
      marginTop: 16,
    } as CSSProperties,
    card: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius,
      padding: 20,
    } as CSSProperties,
    chip: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: t.chipRadius,
      padding: "14px 16px",
      fontSize: 14,
    } as CSSProperties,
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 14,
    } as CSSProperties,
    accentButton: (disabled?: boolean) =>
      ({
        appearance: "none",
        border: `1px solid ${t.accent}`,
        borderRadius: t.chipRadius,
        background: disabled ? t.navActive : t.accent,
        color: disabled ? t.muted : t.accentText,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: t.body,
        fontSize: 14,
        fontWeight: 600,
        padding: "11px 18px",
      }) as CSSProperties,
    ghostButton: {
      appearance: "none",
      border: `1px solid ${t.border}`,
      borderRadius: t.chipRadius,
      background: "transparent",
      color: t.text,
      cursor: "pointer",
      fontFamily: t.body,
      fontSize: 13,
      fontWeight: 600,
      padding: "9px 16px",
    } as CSSProperties,
  };
  return s;
}

/* ------------------------------------------------------------------ *
 * Pazzazz panel
 * ------------------------------------------------------------------ */

function PazzazzPanel({
  t,
  onApply,
}: {
  t: Theme;
  onApply: (r: Restyled) => void;
}) {
  const st = styles(t);
  const [tab, setTab] = useState<"pazzazz" | "history">("pazzazz");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      if (raw) setLog(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const pushLog = useCallback((entry: LogEntry) => {
    setLog((prev) => {
      const next = [entry, ...prev].slice(0, 12);
      try {
        localStorage.setItem(LOG_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/restyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      const restyled = validateRestyle(data.raw as string, t);
      onApply(restyled);
      setNote(`Now showing: ${restyled.theme.label}`);
      pushLog({
        label: restyled.theme.label,
        ts: Date.now(),
        theme: restyled.theme,
        fonts: restyled.fonts,
      });
      setPrompt("");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, [prompt, busy, t, onApply, pushLog]);

  const tabBtn = (key: "pazzazz" | "history", label: string) =>
    ({
      appearance: "none",
      border: "none",
      cursor: "pointer",
      background: "transparent",
      fontFamily: t.body,
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 2px",
      color: tab === key ? t.accent : t.muted,
      borderBottom: `2px solid ${tab === key ? t.accent : "transparent"}`,
    }) as CSSProperties;

  return (
    <div
      style={{
        marginTop: "auto",
        paddingTop: 20,
        border: `1px solid ${t.border}`,
        borderRadius: t.radius,
        padding: 16,
        background: t.bg,
      }}
    >
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <button style={tabBtn("pazzazz", "✦ Pazzazz")} onClick={() => setTab("pazzazz")}>
          ✦ Pazzazz
        </button>
        <button style={tabBtn("history", "History")} onClick={() => setTab("history")}>
          History
        </button>
      </div>

      {tab === "pazzazz" ? (
        <div>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: t.muted, margin: "0 0 10px" }}>
            Reshape how this site looks — colors, fonts, the whole vibe. The words
            and content stay exactly as they are.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
            placeholder="e.g. warm & playful, terminal green, bold magazine…"
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              fontFamily: t.body,
              fontSize: 13,
              lineHeight: 1.5,
              padding: 10,
              borderRadius: t.chipRadius,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
            }}
          />
          <button
            style={{ ...st.accentButton(busy), width: "100%", marginTop: 10 }}
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Working…" : "Add pazzazz"}
          </button>
          {note && (
            <p style={{ fontSize: 11.5, lineHeight: 1.5, color: t.muted, margin: "10px 0 0" }}>
              {note}
            </p>
          )}
        </div>
      ) : (
        <div>
          {log.length === 0 ? (
            <p style={{ fontSize: 12, lineHeight: 1.5, color: t.muted, margin: 0 }}>
              No restyles yet — switch to Pazzazz and be the first.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {log.map((entry, i) => (
                <button
                  key={`${entry.ts}-${i}`}
                  onClick={() => {
                    loadFonts(entry.fonts);
                    onApply({ theme: entry.theme, fonts: entry.fonts });
                    setNote(`Now showing: ${entry.label}`);
                  }}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    border: `1px solid ${t.border}`,
                    borderRadius: t.chipRadius,
                    background: t.surface,
                    color: t.text,
                    fontFamily: t.body,
                    padding: "8px 10px",
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{entry.label}</span>
                  <span style={{ fontSize: 11, color: t.muted }}>
                    {relativeTime(entry.ts)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Scheduling widget
 * ------------------------------------------------------------------ */

const TODAY = new Date(2026, 6, 1); // July 1, 2026
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function Scheduler({ t }: { t: Theme }) {
  const st = styles(t);
  const [view, setView] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayMidnight = new Date(
    TODAY.getFullYear(),
    TODAY.getMonth(),
    TODAY.getDate()
  );

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const isDisabled = (date: Date) => {
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return true; // weekend
    if (date < todayMidnight) return true; // past
    return false;
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const reset = () => {
    setBooked(false);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  if (booked && selectedDate && selectedTime) {
    return (
      <div style={{ ...st.card, textAlign: "center", padding: 40 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: t.accent,
            color: t.accentText,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 700,
            margin: "0 auto",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontFamily: t.display,
            fontWeight: t.titleWeight,
            fontSize: 22,
            margin: "16px 0 6px",
          }}
        >
          You&apos;re booked in
        </h3>
        <p style={{ fontSize: 15, margin: 0 }}>
          {fmtDate(selectedDate)} at {selectedTime}
        </p>
        <p style={{ fontSize: 13.5, color: t.muted, margin: "10px 0 20px" }}>
          A calendar invite is on its way to your inbox.
        </p>
        <button style={st.ghostButton} onClick={reset}>
          Book another time
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 14,
      }}
    >
      {/* Calendar card */}
      <div style={st.card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <button
            aria-label="Previous month"
            style={{ ...st.ghostButton, padding: "4px 10px" }}
            onClick={() => setView(new Date(year, month - 1, 1))}
          >
            ‹
          </button>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {MONTHS[month]} {year}
          </span>
          <button
            aria-label="Next month"
            style={{ ...st.ghostButton, padding: "4px 10px" }}
            onClick={() => setView(new Date(year, month + 1, 1))}
          >
            ›
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 6,
          }}
        >
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: t.muted,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((date, i) => {
            if (!date) return <div key={`e-${i}`} />;
            const disabled = isDisabled(date);
            const selected = selectedDate && sameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                disabled={disabled}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
                style={{
                  appearance: "none",
                  border: "none",
                  aspectRatio: "1 / 1",
                  borderRadius: t.chipRadius,
                  fontFamily: t.body,
                  fontSize: 13,
                  cursor: disabled ? "default" : "pointer",
                  background: selected ? t.accent : "transparent",
                  color: selected
                    ? t.accentText
                    : disabled
                      ? t.muted
                      : t.text,
                  opacity: disabled ? 0.35 : 1,
                  fontWeight: selected ? 700 : 400,
                }}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot card */}
      <div style={st.card}>
        <h3
          style={{
            fontFamily: t.display,
            fontWeight: t.titleWeight,
            fontSize: 17,
            margin: "0 0 14px",
          }}
        >
          {selectedDate ? fmtDate(selectedDate) : "Available times"}
        </h3>

        {selectedDate ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SLOTS.map((slot) => {
              const active = selectedTime === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: t.body,
                    fontSize: 14,
                    padding: "10px 14px",
                    borderRadius: t.chipRadius,
                    border: `1px solid ${active ? t.accent : t.border}`,
                    background: active ? t.accent : t.surface,
                    color: active ? t.accentText : t.text,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: 13.5, color: t.muted, margin: 0 }}>
            Pick a day on the left to see open slots.
          </p>
        )}

        <button
          style={{
            ...st.accentButton(!selectedDate || !selectedTime),
            width: "100%",
            marginTop: 16,
          }}
          disabled={!selectedDate || !selectedTime}
          onClick={() => setBooked(true)}
        >
          {selectedTime ? "Confirm booking" : "Select a time"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

function Portfolio({
  startingStyle = "Editorial",
  showRestyle = true,
}: {
  startingStyle?: StartingStyle;
  showRestyle?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>(PRESETS[startingStyle]);
  const [active, setActive] = useState<NavKey>("about");
  const [sidebarW, setSidebarW] = useState(214);
  const draggingRef = useRef(false);

  const st = styles(theme);

  // Restore persisted sidebar width.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WIDTH_KEY);
      if (raw) {
        const w = parseInt(raw, 10);
        if (!Number.isNaN(w)) setSidebarW(Math.min(340, Math.max(180, w)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Scroll-spy: whichever section top is <= 150px becomes active.
  useEffect(() => {
    const onScroll = () => {
      let current: NavKey = NAV[0].key;
      for (const { key } of NAV) {
        const el = document.getElementById(key);
        if (el && el.getBoundingClientRect().top <= 150) current = key;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sidebar resize.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const w = Math.min(340, Math.max(180, e.clientX));
      setSidebarW(w);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = "";
      try {
        setSidebarW((w) => {
          localStorage.setItem(WIDTH_KEY, String(w));
          return w;
        });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const scrollTo = (key: NavKey) => {
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth" });
  };

  const applyRestyle = useCallback((r: Restyled) => {
    loadFonts(r.fonts);
    setTheme(r.theme);
  }, []);

  const [resizerHover, setResizerHover] = useState(false);

  return (
    <div style={st.shell}>
      {/* Sidebar */}
      <aside style={{ ...st.sidebar, width: sidebarW }}>
        <div>
          <div style={st.brandName}>Genna Cervantes</div>
          <div style={st.brandRole}>Software Engineer</div>
        </div>

        <nav style={st.nav}>
          {NAV.map(({ key, label }) => (
            <button
              key={key}
              style={st.navItem(active === key)}
              onClick={() => scrollTo(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {showRestyle && <PazzazzPanel t={theme} onApply={applyRestyle} />}
      </aside>

      {/* Resizer */}
      <div
        style={{
          ...st.resizer,
          background: resizerHover ? theme.border : "transparent",
        }}
        onMouseEnter={() => setResizerHover(true)}
        onMouseLeave={() => setResizerHover(false)}
        onMouseDown={() => {
          draggingRef.current = true;
          document.body.style.userSelect = "none";
        }}
      />

      {/* Main */}
      <main style={st.main}>
        {/* About */}
        <section id="about" style={st.section(false)}>
          <div style={st.eyebrow}>About</div>
          <h1 style={st.title}>I build the quiet parts of software well.</h1>
          <p style={st.lead}>
            I&apos;m a software engineer who gravitates toward the unglamorous
            layer of a product — the pipelines, APIs, and tooling that everything
            else quietly depends on. Six years in, I still believe the best
            systems are the ones you rarely have to think about.
          </p>
          <div style={{ ...st.grid2, marginTop: 24 }}>
            {FOCUS.map((f) => (
              <div key={f} style={st.chip}>
                {f}
              </div>
            ))}
          </div>
        </section>

        {/* Work */}
        <section id="work" style={st.section(false)}>
          <div style={st.eyebrow}>Experience</div>
          <h2 style={st.title}>Where I&apos;ve worked</h2>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 26 }}>
            {WORK.map((job) => (
              <div key={job.role} style={{ display: "flex", gap: 20 }}>
                <div
                  style={{
                    width: 128,
                    flexShrink: 0,
                    fontSize: 13,
                    color: theme.muted,
                    fontWeight: 600,
                  }}
                >
                  {job.period}
                </div>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 600 }}>{job.role}</div>
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.6,
                      color: theme.muted,
                      margin: "6px 0 0",
                    }}
                  >
                    {job.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Articles */}
        <section id="articles" style={st.section(false)}>
          <div style={st.eyebrow}>Writing</div>
          <h2 style={st.title}>Articles &amp; notes</h2>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
            {ARTICLES.map((a, i) => (
              <a
                key={a.title}
                href="#articles"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  padding: "18px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${theme.border}`,
                  display: "block",
                }}
              >
                <div style={{ fontSize: 12, color: theme.muted }}>{a.meta}</div>
                <div
                  style={{
                    fontFamily: theme.display,
                    fontWeight: theme.titleWeight,
                    fontSize: 19,
                    margin: "6px 0 6px",
                    lineHeight: 1.2,
                  }}
                >
                  {a.title}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: theme.muted }}>
                  {a.blurb}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Schedule */}
        <section id="schedule" style={st.section(false)}>
          <div style={st.eyebrow}>Schedule</div>
          <h2 style={st.title}>Book a 30-min intro call</h2>
          <p style={st.lead}>Grab a slot below — 30 minutes, no agenda required.</p>
          <div style={{ marginTop: 24 }}>
            <Scheduler t={theme} />
          </div>
        </section>

        {/* Contact */}
        <section id="contact" style={st.section(true)}>
          <div style={st.eyebrow}>Contact</div>
          <h2 style={st.title}>Let&apos;s talk</h2>
          <p style={st.lead}>
            Whether it&apos;s a role, a collaboration, or just to compare notes —
            I read everything that lands in my inbox.
          </p>
          <div style={{ ...st.grid2, marginTop: 24 }}>
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                style={{ ...st.card, textDecoration: "none", color: "inherit", display: "block" }}
              >
                <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.accent }}>
                  {c.value}
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/* The App Router page entry. Configure the portfolio here — `startingStyle`
   is one of "Editorial" | "Technical" | "Bold", and `showRestyle` toggles the
   Pazzazz panel. */
export default function Page() {
  return <Portfolio startingStyle="Editorial" showRestyle />;
}
