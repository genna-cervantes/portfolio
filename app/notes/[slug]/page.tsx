import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getNote, getNoteSlugs } from "@/lib/notes";
import ArticleNav from "./ArticleNav";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function textFromChildren(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(textFromChildren).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return textFromChildren(
      (children as React.ReactElement<{ children?: React.ReactNode }>).props
        .children
    );
  }

  return "";
}

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
        <article id="top" className="notes-content">
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1>{children}</h1>,
              h2: ({ children }) => {
                const id = slugify(textFromChildren(children));
                return <h2 id={id}>{children}</h2>;
              },
              h3: ({ children }) => {
                const id = slugify(textFromChildren(children));
                return <h3 id={id}>{children}</h3>;
              },
            }}
          >
            {note.content}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
