import { Post } from "@/models/Post";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";

async function getUpcomingEvents() {
  try {
    // For server-side fetch, use absolute URL with environment variable or fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts?type=event&status=published&limit=6`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Failed to fetch events:", res.status);
      return [];
    }
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

interface EventsSectionProps {
  locale?: Locale;
}

export async function EventsSection({ locale = "me" }: EventsSectionProps) {
  const posts = await getUpcomingEvents();
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
