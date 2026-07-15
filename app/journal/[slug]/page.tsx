import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import { getArticle, getArticles, relatedArticles, formatDate, cfImg, type Block } from "@/lib/journal-helpers";
import { getBySlug, statusPill, type Community } from "@/lib/communities";

export const revalidate = 3600;

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "The Journal — LiveModern" };
  return {
    title: `${a.title} — LiveModern Journal`,
    description: a.dek,
    openGraph: {
      title: a.title,
      description: a.dek,
      type: "article",
      images: a.hero ? [{ url: a.hero }] : undefined,
    },
  };
}

function Body({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h")
          return (
            <h2 key={i} className="serif jr-h">
              {b.text}
            </h2>
          );
        if (b.type === "quote")
          return (
            <blockquote key={i} className="jr-quote">
              <p className="serif">{b.text}</p>
              {b.cite ? <cite>{b.cite}</cite> : null}
            </blockquote>
          );
        if (b.type === "image")
          return (
            <figure key={i} className="jr-fig">
              <img src={cfImg(b.src, 1400)} alt={b.caption ?? ""} loading="lazy" />
              {b.caption ? <figcaption>{b.caption}</figcaption> : null}
            </figure>
          );
        return (
          <p key={i} className="jr-p">
            {b.text}
          </p>
        );
      })}
    </>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const featured = (a.featuredBuildings ?? [])
    .map(getBySlug)
    .filter(Boolean) as Community[];
  const related = relatedArticles(a, 2);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.dek,
    image: a.hero || undefined,
    datePublished: a.date,
    author: { "@type": "Organization", name: a.author },
    publisher: {
      "@type": "Organization",
      name: "LiveModern by Modern Living Group",
    },
    articleSection: a.category,
  };

  return (
    <>
      <Masthead active="journal" loginBand />

      {/* crumb */}
      <div className="wrap">
        <p className="crumb">
          <Link href="/journal">Journal</Link>
          <span className="sl">/</span>
          <span>{a.category}</span>
        </p>
      </div>

      {/* HEADER */}
      <div className="wrap">
        <header className="jr-head">
          <p className="jr-cat">{a.category}</p>
          <h1 className="serif">{a.title}</h1>
          <p className="jr-dek jr-dek-lg">{a.dek}</p>
          <p className="jr-meta">
            {a.author} &middot; {formatDate(a.date)} &middot; {a.readMinutes} min read
          </p>
        </header>
      </div>

      {/* LEAD — video if present, else hero image */}
      <div className="wrap">
        {a.videoId ? (
          <div className="jr-video">
            <iframe
              src={`https://www.youtube.com/embed/${a.videoId}`}
              title={a.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <figure className="jr-hero">
            <img src={cfImg(a.hero, 1800)} alt={a.title} loading="eager" />
          </figure>
        )}
      </div>

      {/* BODY */}
      <div className="wrap">
        <article className="jr-article">
          <Body blocks={a.body} />
        </article>
      </div>

      {/* FEATURED BUILDINGS — interlink to building pages */}
      {featured.length ? (
        <div className="wrap">
          <section className="sec jr-feat">
            <div className="sec-head">
              <div>
                <p className="eyebrow">In this story</p>
                <h2 className="serif" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                  The towers mentioned.
                </h2>
              </div>
            </div>
            <div className="jr-feat-grid">
              {featured.map((c) => (
                <Link key={c.slug} className="jr-feat-card" href={`/${c.slug}`}>
                  <span className="jr-feat-im">
                    <img src={cfImg(c.hero, 640)} alt={c.name} loading="lazy" />
                  </span>
                  <span className="jr-feat-bd">
                    <span className="jr-feat-n serif">{c.name}</span>
                    <span className="jr-meta">
                      {c.city ?? ""}
                      {c.city ? " · " : ""}
                      {statusPill(c.facts)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* RELATED */}
      {related.length ? (
        <div className="band">
          <div className="wrap">
            <section className="sec" style={{ paddingBottom: 0 }}>
              <div className="sec-head">
                <div>
                  <p className="eyebrow">Keep reading</p>
                </div>
                <Link className="link" href="/journal">
                  All stories &nbsp;&rarr;
                </Link>
              </div>
              <div className="jr-grid">
                {related.map((r) => (
                  <Link key={r.slug} className="jr-card" href={`/journal/${r.slug}`}>
                    <span className="jr-card-im">
                      <img src={cfImg(r.hero, 720)} alt={r.title} loading="lazy" />
                    </span>
                    <span className="jr-card-bd">
                      <span className="jr-cat">{r.category}</span>
                      <span className="jr-card-t serif">{r.title}</span>
                      <span className="jr-meta">
                        {formatDate(r.date)} &middot; {r.readMinutes} min
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <LeadBand
        eyebrow="Speak with us"
        heading="Considering this building?"
        copy="We'll walk you through the developer, the deposit structure, and what's still available — over a private video presentation, or in person when you're in town."
      />
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
    </>
  );
}
