import { Post } from "@/models/Post";
import { notFound } from "next/navigation";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";
import { PostViewTracker } from "@/components/PostViewTracker";
import { processPostContent } from "@/lib/processPostContent";

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
      {post._id && <PostViewTracker postId={post._id} />}
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
          <div style={{ display: "flex", gap: "20px", color: "#666", fontSize: "0.9rem", flexWrap: "wrap", alignItems: "center" }}>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            {post.type && <span style={{ textTransform: "capitalize" }}>{post.type}</span>}
            {post.viewCount !== undefined && (
              <span>👁️ {post.viewCount} {post.viewCount === 1 ? "view" : "views"}</span>
            )}
            {post.publishedByName && (
              <span>Published by: <strong>{post.publishedByName}</strong></span>
            )}
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
          className="post-content"
          style={{ 
            lineHeight: "1.8", 
            color: "#333",
          }}
          dangerouslySetInnerHTML={{ __html: processPostContent(post.content) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                setTimeout(function() {
                  var container = document.querySelector('.post-content');
                  if (!container) return;
                  
                  // Process ul lists
                  var uls = container.querySelectorAll('ul');
                  uls.forEach(function(ul) {
                    ul.style.cssText = 'list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;';
                    var lis = ul.querySelectorAll('li');
                    lis.forEach(function(li) {
                      if (li.dataset.processed) return;
                      li.dataset.processed = 'true';
                      li.style.cssText = 'margin: 0.5em 0 !important; padding: 0 0 0 0.5em !important; position: relative !important; list-style: none !important;';
                      if (!li.querySelector('.list-bullet')) {
                        var bullet = document.createElement('span');
                        bullet.className = 'list-bullet';
                        bullet.textContent = '•';
                        bullet.style.cssText = 'position: absolute !important; left: -1.5em !important; color: #333 !important; font-weight: bold !important; font-size: 1.2em !important;';
                        li.insertBefore(bullet, li.firstChild);
                      }
                    });
                  });
                  
                  // Process ol lists
                  var ols = container.querySelectorAll('ol');
                  ols.forEach(function(ol) {
                    ol.style.cssText = 'list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;';
                    var lis = ol.querySelectorAll('li');
                    var counter = 0;
                    lis.forEach(function(li) {
                      counter++;
                      if (li.dataset.processed) return;
                      li.dataset.processed = 'true';
                      li.style.cssText = 'margin: 0.5em 0 !important; padding: 0 0 0 0.5em !important; position: relative !important; list-style: none !important;';
                      if (!li.querySelector('.list-number')) {
                        var number = document.createElement('span');
                        number.className = 'list-number';
                        number.textContent = counter + '.';
                        number.style.cssText = 'position: absolute !important; left: -2em !important; color: #333 !important; min-width: 1.5em !important; text-align: right !important;';
                        li.insertBefore(number, li.firstChild);
                      }
                    });
                  });
                }, 100);
              })();
            `,
          }}
        />
      </article>
    </main>
  );
}
