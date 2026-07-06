"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NoteHeading } from "@/lib/notes";

export default function ArticleNav({ headings }: { headings: NoteHeading[] }) {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const ids = ["top", ...headings.map((heading) => heading.id)];

    const onScroll = () => {
      let current = "top";

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

  return (
    <nav className="notes-nav" aria-label="Article sections">
      <Link className="notes-back-link" href="/#articles">
        ← All notes
      </Link>
      <a className={active === "top" ? "is-active" : ""} href="#top">
        Overview
      </a>
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
