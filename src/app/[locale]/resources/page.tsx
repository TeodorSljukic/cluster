import { Post } from "@/models/Post";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { localeLink } from "@/lib/localeLink";

async function getResources() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/posts?type=resource&status=published&limit=20`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error("Error fetching resources:", error);
    return [];
  }
}

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = (resolvedParams.locale as Locale) || "me";
  const posts = await getResources();

  function formatDate(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <main className="blog-archive container">
      <h2 data-aos="fade-up">Valuable Resources for the Blue Economy</h2>
      <p className="archive-subtitle" data-aos="fade-up" data-aos-delay="100">
        Access guides, reports, case studies, and knowledge tools that help
        shape a sustainable future for the Adriatic region and beyond.
      </p>

      <div className="posts-grid">
        {posts.length > 0 ? (
          posts.map((post: Post, index: number) => (
            <article
              key={post._id}
              className="post-card"
              data-aos="fade-up"
              data-aos-delay={(index % 4) * 100 + 100}
            >
              {post.featuredImage && (
                <Link href={localeLink(`/posts/${post.slug}`, locale)}>
                  <div className="post-thumb">
                    <img src={post.featuredImage} alt={post.title} />
                  </div>
                </Link>
              )}
              <div className="post-content">
                <span className="post-date">
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
                <h3 className="post-title">
                  <Link href={localeLink(`/posts/${post.slug}`, locale)}>{post.title}</Link>
                </h3>
                {post.excerpt && (
                  <p>{post.excerpt.replace(/<[^>]*>/g, '')}</p>
                )}
                <Link href={localeLink(`/posts/${post.slug}`, locale)} className="btn">
                  Read more
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p>No resources found.</p>
        )}
      </div>
    </main>
  );
}
