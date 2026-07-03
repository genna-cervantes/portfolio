import { promises as fs } from "fs";
import path from "path";

export type ThoughtMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

export type ThoughtHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export type Thought = ThoughtMeta & {
  html: string;
  headings: ThoughtHeading[];
};

const THOUGHTS_DIR = path.join(process.cwd(), "content", "thoughts");

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.split(/:\s*(.*)/s).slice(0, 2))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key.trim(), value.trim()])
  );

  return { meta, body: match[2] };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split("\n");
  const html: string[] = [];
  const headings: ThoughtHeading[] = [];
  let listOpen = false;

  const closeList = () => {
    if (!listOpen) return;
    html.push("</ul>");
    listOpen = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith("# ")) {
      closeList();
      const text = trimmed.slice(2);
      html.push(`<h1>${renderInline(text)}</h1>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeList();
      const text = trimmed.slice(3);
      const id = slugify(text);
      headings.push({ id, level: 2, text });
      html.push(`<h2 id="${id}">${renderInline(text)}</h2>`);
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      const text = trimmed.slice(4);
      const id = slugify(text);
      headings.push({ id, level: 3, text });
      html.push(`<h3 id="${id}">${renderInline(text)}</h3>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(trimmed)}</p>`);
  }

  closeList();
  return { html: html.join("\n"), headings };
}

export async function getThoughtSlugs() {
  const files = await fs.readdir(THOUGHTS_DIR);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export async function getThought(slug: string): Promise<Thought> {
  const filePath = path.join(THOUGHTS_DIR, `${slug}.md`);
  const raw = await fs.readFile(filePath, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const rendered = markdownToHtml(body);

  return {
    slug,
    title: meta.title || slug,
    date: meta.date || "",
    description: meta.description || "",
    html: rendered.html,
    headings: rendered.headings,
  };
}

export async function getThoughts(): Promise<ThoughtMeta[]> {
  const slugs = await getThoughtSlugs();
  const thoughts = await Promise.all(slugs.map((slug) => getThought(slug)));

  return thoughts
    .map(({ slug, title, date, description }) => ({
      slug,
      title,
      date,
      description,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
