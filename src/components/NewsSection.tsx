import { Post } from "@/models/Post";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";

async function getLatestNews(locale: Locale) {
  try {
    // Directly query database instead of HTTP request for better performance and reliability
    const collection = await getCollection("posts");
    
    // Get all published news posts (regardless of locale)
    // We'll use translations from metadata to display in current locale
    const posts = await collection
      .find({
        type: "news",
        status: "published",
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return posts.map((post) => {
      const postData: Post = {
        ...post,
        _id: post._id.toString(),
        type: post.type || "news",
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "",
        status: post.status || "draft",
        createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: post.updatedAt?.toISOString() || new Date().toISOString(),
        publishedAt: post.publishedAt?.toISOString(),
        eventDate: post.eventDate?.toISOString(),
      };

      // Use translations from metadata if available for current locale
      // If post locale matches current locale, use original text
      // Otherwise, use translation from metadata
      if (post.metadata) {
        if (post.locale === locale) {
          // Post is in current locale, use original text (already set)
        } else {
          // Post is in different locale, use translation from metadata
          if (post.metadata.titleTranslations?.[locale]) {
            postData.title = post.metadata.titleTranslations[locale];
          }
          if (post.metadata.contentTranslations?.[locale]) {
            postData.content = post.metadata.contentTranslations[locale];
          }
          if (post.metadata.excerptTranslations?.[locale]) {
            postData.excerpt = post.metadata.excerptTranslations[locale];
          }
        }
      }

      return postData;
    }) as Post[];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

interface NewsSectionProps {
  locale?: Locale;
}

export async function NewsSection({ locale = "en" }: NewsSectionProps) {
  const posts = await getLatestNews(locale);
  const t = getTranslations(locale);

  function formatDate(dateValue?: string | Date) {
    if (!dateValue) return "";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }

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

                <div className="news-meta">
                  <span className="news-date">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                </div>
                <h3 className="news-item-title">{post.title}</h3>

                <Link href={localeLink(`/posts/${post.slug}`, locale)} className="news-button">
                  {t.news.readMore}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
