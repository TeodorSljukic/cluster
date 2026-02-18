import { Post } from "@/models/Post";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";
import { getTranslations } from "@/lib/getTranslations";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

async function getNews(locale: Locale, page: number = 1, limit: number = 50) {
  try {
    const collection = await getCollection("posts");
    
    const query: any = {
      type: "news",
      status: "published",
    };
    
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    console.log(`[News] Found ${posts.length} published news posts (page ${page}, total: ${total})`);

    return {
      posts: posts.map((post) => ({
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt?.toISOString(),
        updatedAt: post.updatedAt?.toISOString(),
        publishedAt: post.publishedAt?.toISOString(),
        eventDate: post.eventDate?.toISOString(),
      })) as Post[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching news:", error);
    return {
      posts: [] as Post[],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      },
    };
  }
}

function formatDate(dateValue?: string | Date) {
  if (!dateValue) return "";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = (resolvedParams.locale as Locale) || "me";
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const t = getTranslations(locale);
  
  const { posts, pagination } = await getNews(locale, page, 50);

  return (
    <main className="blog-archive container" style={{ padding: "40px 20px" }}>
      <h2 data-aos="fade-up" style={{ fontSize: "2.5rem", marginBottom: "30px", color: "#E23F65" }}>
        {t.newsPage.title}
      </h2>

      <div className="news-grid" style={{ marginBottom: "40px" }}>
        {posts.length > 0 ? (
          posts.map((post: Post, index: number) => (
            <div
              key={post._id}
              className="news-item"
              data-aos="fade-up"
              data-aos-delay={(index % 4) * 100 + 100}
            >
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
              
              <h3 className="news-item-title">
                <Link href={localeLink(`/posts/${post.slug}`, locale)}>{post.title}</Link>
              </h3>

              <div className="news-button-wrapper">
                <Link href={localeLink(`/posts/${post.slug}`, locale)} className="news-button">
                  {t.newsPage.readMore}
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#666" }}>
            {t.newsPage.noPostsFound}
          </p>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          baseUrl={localeLink("/news", locale)}
        />
      )}
    </main>
  );
}
