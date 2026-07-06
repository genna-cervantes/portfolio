import { notFound } from "next/navigation";
import { getNote, getNoteSlugs } from "@/lib/notes";
import ArticleNav from "./ArticleNav";

export async function generateStaticParams() {
  const slugs = await getNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const note = await getNote(slug);
    return {
      title: `${note.title} - Genna Cervantes`,
      description: note.description,
    };
  } catch {
    return {};
  }
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let note;

  try {
    note = await getNote(slug);
  } catch {
    notFound();
  }

  return (
    <div className="notes-shell">
      <aside className="notes-sidebar">
        <ArticleNav headings={note.headings} />
      </aside>

      <main className="notes-page">
        <header className="notes-header">
          <div className="notes-title">{note.title}</div>
          <div className="notes-date">{note.date}</div>
        </header>
        <article id="top">
          <div
            className="notes-content"
            dangerouslySetInnerHTML={{ __html: note.html }}
          />
        </article>
      </main>
    </div>
  );
}
