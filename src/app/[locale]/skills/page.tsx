import { Post } from "@/models/Post";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { localeLink } from "@/lib/localeLink";

export const dynamic = "force-dynamic";

async function getSkills() {
  try {
    // For server-side fetch, use absolute URL with environment variable or fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts?type=skill&status=published&limit=20`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Failed to fetch skills:", res.status);
      return [];
    }
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error("Error fetching skills:", error);
    return [];
  }
}

export default async function SkillsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = (resolvedParams.locale as Locale) || "me";
  const posts = await getSkills();

  function formatDate(dateValue?: string | Date) {
    if (!dateValue) return "";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <main className="blog-archive container">
      <h2 data-aos="fade-up">Skills</h2>
      <p className="archive-subtitle" data-aos="fade-up" data-aos-delay="100">
        Discover key skills and competencies that support sustainable growth and
        innovation in the Adriatic region.
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
          <p>No skills found.</p>
        )}
      </div>
    </main>
  );
}
