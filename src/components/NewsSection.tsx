import { Post } from "@/models/Post";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";

async function getLatestNews() {
  try {
    // For server-side fetch, use absolute URL with environment variable or fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts?type=news&status=published&limit=10`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Failed to fetch news:", res.status);
      return [];
    }
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

interface NewsSectionProps {
  locale?: Locale;
}

export async function NewsSection({ locale = "me" }: NewsSectionProps) {
  const posts = await getLatestNews();
  const t = getTranslations(locale);

  // Get first 4 posts
  const displayPosts = posts.slice(0, 4);

  return (
    <section className="news">
      <div className="container">
        <h2 className="news-title" data-aos="fade-up">
          {t.news.title}
        </h2>
        <p className="news-subtitle" data-aos="fade-up" data-aos-delay="150">
          {t.news.subtitle}
        </p>

        {displayPosts.length > 0 && (
          <div className="news-grid" data-aos="fade-up">
            {displayPosts.map((post: Post) => (
              <div key={post._id} className="news-item">
                {post.featuredImage && (
                  <Link href={localeLink(`/posts/${post.slug}`, locale)}>
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="news-thumb"
                    />
                  </Link>
                )}
                <h3 className="news-item-title">
                  <Link href={localeLink(`/posts/${post.slug}`, locale)}>{post.title}</Link>
                </h3>
                {post.excerpt && (
                  <p className="news-excerpt">
                    {post.excerpt.replace(/<[^>]*>/g, '').substring(0, 120)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
