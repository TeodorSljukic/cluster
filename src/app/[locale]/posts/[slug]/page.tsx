import { Post } from "@/models/Post";
import { notFound } from "next/navigation";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const collection = await getCollection("posts");
    
    const post = await collection.findOne({
      slug: slug,
      status: "published",
    });

    if (!post) {
      return null;
    }

    return {
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
      publishedAt: post.publishedAt?.toISOString(),
      eventDate: post.eventDate?.toISOString(),
    } as Post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

function getBackLink(type: string, locale: Locale): { href: string; label: string } {
  switch (type) {
    case "news":
      return { href: localeLink("/news", locale), label: "Back to News" };
    case "event":
      return { href: localeLink("/", locale), label: "Back to Home" };
    case "resource":
      return { href: localeLink("/resources", locale), label: "Back to Resources" };
    default:
      return { href: localeLink("/", locale), label: "Back to Home" };
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  // Handle params as Promise (Next.js 16) or direct object
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = (resolvedParams.locale as Locale) || "me";
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const backLink = getBackLink(post.type, locale);

  function formatDate(dateString?: string | Date, includeTime = false) {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "";
    
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    
    return date.toLocaleDateString("en-US", options);
  }

  return (
    <main className="container" style={{ padding: "40px 20px" }}>
      <Link href={backLink.href} style={{ display: "inline-block", marginBottom: "20px", color: "#B53251", textDecoration: "none" }}>
        ← {backLink.label}
      </Link>

      <article style={{ maxWidth: "800px", margin: "0 auto" }}>
        {post.featuredImage && (
          <div style={{ marginBottom: "30px" }}>
            <img
              src={post.featuredImage}
              alt={post.title}
              style={{ width: "100%", height: "auto", borderRadius: "8px" }}
            />
          </div>
        )}

        <header style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "10px", color: "#333" }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", gap: "20px", color: "#666", fontSize: "0.9rem" }}>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            {post.type && <span style={{ textTransform: "capitalize" }}>{post.type}</span>}
          </div>
        </header>

        {post.excerpt && (
          <div
            style={{
              fontSize: "1.2rem",
              color: "#555",
              marginBottom: "30px",
              fontStyle: "italic",
              lineHeight: "1.6",
            }}
            dangerouslySetInnerHTML={{ __html: post.excerpt }}
          />
        )}

        {post.type === "event" && (post.eventDate || post.eventLocation) && (
          <div
            style={{
              background: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "30px",
            }}
          >
            {post.eventDate && (
              <p style={{ margin: "5px 0" }}>
                <strong>Date:</strong> {formatDate(post.eventDate)}
              </p>
            )}
            {post.eventLocation && (
              <p style={{ margin: "5px 0" }}>
                <strong>Location:</strong> {post.eventLocation}
              </p>
            )}
          </div>
        )}

        <div
          style={{ lineHeight: "1.8", color: "#333" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
