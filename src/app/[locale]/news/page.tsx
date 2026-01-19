import { Post } from "@/models/Post";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getNews(locale: Locale) {
  try {
    const collection = await getCollection("posts");
    
    const query: any = {
      type: "news",
      status: "published",
    };
    
    // Optionally filter by locale if needed
    // query.locale = locale;

    const posts = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(20)
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

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = (resolvedParams.locale as Locale) || "me";
  const posts = await getNews(locale);

  function formatDate(dateValue?: string | Date) {
    if (!dateValue) return "";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <main className="blog-archive container">
      <h2 data-aos="fade-up">News &amp; Events</h2>

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
          <p>No news posts found.</p>
        )}
      </div>
    </main>
  );
}
