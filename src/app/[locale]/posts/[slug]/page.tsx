import { Post } from "@/models/Post";
import { notFound } from "next/navigation";
import Link from "next/link";
import { locales, localeFlagEmojis, localeNames, type Locale } from "@/lib/i18n";
import { localeLink } from "@/lib/localeLink";
import { getCollection } from "@/lib/db";
import { PostViewTracker } from "@/components/PostViewTracker";
import { processPostContent } from "@/lib/processPostContent";
import { srCyrToLat } from "@/lib/transliterate";

export const dynamic = "force-dynamic";

async function getPostBySlug(slug: string, locale: Locale): Promise<Post | null> {
  try {
    const collection = await getCollection("posts");
    
    // First try to find post with matching locale
    let post = await collection.findOne({
      slug: slug,
      status: "published",
      locale: locale,
    });

    // If not found, try to find any post with this slug (might be from different locale)
    if (!post) {
      post = await collection.findOne({
        slug: slug,
        status: "published",
      });
    }

    if (!post) {
      return null;
    }

    // Use translations from metadata if available for current locale
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

    // Helper function to clean error messages from text
    const cleanErrorMessage = (text: string | undefined): string => {
      if (!text || typeof text !== "string") return text || "";
      const errorPatterns = [
        /QUERY LENGTH LIMIT EXCEEDED[^<]*/gi,
        /MAX ALLOWED QUERY[^<]*/gi,
        /500 CHARS[^<]*/gi,
      ];
      let cleaned = text;
      errorPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, "");
      });
      return cleaned.trim();
    };

    // Use translations from metadata if available for current locale
    // ALWAYS use translation from metadata if it exists, regardless of post locale
    // This ensures translations are always used when available
    if (post.metadata) {
      // Always prefer translations from metadata if they exist
      if (post.metadata.titleTranslations?.[locale]) {
        postData.title = cleanErrorMessage(post.metadata.titleTranslations[locale]);
      }
      if (post.metadata.contentTranslations?.[locale]) {
        postData.content = cleanErrorMessage(post.metadata.contentTranslations[locale]);
      }
      if (post.metadata.excerptTranslations?.[locale]) {
        postData.excerpt = cleanErrorMessage(post.metadata.excerptTranslations[locale]);
      }
    }

    // Clean error messages from original content/excerpt as well
    postData.content = cleanErrorMessage(postData.content);
    postData.excerpt = cleanErrorMessage(postData.excerpt);

    // Ensure Montenegrin ("me") is displayed in latinica
    if (locale === "me") {
      postData.title = srCyrToLat(postData.title);
      postData.content = srCyrToLat(postData.content);
      postData.excerpt = srCyrToLat(postData.excerpt || "");
    }

    return postData;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

function getBackLink(type: string, locale: Locale): { href: string; label: string } {
  switch (type) {
    case "news":
      return { href: localeLink("/news", locale), label: "Back to News" };
    case "event":
      return { href: localeLink("/", locale), label: "Back to Home" };
    default:
      return { href: localeLink("/", locale), label: "Back to Home" };
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  // Handle params as Promise (Next.js 16) or direct object
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = (resolvedParams.locale as Locale) || "me";
  const post = await getPostBySlug(resolvedParams.slug, locale);

  if (!post || post.status !== "published") {
    notFound();
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/[slug]/page.tsx:58',message:'Post loaded from DB',data:{contentLength:post.content?.length||0,contentPreview:post.content?.substring(0,200)||'',hasUl:post.content?.includes('<ul')||false,hasOl:post.content?.includes('<ol')||false,excerptLength:post.excerpt?.length||0,excerptPreview:post.excerpt?.substring(0,200)||'',excerptHasUl:post.excerpt?.includes('<ul')||false,excerptHasOl:post.excerpt?.includes('<ol')||false},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  const backLink = getBackLink(post.type, locale);

  const meta: any = (post as any).metadata || {};
  const sourceLocale = ((post as any).locale as Locale) || "me";
  const sourceTitle = (meta?.titleTranslations?.[sourceLocale] || post.title || "").trim();
  const sourceContent = (meta?.contentTranslations?.[sourceLocale] || post.content || "").trim();
  const sourceExcerpt = (meta?.excerptTranslations?.[sourceLocale] || post.excerpt || "").trim();

  const isTranslated = (loc: Locale): boolean => {
    if (loc === sourceLocale) return true;
    const tTitle = (meta?.titleTranslations?.[loc] || "").trim();
    const tContent = (meta?.contentTranslations?.[loc] || "").trim();
    const tExcerpt = (meta?.excerptTranslations?.[loc] || "").trim();
    // Consider translated if any field exists and differs from source (avoid "copied" translations)
    if (tContent && tContent !== sourceContent) return true;
    if (tTitle && tTitle !== sourceTitle) return true;
    if (tExcerpt && tExcerpt !== sourceExcerpt) return true;
    return false;
  };

  function formatDate(dateString?: string | Date, includeTime = false) {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "";
    
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    
    return date.toLocaleDateString("en-US", options);
  }

  return (
    <main className="container post-page">
      {post._id && <PostViewTracker postId={post._id} />}
      <div className="post-shell">
        <Link href={backLink.href} className="post-back">
          ← {backLink.label}
        </Link>
      </div>

      <div className="post-lang">
        <div className="post-lang-label">Available languages:</div>
        <div className="post-lang-pills">
          {locales.map((l) => {
            const available = isTranslated(l);
            const href = localeLink(`/posts/${post.slug}`, l);
            const active = l === locale;
            const cls =
              "post-lang-pill" +
              (active ? " is-active" : "") +
              (!available ? " is-disabled" : "");
            return (
              <Link
                key={l}
                href={href}
                className={cls}
                title={available ? `Open in ${localeNames[l]}` : `Not translated to ${localeNames[l]} yet`}
              >
                <span>{localeFlagEmojis[l]}</span>
                <span>{localeNames[l]}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <article className="post-shell">
        {post.featuredImage && (
          <div className="post-hero">
            <img
              src={post.featuredImage}
              alt={post.title}
            />
          </div>
        )}

        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            {post.type && <span className="post-type">{post.type}</span>}
            {post.viewCount !== undefined && (
              <span>👁️ {post.viewCount} {post.viewCount === 1 ? "view" : "views"}</span>
            )}
            {post.publishedByName && (
              <span>Published by: <strong>{post.publishedByName}</strong></span>
            )}
          </div>
        </header>

        {post.excerpt && (
          <div
            className="post-excerpt"
            dangerouslySetInnerHTML={{ __html: processPostContent(post.excerpt) }}
          />
        )}

        {post.type === "event" && (post.eventDate || post.eventLocation) && (
          <div className="post-event-box">
            {post.eventDate && (
              <p style={{ margin: "5px 0" }}>
                <strong>Date:</strong> {formatDate(post.eventDate)}
              </p>
            )}
            {post.eventLocation && (
              <p style={{ margin: "5px 0" }}>
                <strong>Location:</strong> {post.eventLocation}
              </p>
            )}
          </div>
        )}

        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: processPostContent(post.content) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                setTimeout(function() {
                  fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/[slug]/page.tsx:script',message:'Client script started',data:{timestamp:Date.now()},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(function(){});
                  
                  function processLists(container, className) {
                    if (!container) return;
                    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/[slug]/page.tsx:script',message:'Processing container',data:{className:className,innerHTML:container.innerHTML.substring(0,300)},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(function(){});
                    
                    // Process ul lists
                    var uls = container.querySelectorAll('ul');
                    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/[slug]/page.tsx:script',message:'Found UL elements',data:{ulCount:uls.length,className:className},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(function(){});
                    uls.forEach(function(ul) {
                      ul.style.cssText = 'list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;';
                      var lis = ul.querySelectorAll('li');
                      lis.forEach(function(li) {
                        if (li.dataset.processed) return;
                        li.dataset.processed = 'true';
                        li.style.cssText = 'margin: 0.5em 0 !important; padding: 0 0 0 0.5em !important; position: relative !important; list-style: none !important;';
                        if (!li.querySelector('.list-bullet')) {
                          var bullet = document.createElement('span');
                          bullet.className = 'list-bullet';
                          bullet.textContent = '•';
                          bullet.style.cssText = 'position: absolute !important; left: -2em !important; color: #333 !important; font-weight: bold !important; font-size: 1.2em !important; text-align: right !important; min-width: 1.5em !important;';
                          li.insertBefore(bullet, li.firstChild);
                          fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/[slug]/page.tsx:script',message:'Bullet added',data:{bulletLeft:window.getComputedStyle(bullet).left,bulletPosition:window.getComputedStyle(bullet).position,liPosition:window.getComputedStyle(li).position},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(function(){});
                        }
                      });
                    });
                    
                    // Process ol lists
                    var ols = container.querySelectorAll('ol');
                    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/[slug]/page.tsx:script',message:'Found OL elements',data:{olCount:ols.length,className:className},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(function(){});
                    ols.forEach(function(ol) {
                      ol.style.cssText = 'list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;';
                      var lis = ol.querySelectorAll('li');
                      var counter = 0;
                      lis.forEach(function(li) {
                        counter++;
                        if (li.dataset.processed) return;
                        li.dataset.processed = 'true';
                        li.style.cssText = 'margin: 0.5em 0 !important; padding: 0 0 0 0.5em !important; position: relative !important; list-style: none !important;';
                        if (!li.querySelector('.list-number')) {
                          var number = document.createElement('span');
                          number.className = 'list-number';
                          number.textContent = counter + '.';
                          number.style.cssText = 'position: absolute !important; left: -2em !important; color: #333 !important; min-width: 1.5em !important; text-align: right !important;';
                          li.insertBefore(number, li.firstChild);
                          fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/[slug]/page.tsx:script',message:'Number added',data:{numberLeft:window.getComputedStyle(number).left,numberPosition:window.getComputedStyle(number).position},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(function(){});
                        }
                      });
                    });
                  }
                  
                  var contentContainer = document.querySelector('.post-content');
                  var excerptContainer = document.querySelector('.post-excerpt');
                  processLists(contentContainer, 'post-content');
                  processLists(excerptContainer, 'post-excerpt');
                }, 100);
              })();
            `,
          }}
        />
      </article>
    </main>
  );
}
