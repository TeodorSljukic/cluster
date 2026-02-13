import { Post } from "@/models/Post";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";

async function getLatestNews() {
  try {
    // Directly query database instead of HTTP request for better performance and reliability
    const collection = await getCollection("posts");
    
    const posts = await collection
      .find({
        type: "news",
        status: "published",
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
      publishedAt: post.publishedAt?.toISOString(),
      eventDate: post.eventDate?.toISOString(),
    })) as Post[];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

interface NewsSectionProps {
  locale?: Locale;
}

export async function NewsSection({ locale = "en" }: NewsSectionProps) {
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
