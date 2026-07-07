"use client";

import { CSSProperties, useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Theme system — a single object drives every color, font, and radius
 * ------------------------------------------------------------------ */

export type Theme = {
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

const THEME_STORAGE_KEY = "portfolio-theme";

export const PRESETS: Record<StartingStyle, Theme> = {
  Editorial: {
    label: "Editorial",
    bg: "#f5ebee",
    surface: "#fff8fa",
    text: "#24191d",
    muted: "#87747b",
    border: "#e6d6dc",
    accent: "#7f4054",
    accentText: "#fff8fa",
    navActive: "#ecdee3",
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

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.6 14.5A8.4 8.4 0 0 1 9.5 3.4 8.9 8.9 0 1 0 20.6 14.5Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

const DARK_EDITORIAL: Theme = {
  label: "Dark Editorial",
  bg: "#111114",
  surface: "#1d1d22",
  text: "#f7f3f5",
  muted: "#c7bcc2",
  border: "#3a343a",
  accent: "#f0a8bd",
  accentText: "#171014",
  navActive: "#33242b",
  display: "'Newsreader', serif",
  body: "'Instrument Sans', sans-serif",
  titleWeight: 500,
  radius: "14px",
  chipRadius: "8px",
  dark: true,
};

/* ------------------------------------------------------------------ *
 * Content (typed arrays)
 * ------------------------------------------------------------------ */

const NAV = [
  { key: "about", label: "About" },
  { key: "work", label: "Work" },
  { key: "articles", label: "Notes" },
  // { key: "schedule", label: "Schedule" },
  { key: "contact", label: "Contact" },
] as const;

type NavKey = (typeof NAV)[number]["key"];

const FOCUS = [
  "Full-stack development",
  "AI systems",
  "Developer experience",
  "ML & data exploration",
];

const WORK = [
  {
    period: "Jan 2026 - Present",
    role: "Junior Software Engineer · oboda",
    bullets: [
      "Built AI and core product features while improving the engineering platform through release automation, CI/CD optimizations, and developer tooling. Regularly handled production incidents as part of the on-call rotation, delivering reliable fixes for critical customer issues.",
    ],
  },
  {
    period: "Jan 2026 - Apr 2026",
    role: "Post Trade Engineer Intern · Macquarie Group",
    bullets: [
      "Developed internal automation for service monitoring and scheduled workflows using Python and Java, reducing manual operational work and improving visibility across enterprise applications.",
    ],
  },
  {
    period: "Jul 2025 - Dec 2025",
    role: "Full Stack Developer Intern · Kippap Learning Corporation",
    bullets: [
      "Designed and built an AI evaluation framework to benchmark new AI products, while delivering full-stack product features including discount systems and secure digital contract signing.",
    ],
  },
  {
    period: "Mar 2025 - Aug 2025",
    role: "Full Stack Developer Intern · Kapiton",
    bullets: [
      "Led the frontend modernization from Laravel to React by establishing scalable architecture, introducing standardized engineering patterns, and integrating modern data-fetching infrastructure.",
    ],
  },
  {
    period: "Sep 2024 - Dec 2024",
    role: "Software Engineer · Dormy PH",
    bullets: [
      "Designed and developed serverless backend services, including analytics and data validation systems, while re-architecting search to improve application performance and data consistency.",
    ],
  },
];

type NotePreview = {
  slug: string;
  title: string;
  date: string;
  description: string;
  readTime: string;
};

function formatNoteDate(date: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SLOTS = ["8:00 AM", "8:30 AM", "5:00 PM", "5:30 PM"];

const CONTACTS = [
  {
    label: "Email",
    value: "gennacervantes9@gmail.com",
    href: "mailto:gennacervantes9@gmail.com",
  },
  {
    label: "GitHub",
    value: "github.com/genna-cervantes",
    href: "https://github.com/genna-cervantes",
  },
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
      colorScheme: t.dark ? "dark" : "light",
      fontFamily: t.body,
    } as CSSProperties,
    sidebar: {
      position: "sticky",
      top: 0,
      alignSelf: "flex-start",
      height: "100vh",
      overflowY: "auto",
      background: t.bg,
      display: "flex",
      flexDirection: "column",
      padding: "28px 22px",
      flexShrink: 0,
    } as CSSProperties,
    main: {
      flex: 1,
      minWidth: 0,
      padding: "0 80px 64px",
    } as CSSProperties,
    header: {
      position: "sticky",
      top: 0,
      zIndex: 6,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      padding: "26px 0 44px",
      marginBottom: 14,
      background: `linear-gradient(${t.bg} 0%, ${t.bg} 62%, ${t.bg}00 100%)`,
      pointerEvents: "none",
    } as CSSProperties,
    brandName: {
      fontFamily: t.display,
      fontWeight: t.titleWeight,
      fontSize: 21,
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
      color: t.accent,
    } as CSSProperties,
    brandRole: {
      marginTop: 6,
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: t.muted,
    } as CSSProperties,
    headerTop: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 18,
      width: "100%",
      pointerEvents: "auto",
    } as CSSProperties,
    modeButton: {
      appearance: "none",
      border: "none",
      borderRadius: "50%",
      background: "transparent",
      color: t.muted,
      cursor: "pointer",
      fontFamily: t.body,
      fontSize: 18,
      fontWeight: 700,
      width: 30,
      height: 30,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
      padding: 0,
    } as CSSProperties,
    nav: {
      marginTop: "auto",
      marginBottom: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      alignItems: "flex-end",
    } as CSSProperties,
    navItem: (active: boolean) =>
      ({
        appearance: "none",
        border: "none",
        textAlign: "right",
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
      color: t.dark ? t.muted : t.text,
      fontSize: 16,
      lineHeight: 1.65,
      maxWidth: 560,
      marginTop: 16,
    } as CSSProperties,
    card: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius,
      padding: 20,
      overflowWrap: "anywhere",
    } as CSSProperties,
    chip: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: t.chipRadius,
      padding: "14px 16px",
      fontSize: 14,
      overflowWrap: "anywhere",
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
    pazzazzDock: {
      position: "fixed",
      right: 24,
      bottom: 24,
      zIndex: 20,
      width: 320,
      maxWidth: "calc(100vw - 48px)",
      boxShadow: t.dark
        ? "0 18px 60px rgba(0, 0, 0, 0.28)"
        : "0 18px 60px rgba(80, 45, 56, 0.16)",
      borderRadius: t.radius,
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
        <button
          style={tabBtn("pazzazz", "✦ Pazzazz")}
          onClick={() => setTab("pazzazz")}
        >
          ✦ Pazzazz
        </button>
        <button
          style={tabBtn("history", "History")}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>

      {tab === "pazzazz" ? (
        <div>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: t.muted,
              margin: "0 0 10px",
            }}
          >
            Reshape how this site looks — colors, fonts, the whole vibe. The
            words and content stay exactly as they are.
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
            <p
              style={{
                fontSize: 11.5,
                lineHeight: 1.5,
                color: t.muted,
                margin: "10px 0 0",
              }}
            >
              {note}
            </p>
          )}
        </div>
      ) : (
        <div>
          {log.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                color: t.muted,
                margin: 0,
              }}
            >
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
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {entry.label}
                  </span>
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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function slotToDate(date: Date, slot: string) {
  const match = slot.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return date;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  );
}

function googleCalendarTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function googleCalendarLink(start: Date) {
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Intro call with Genna Cervantes",
    dates: `${googleCalendarTimestamp(start)}/${googleCalendarTimestamp(end)}`,
    details: "30-minute intro call",
    location: "Google Meet",
    add: "gennacervantes9@gmail.com",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function readJsonResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function Scheduler({ t }: { t: Theme }) {
  const st = styles(t);
  const [isCompact, setIsCompact] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [unavailableStarts, setUnavailableStarts] = useState<string[]>([]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const sync = () => setIsCompact(window.innerWidth <= 760);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings");
        if (!res.ok) return;
        const data = await readJsonResponse(res);
        const starts = Array.isArray(data?.bookings)
          ? data.bookings
              .map((booking: { start?: unknown }) =>
                typeof booking.start === "string" ? booking.start : "",
              )
              .filter(Boolean)
          : [];

        if (!cancelled) setUnavailableStarts(starts);
      } catch {
        /* ignore */
      }
    }

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, []);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const isDisabled = (date: Date) => {
    const dow = date.getDay();
    if (dow === 0) return true; // Sunday
    if (date < todayMidnight) return true; // past
    return false;
  };

  const isSlotDisabled = (slot: string) => {
    if (!selectedDate) return true;
    if (!sameDay(selectedDate, now)) return false;
    return slotToDate(selectedDate, slot) <= now;
  };

  const isSlotBooked = (slot: string) => {
    if (!selectedDate) return false;
    return unavailableStarts.includes(
      slotToDate(selectedDate, slot).toISOString(),
    );
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const openCalendarLink = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      isSlotDisabled(selectedTime) ||
      isSlotBooked(selectedTime)
    ) {
      return;
    }

    const start = slotToDate(selectedDate, selectedTime);
    setBookingBusy(true);
    setBookingMessage("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: start.toISOString() }),
      });
      const data = await readJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.error || "Could not reserve that slot.");
      }

      window.open(googleCalendarLink(start), "_blank", "noopener,noreferrer");
      setBookingMessage("Slot reserved. Finish saving it in Google Calendar.");
      setUnavailableStarts((current) =>
        current.includes(start.toISOString())
          ? current
          : [...current, start.toISOString()],
      );
    } catch (error) {
      setBookingMessage(
        error instanceof Error ? error.message : "Could not reserve that slot.",
      );
    } finally {
      setBookingBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isCompact ? "1fr" : "repeat(2, minmax(0, 1fr))",
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
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
                  setBookingMessage("");
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
                  color: selected ? t.accentText : disabled ? t.muted : t.text,
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
              const booked = isSlotBooked(slot);
              const disabled = isSlotDisabled(slot) || booked;
              return (
                <button
                  key={slot}
                  disabled={disabled}
                  onClick={() => {
                    setSelectedTime(slot);
                    setBookingMessage("");
                  }}
                  style={{
                    appearance: "none",
                    cursor: disabled ? "default" : "pointer",
                    textAlign: "left",
                    fontFamily: t.body,
                    fontSize: 14,
                    padding: "10px 14px",
                    borderRadius: t.chipRadius,
                    border: `1px solid ${active ? t.accent : t.border}`,
                    background: active ? t.accent : t.surface,
                    color: active ? t.accentText : disabled ? t.muted : t.text,
                    opacity: disabled ? 0.38 : 1,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {booked ? `${slot} · booked` : slot}
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
            ...st.accentButton(
              bookingBusy ||
                !selectedDate ||
                !selectedTime ||
                isSlotDisabled(selectedTime) ||
                isSlotBooked(selectedTime),
            ),
            width: "100%",
            marginTop: 16,
          }}
          disabled={
            bookingBusy ||
            !selectedDate ||
            !selectedTime ||
            isSlotDisabled(selectedTime) ||
            isSlotBooked(selectedTime)
          }
          onClick={openCalendarLink}
        >
          {bookingBusy
            ? "Reserving..."
            : selectedTime
              ? "Add to Google Calendar"
              : "Select a time"}
        </button>
        {bookingMessage && (
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: t.muted,
              margin: "10px 0 0",
            }}
          >
            {bookingMessage}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

function Portfolio({
  startingStyle = "Editorial",
}: {
  startingStyle?: StartingStyle;
}) {
  const baseTheme = PRESETS[startingStyle];
  const [theme, setTheme] = useState<Theme>(baseTheme);
  const [darkMode, setDarkMode] = useState(false);
  const [active, setActive] = useState<NavKey>("about");
  const [isCompact, setIsCompact] = useState(false);
  const [notes, setNotes] = useState<NotePreview[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);

  const st = styles(theme);

  useEffect(() => {
    document.documentElement.style.background = theme.bg;
    document.body.style.background = theme.bg;
    document.documentElement.dataset.theme = theme.dark ? "dark" : "light";

    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, [theme.bg, theme.dark]);

  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === "dark") {
        setDarkMode(true);
        setTheme(DARK_EDITORIAL);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const sync = () => setIsCompact(window.innerWidth <= 760);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      try {
        const res = await fetch("/api/notes");
        if (!res.ok) throw new Error("Could not load notes.");
        const data = (await res.json()) as NotePreview[];
        if (!cancelled) setNotes(data);
      } catch {
        if (!cancelled) setNotes([]);
      } finally {
        if (!cancelled) setNotesLoaded(true);
      }
    }

    loadNotes();
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll-spy: whichever section top is <= 150px becomes active.
  useEffect(() => {
    const onScroll = () => {
      let current: NavKey = NAV[0].key;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(NAV[NAV.length - 1].key);
        return;
      }
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

  const scrollTo = (key: NavKey) => {
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      setTheme(next ? DARK_EDITORIAL : baseTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div
      style={{ ...st.shell, display: isCompact ? "block" : st.shell.display }}
    >
      {/* Sidebar */}
      <aside
        style={{
          ...st.sidebar,
          width: isCompact ? "auto" : 310,
          height: isCompact ? "auto" : st.sidebar.height,
          padding: isCompact ? "14px 18px" : st.sidebar.padding,
          zIndex: isCompact ? 10 : undefined,
          borderBottom: isCompact ? `1px solid ${theme.border}` : "none",
        }}
      >
        <nav
          style={{
            ...st.nav,
            alignItems: isCompact ? "center" : st.nav.alignItems,
            flexDirection: isCompact ? "row" : st.nav.flexDirection,
            justifyContent: isCompact ? "flex-start" : undefined,
            marginTop: isCompact ? 0 : st.nav.marginTop,
            marginBottom: isCompact ? 0 : st.nav.marginBottom,
            overflowX: isCompact ? "auto" : undefined,
            paddingBottom: isCompact ? 2 : undefined,
          }}
        >
          {NAV.map(({ key, label }) => (
            <button
              key={key}
              style={{
                ...st.navItem(active === key),
                flex: isCompact ? "0 0 auto" : undefined,
                textAlign: isCompact ? "left" : "right",
              }}
              onClick={() => scrollTo(key)}
            >
              {label}
            </button>
          ))}
          <button
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            style={{
              ...st.modeButton,
              flex: isCompact ? "0 0 auto" : undefined,
              marginTop: isCompact ? 0 : st.modeButton.marginTop,
            }}
            onClick={toggleDarkMode}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main
        style={{
          ...st.main,
          padding: isCompact ? "0 22px 48px" : st.main.padding,
        }}
      >
        <header
          style={{
            ...st.header,
            padding: isCompact ? "22px 0 34px" : st.header.padding,
          }}
        >
          <div style={st.headerTop}>
            <div>
              <div style={st.brandName}>Genna B. Cervantes</div>
              <div style={st.brandRole}>Software Engineer</div>
            </div>
          </div>
        </header>

        {/* About */}
        <section id="about" style={st.section(false)}>
          <div style={st.eyebrow}>About</div>
          <h1
            style={{
              ...st.title,
              fontSize: isCompact ? 28 : st.title.fontSize,
            }}
          >
            Building What&apos;s Next
          </h1>
          <p style={st.lead}>
            I enjoy turning ideas into software, from full-stack applications to
            AI-powered tools and the infrastructure behind them. I care about
            building reliable, scalable systems with a focus on dev ex,
            performance, and engineering efficiency. Outside of work, I enjoy
            exploring data and machine learning, driven by curiosity and a
            constant desire to build better software.
          </p>
          <div
            style={{
              ...st.grid2,
              gridTemplateColumns: isCompact
                ? "1fr"
                : st.grid2.gridTemplateColumns,
              marginTop: 24,
            }}
          >
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
          <h2
            style={{
              ...st.title,
              fontSize: isCompact ? 27 : st.title.fontSize,
            }}
          >
            Where I&apos;ve worked
          </h2>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexDirection: "column",
              gap: 26,
            }}
          >
            {WORK.map((job) => (
              <div
                key={job.role}
                style={{
                  display: "grid",
                  gridTemplateColumns: isCompact
                    ? "1fr"
                    : "128px minmax(0, 1fr)",
                  columnGap: isCompact ? 0 : 20,
                  rowGap: isCompact ? 4 : 0,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: theme.muted,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    paddingTop: isCompact ? 0 : 2,
                  }}
                >
                  {job.period}
                </div>
                <div
                  style={{
                    fontSize: 15.5,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    overflowWrap: "anywhere",
                  }}
                >
                  {job.role}
                </div>
                <ul
                  style={{
                    gridColumn: "1 / -1",
                    paddingLeft: isCompact ? 18 : 44,
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    color: theme.muted,
                    margin: "8px 0 0",
                  }}
                >
                  {job.bullets.map((bullet) => (
                    <li key={bullet} style={{ marginTop: 6 }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Articles */}
        <section id="articles" style={st.section(false)}>
          <div style={st.eyebrow}>Writing</div>
          <h2
            style={{
              ...st.title,
              fontSize: isCompact ? 27 : st.title.fontSize,
            }}
          >
            Engineering Notes
          </h2>
          <div
            style={{ marginTop: 24, display: "flex", flexDirection: "column" }}
          >
            {!notesLoaded && (
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: theme.muted,
                  margin: 0,
                }}
              >
                Loading notes...
              </p>
            )}
            {notesLoaded && notes.length === 0 && (
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: theme.muted,
                  margin: 0,
                }}
              >
                No notes published yet.
              </p>
            )}
            {notes.map((note, i) => (
              <a
                key={note.slug}
                href={`/notes/${note.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  padding: "18px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${theme.border}`,
                  display: "grid",
                  gridTemplateColumns: isCompact
                    ? "1fr"
                    : "90px minmax(0, 1fr)",
                  columnGap: isCompact ? 0 : 8,
                  rowGap: isCompact ? 6 : 0,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: theme.muted,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    paddingTop: isCompact ? 0 : 2,
                  }}
                >
                  {formatNoteDate(note.date)}
                </div>
                <div
                  style={{
                    fontSize: 15.5,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    overflowWrap: "anywhere",
                  }}
                >
                  {note.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gridColumn: "1 / -1",
                  }}
                >
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      paddingLeft: isCompact ? 0 : 44,
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: theme.muted,
                      marginTop: 8,
                      flex: 1
                    }}
                  >
                    {note.description}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.muted,
                      paddingLeft: isCompact ? 0 : 44,
                      fontStyle: "italic",
                      marginTop: 6,
                    }}
                  >
                    {note.readTime}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Schedule */}
        {/* <section id="schedule" style={st.section(false)}>
          <div style={st.eyebrow}>Schedule</div>
          <h2 style={{ ...st.title, fontSize: isCompact ? 27 : st.title.fontSize }}>
            Book a 30-min intro call
          </h2>
          <p style={st.lead}>Grab a slot below, no agenda required :)</p>
          <div style={{ marginTop: 24 }}>
            <Scheduler t={theme} />
          </div>
        </section> */}

        {/* Contact */}
        <section id="contact" style={st.section(true)}>
          <div style={st.eyebrow}>Contact</div>
          <h2
            style={{
              ...st.title,
              fontSize: isCompact ? 27 : st.title.fontSize,
            }}
          >
            Get in touch
          </h2>
          <p style={st.lead}>Reach me through email or GitHub.</p>
          <div
            style={{
              ...st.grid2,
              gridTemplateColumns: isCompact
                ? "1fr"
                : st.grid2.gridTemplateColumns,
              marginTop: 24,
            }}
          >
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                style={{
                  ...st.card,
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div
                  style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}
                >
                  {c.label}
                </div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: theme.accent }}
                >
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
   is one of "Editorial" | "Technical" | "Bold". */
export default function Page() {
  return <Portfolio startingStyle="Editorial" />;
}
