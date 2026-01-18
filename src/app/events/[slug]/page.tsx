import { Post } from "@/models/Post";
import { notFound } from "next/navigation";
import Link from "next/link";

async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/posts/slug/${slug}`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export default async function EventPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  if (!post || post.type !== "event") {
    notFound();
  }

  function formatDate(dateValue?: string | Date) {
    if (!dateValue) return "";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="container" style={{ padding: "2rem 0", maxWidth: "800px" }}>
      <Link href="/" style={{ marginBottom: "1rem", display: "inline-block" }}>
        ← Back to Home
      </Link>

      {post.featuredImage && (
        <img
          src={post.featuredImage}
          alt={post.title}
          style={{ width: "100%", marginBottom: "2rem", borderRadius: "8px" }}
        />
      )}

      <h1 style={{ marginBottom: "1rem" }}>{post.title}</h1>

      <div style={{ marginBottom: "2rem", color: "#666" }}>
        {post.eventDate && (
          <p>
            <strong>Event Date:</strong> {formatDate(post.eventDate)}
          </p>
        )}
        {post.eventLocation && (
          <p>
            <strong>Location:</strong> {post.eventLocation}
          </p>
        )}
        <p>
          <strong>Published:</strong> {formatDate(post.publishedAt || post.createdAt)}
        </p>
      </div>

      {post.excerpt && (
        <p style={{ fontSize: "1.25rem", color: "#555", marginBottom: "2rem", fontStyle: "italic" }}>
          {post.excerpt}
        </p>
      )}

      <div
        dangerouslySetInnerHTML={{ __html: post.content }}
        style={{ lineHeight: "1.8" }}
      />
    </main>
  );
}
