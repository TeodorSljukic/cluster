import { Post } from "@/models/Post";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";

async function getUpcomingEvents(locale: Locale) {
  try {
    // Directly query database instead of HTTP request for better performance and reliability
    const collection = await getCollection("posts");
    
    // Get all published event posts (regardless of locale)
    // We'll use translations from metadata to display in current locale
    const posts = await collection
      .find({
        type: "event",
        status: "published",
      })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    return posts.map((post) => {
      const postData: Post = {
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt?.toISOString(),
        updatedAt: post.updatedAt?.toISOString(),
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
    console.error("Error fetching events:", error);
    return [];
  }
}

interface EventsSectionProps {
  locale?: Locale;
}

export async function EventsSection({ locale = "en" }: EventsSectionProps) {
  const posts = await getUpcomingEvents(locale);
  const t = getTranslations(locale);

  function formatDate(dateValue?: string | Date) {
    if (!dateValue) return "";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }

  // Get first 2 posts
  const displayPosts = posts.slice(0, 2);

  return (
    <section className="events">
      <div className="container">
        <h2 className="events-title" data-aos="fade-up">
          {t.events.title}
        </h2>
        <p className="events-subtitle" data-aos="fade-up" data-aos-delay="150">
          {t.events.subtitle}
        </p>

        {displayPosts.length > 0 && (
          <div className="events-grid" data-aos="fade-up">
            {displayPosts.map((post: Post) => (
              <div key={post._id} className="event-card">
                {post.featuredImage && (
                  <Link href={localeLink(`/posts/${post.slug}`, locale)}>
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="event-thumb"
                    />
                  </Link>
                )}

                <div className="event-meta">
                  <span className="event-date">
                    {formatDate(post.eventDate || post.publishedAt || post.createdAt)}
                  </span>
                </div>
                <h3 className="event-title">{post.title}</h3>

                <Link href={localeLink(`/posts/${post.slug}`, locale)} className="event-button">
                  {t.events.readMore}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
