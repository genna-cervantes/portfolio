"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NoteHeading } from "@/lib/notes";

const THEME_STORAGE_KEY = "portfolio-theme";

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

export default function ArticleNav({ headings }: { headings: NoteHeading[] }) {
  const [active, setActive] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const ids = headings.map((heading) => heading.id);

    const onScroll = () => {
      let current = "";

      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }

      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  useEffect(() => {
    try {
      setDarkMode(localStorage.getItem(THEME_STORAGE_KEY) === "dark");
    } catch {
      setDarkMode(document.documentElement.dataset.theme === "dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <nav className="notes-nav" aria-label="Article sections">
      <Link className="notes-back-link" href="/#articles">
        ← All notes
      </Link>
      {headings.map((heading) => (
        <a
          key={heading.id}
          className={[
            heading.level === 3 ? "notes-nav-nested" : "",
            active === heading.id ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          href={`#${heading.id}`}
        >
          {heading.text}
        </a>
      ))}
      <button
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        className="notes-theme-toggle"
        onClick={toggleDarkMode}
        type="button"
      >
        {darkMode ? <SunIcon /> : <MoonIcon />}
      </button>
    </nav>
  );
}
