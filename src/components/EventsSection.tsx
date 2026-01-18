import { Post } from "@/models/Post";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";

async function getUpcomingEvents() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/posts?type=event&status=published&limit=6`, {
      cache: "no-store",
    });
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

  function formatDate(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }

  return (
    <section className="events">
      <div className="container">
        <h2 className="events-title" data-aos="fade-up">
          {t.events.title}
        </h2>
        <p className="events-subtitle" data-aos="fade-up" data-aos-delay="150">
          {t.events.subtitle}
        </p>

        {posts.length > 0 && (
          <swiper-container
            className="events-swiper"
            data-aos="fade-up"
            slides-per-view="3"
            space-between="30"
            loop="true"
            breakpoints='{"0":{"slidesPerView":1,"spaceBetween":20},"768":{"slidesPerView":2,"spaceBetween":25},"1200":{"slidesPerView":3,"spaceBetween":30}}'
          >
            {posts.map((post: Post) => (
              <swiper-slide key={post._id} className="event-card" data-aos="fade-up">
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
              </swiper-slide>
            ))}
          </swiper-container>
        )}
      </div>
    </section>
  );
}
