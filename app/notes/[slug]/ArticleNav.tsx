"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NoteHeading } from "@/lib/notes";

const THEME_STORAGE_KEY = "portfolio-theme";

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20.5 15.6A8.6 8.6 0 0 1 8.4 3.5 8.6 8.6 0 1 0 20.5 15.6Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
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
      <button
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        className="notes-theme-toggle"
        onClick={toggleDarkMode}
        type="button"
      >
        {darkMode ? <SunIcon /> : <MoonIcon />}
      </button>
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
    </nav>
  );
}
