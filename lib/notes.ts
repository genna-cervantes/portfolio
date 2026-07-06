import { promises as fs } from "fs";
import path from "path";

export type NoteMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

export type NoteHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export type Note = NoteMeta & {
  content: string;
  headings: NoteHeading[];
};

const NOTES_DIR = path.join(process.cwd(), "content", "notes");

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractHeadings(markdown: string) {
  const headings: NoteHeading[] = [];

  for (const line of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const text = match[2]
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .trim();
    headings.push({
      id: slugify(text),
      level: match[1].length as 2 | 3,
      text,
    });
  }

  return headings;
}

export async function getNoteSlugs() {
  const files = await fs.readdir(NOTES_DIR);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export async function getNote(slug: string): Promise<Note> {
  const filePath = path.join(NOTES_DIR, `${slug}.md`);
  const raw = await fs.readFile(filePath, "utf8");
  const { meta, body } = parseFrontmatter(raw);

  return {
    slug,
    title: meta.title || slug,
    date: meta.date || "",
    description: meta.description || "",
    content: body,
    headings: extractHeadings(body),
  };
}

export async function getNotes(): Promise<NoteMeta[]> {
  const slugs = await getNoteSlugs();
  const notes = await Promise.all(slugs.map((slug) => getNote(slug)));

  return notes
    .map(({ slug, title, date, description }) => ({
      slug,
      title,
      date,
      description,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
