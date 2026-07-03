import { notFound } from "next/navigation";
import { getThought, getThoughtSlugs } from "@/lib/thoughts";
import ArticleNav from "./ArticleNav";

export async function generateStaticParams() {
  const slugs = await getThoughtSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const thought = await getThought(slug);
    return {
      title: `${thought.title} - Genna Cervantes`,
      description: thought.description,
    };
  } catch {
    return {};
  }
}

export default async function ThoughtPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let thought;

  try {
    thought = await getThought(slug);
  } catch {
    notFound();
  }

  return (
    <div className="thought-shell">
      <aside className="thought-sidebar">
        <ArticleNav headings={thought.headings} />
      </aside>

      <main className="thought-page">
        <article id="top">
          <div className="thought-date">{thought.date}</div>
          <div
            className="thought-content"
            dangerouslySetInnerHTML={{ __html: thought.html }}
          />
        </article>
      </main>
    </div>
  );
}
