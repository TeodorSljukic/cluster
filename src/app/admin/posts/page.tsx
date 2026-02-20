"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Post } from "@/models/Post";
import { CMSLayout } from "@/components/CMSLayout";
import { AdminGuard } from "@/components/AdminGuard";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { locales, localeNames, localeFlags, type Locale, defaultLocale } from "@/lib/i18n";
import { getTranslations } from "@/lib/getTranslations";

function PostsPageInner() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(defaultLocale);
  const [cmsLocale, setCmsLocale] = useState<Locale>(defaultLocale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "news";
  const editId = searchParams.get("edit");

  // Load CMS locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem("cms-locale") as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setCmsLocale(savedLocale);
    }
  }, []);

  // Listen for locale changes from CMSLayout
  useEffect(() => {
    const handleLocaleChange = () => {
      const savedLocale = localStorage.getItem("cms-locale") as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        setCmsLocale(savedLocale);
      }
    };
    window.addEventListener("storage", handleLocaleChange);
    window.addEventListener("cms-locale-changed", handleLocaleChange);
    // Check on interval less frequently (every 1 second instead of 100ms)
    const interval = setInterval(handleLocaleChange, 1000);
    return () => {
      window.removeEventListener("storage", handleLocaleChange);
      window.removeEventListener("cms-locale-changed", handleLocaleChange);
      clearInterval(interval);
    };
  }, []);

  const t = getTranslations(cmsLocale);

  useEffect(() => {
    loadPosts();
  }, [type, selectedLocale]);

  // Auto-open edit modal if editId is in URL
  useEffect(() => {
    if (editId && posts.length > 0) {
      const postToEdit = posts.find((p) => p._id === editId);
      if (postToEdit) {
        setEditingPost(postToEdit);
        setShowForm(true);
        // Remove edit param from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("edit");
        router.replace(newUrl.pathname + newUrl.search);
      }
    }
  }, [editId, posts, router]);

  async function loadPosts() {
    setLoading(true);
    try {
      // Load all posts of the selected type (regardless of locale)
      // This way we can see all posts in CMS and manage them
      let res = await fetch(`/api/posts?type=${type}&limit=100`);
      let data = await res.json();
      
      if (!data.posts || data.posts.length === 0) {
        // If no posts found, try loading all posts
        const allRes = await fetch(`/api/posts?type=all&limit=100`);
        const allData = await allRes.json();
        if (allData.posts && allData.posts.length > 0) {
          // Filter posts that match type
          const filtered = allData.posts.filter((p: any) => 
            (!p.type || p.type === type || type === "all")
          );
          setPosts(filtered);
          return;
        }
      }
      
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.cms.confirmDelete)) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadPosts();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }

  async function handleRepublish(id: string) {
    if (!confirm("Are you sure you want to republish this post? This will update the published date.")) return;

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "published",
          republish: true, // Flag to indicate republish
        }),
      });
      if (res.ok) {
        loadPosts();
        alert("Post republished successfully!");
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to republish post"}`);
      }
    } catch (error) {
      console.error("Error republishing post:", error);
      alert("Error republishing post");
    }
  }

  function handleEdit(post: Post) {
    setEditingPost(post);
    setShowForm(true);
  }

  function handleNew() {
    setEditingPost(null);
    setShowForm(true);
  }

  return (
    <AdminGuard>
      <CMSLayout>
      <div className="cms-form-container" style={{ background: "white", padding: "20px", borderRadius: "4px" }}>
        <div
          className="cms-header-actions"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h1 
            style={{ 
              margin: 0, 
              fontSize: "23px", 
              fontWeight: "400",
              opacity: loading ? 0.5 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            {type === "news" && t.cms.news}
            {type === "event" && t.cms.events} {t.cms.posts}
          </h1>
          <button
            onClick={handleNew}
            style={{
              background: "#2271b1",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "13px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#135e96";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2271b1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {t.cms.addNew}
          </button>
          <button
            onClick={async (e) => {
              if (confirm("This will translate all existing blog posts to all languages. This may take a few minutes. Continue?")) {
                const button = e.currentTarget;
                try {
                  button.disabled = true;
                  button.textContent = "Translating...";
                  const res = await fetch("/api/posts/migrate", { method: "POST" });
                  const data = await res.json();
                  if (res.ok) {
                    alert(`Translation complete! ${data.message}\n\nTotal: ${data.total}\nTranslated: ${data.translated}\nSkipped: ${data.skipped}`);
                    loadPosts();
                  } else {
                    alert(`Error: ${data.error}`);
                  }
                  button.disabled = false;
                  button.textContent = "Translate All Posts";
                } catch (error: any) {
                  alert(`Error translating posts: ${error.message || "Unknown error"}`);
                  button.disabled = false;
                  button.textContent = "Translate All Posts";
                }
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "14px",
              marginLeft: "10px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#5a6268";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#6c757d";
            }}
          >
            Translate All Posts
          </button>
        </div>

        {showForm && (
          <PostForm
            post={editingPost}
            type={type as "news" | "event"}
            currentLocale={selectedLocale}
            onClose={() => {
              setShowForm(false);
              setEditingPost(null);
            }}
            onSave={() => {
              loadPosts();
              setShowForm(false);
              setEditingPost(null);
            }}
          />
        )}

        {loading ? (
          <div style={{ 
            padding: "40px", 
            textAlign: "center",
            opacity: 0.6,
            animation: "fadeIn 0.3s ease-in",
          }}>
            <div
              style={{
                display: "inline-block",
                width: "30px",
                height: "30px",
                border: "3px solid #2271b1",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              opacity: loading ? 0 : 1,
              transition: "opacity 0.3s ease",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <div className="cms-table-wrapper">
              <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #c3c4c7" }}>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "15px",
                    color: "#50575e",
                  }}
                >
                  {t.cms.title}
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "15px",
                    color: "#50575e",
                  }}
                >
                  {t.cms.status}
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "15px",
                    color: "#50575e",
                  }}
                >
                  {t.cms.date}
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "15px",
                    color: "#50575e",
                  }}
                >
                  Views
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "15px",
                    color: "#50575e",
                  }}
                >
                  Published By
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "15px",
                    color: "#50575e",
                  }}
                >
                  {t.cms.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post._id}
                  style={{
                    borderBottom: "1px solid #f0f0f1",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f6f7f7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {post.locale && (
                        <img 
                          src={localeFlags[post.locale as Locale] || localeFlags[defaultLocale]} 
                          alt={post.locale}
                          style={{ width: "18px", height: "13px", objectFit: "cover", borderRadius: "2px" }}
                        />
                      )}
                      <strong style={{ fontSize: "15px" }}>{post.title}</strong>
                    </div>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "3px",
                        fontSize: "13px",
                        background:
                          post.status === "published" ? "#00a32a" : "#dba617",
                        color: "white",
                      }}
                    >
                      {post.status === "published" ? t.cms.published : t.cms.draft}
                    </span>
                  </td>
                  <td style={{ padding: "10px", fontSize: "14px", color: "#50575e" }}>
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={{ padding: "10px", fontSize: "14px", color: "#50575e", textAlign: "center" }}>
                    {post.viewCount !== undefined ? post.viewCount : 0}
                  </td>
                  <td style={{ padding: "10px", fontSize: "14px", color: "#50575e" }}>
                    {post.publishedByName || "-"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <button
                      onClick={() => handleEdit(post)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#2271b1",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "0 5px",
                        textDecoration: "underline",
                      }}
                    >
                      {t.cms.edit}
                    </button>
                    {post.status === "published" && (
                      <>
                        |
                        <button
                          onClick={() => post._id && handleRepublish(post._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#00a32a",
                            cursor: "pointer",
                            fontSize: "14px",
                            padding: "0 5px",
                            textDecoration: "underline",
                          }}
                        >
                          Republish
                        </button>
                      </>
                    )}
                    |
                    <button
                      onClick={() => post._id && handleDelete(post._id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#b32d2e",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "0 5px",
                        textDecoration: "underline",
                      }}
                    >
                      {t.cms.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div style={{ marginTop: "2rem" }}>
            <p 
              style={{ 
                color: "#666",
                animation: "fadeIn 0.5s ease-in",
                marginBottom: "15px",
              }}
            >
              {t.cms.noPosts}
            </p>
            <button
              onClick={async () => {
                if (confirm("This will migrate existing posts to the new structure. Continue?")) {
                  try {
                    const res = await fetch("/api/posts/migrate", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Migration complete! ${data.message}`);
                      loadPosts();
                    } else {
                      alert(`Error: ${data.error}`);
                    }
                  } catch (error) {
                    alert("Error migrating posts");
                  }
                }
              }}
              style={{
                padding: "8px 16px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Migrate Existing Posts
            </button>
          </div>
        )}

      </div>
      </CMSLayout>
    </AdminGuard>
  );
}

export default function PostsPage() {
  // Next.js requires useSearchParams() to be used under a Suspense boundary
  return (
    <Suspense fallback={null}>
      <PostsPageInner />
    </Suspense>
  );
}

function PostForm({
  post,
  type,
  onClose,
  onSave,
  currentLocale,
}: {
  post: Post | null;
  type: "news" | "event";
  onClose: () => void;
  onSave: () => void;
  currentLocale: Locale;
}) {
  const [cmsLocale, setCmsLocale] = useState<Locale>(defaultLocale);

  // Load CMS locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem("cms-locale") as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setCmsLocale(savedLocale);
    }
  }, []);

  // Listen for locale changes
  useEffect(() => {
    const handleLocaleChange = () => {
      const savedLocale = localStorage.getItem("cms-locale") as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        setCmsLocale(savedLocale);
      }
    };
    window.addEventListener("storage", handleLocaleChange);
    window.addEventListener("cms-locale-changed", handleLocaleChange);
    const interval = setInterval(handleLocaleChange, 100);
    return () => {
      window.removeEventListener("storage", handleLocaleChange);
      window.removeEventListener("cms-locale-changed", handleLocaleChange);
      clearInterval(interval);
    };
  }, []);

  const t = getTranslations(cmsLocale);
  const [formData, setFormData] = useState<Partial<Post>>({
    title: post?.title || "",
    slug: post?.slug || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    featuredImage: post?.featuredImage || "",
    status: post?.status || "draft",
    type: type,
    eventDate: post?.eventDate || undefined,
    eventLocation: post?.eventLocation || "",
    locale: post?.locale || currentLocale,
  });

  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<Locale>((post?.locale || currentLocale) as Locale);

  // When locale changes, try to load post content for that locale
  useEffect(() => {
    if (post && selectedLocale !== post.locale) {
      // If editing existing post and locale changed, try to find translation
      // For now, clear form data when switching locale to allow new translation
      if (selectedLocale !== post.locale) {
        setFormData({
          ...formData,
          locale: selectedLocale,
          title: "",
          slug: "",
          content: "",
          excerpt: "",
        });
        setSlugManuallyEdited(false);
      }
    } else if (!post) {
      // New post - set locale
      setFormData({ ...formData, locale: selectedLocale });
      setSlugManuallyEdited(false);
    }
  }, [selectedLocale]);

  // Reset slugManuallyEdited when editing existing post
  useEffect(() => {
    if (post) {
      setSlugManuallyEdited(!!post.slug);
    } else {
      setSlugManuallyEdited(false);
    }
  }, [post]);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleTitleChange(title: string) {
    setFormData({
      ...formData,
      title,
      // Auto-generate slug only if it hasn't been manually edited
      slug: slugManuallyEdited ? formData.slug : generateSlug(title),
    });
  }

  function handleTitleBlur() {
    // When user finishes typing title, ensure slug is generated
    if (!slugManuallyEdited && formData.title) {
      setFormData({
        ...formData,
        slug: generateSlug(formData.title),
      });
    }
  }

  function handleSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setFormData({
      ...formData,
      slug,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.slug) {
        alert("Please fill in all required fields (Title, Slug)");
        setSaving(false);
        return;
      }
      
      // Content can be empty HTML from editor, so just ensure it's not undefined
      if (formData.content === undefined || formData.content === null) {
        formData.content = "";
      }

      // Prepare data for API (auto-translation happens on server side)
      const postData: any = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || "",
        featuredImage: formData.featuredImage || "",
        type: type,
        status: formData.status || "draft",
        eventLocation: formData.eventLocation || "",
        locale: selectedLocale,
      };

      // Convert dates to ISO strings if they exist
      if (formData.eventDate) {
        if (formData.eventDate instanceof Date) {
          postData.eventDate = formData.eventDate.toISOString();
        } else if (typeof formData.eventDate === "string") {
          postData.eventDate = new Date(formData.eventDate).toISOString();
        }
      }

      // Determine if this is an update or create
      // post._id should be a string (from MongoDB ObjectId.toString())
      const postId = post?._id;
      const isUpdate = postId && typeof postId === "string" && postId.trim() !== "";
      const url = isUpdate ? `/api/posts/${postId}` : "/api/posts";
      
      console.log("Post ID check:", { 
        postId, 
        isUpdate, 
        type: typeof postId,
        postObject: post,
        postIdValue: post?._id
      });
      const method = isUpdate ? "PUT" : "POST";

      console.log("Saving post:", { isUpdate, url, method, postData });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        alert("Error: Invalid response from server");
        setSaving(false);
        return;
      }

      if (res.ok) {
        // Wait a bit for the database to update
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Reload posts to show the newly created/updated post
        await loadPosts();
        onSave();
      } else {
        console.error("Save error response:", { status: res.status, data });
        // Log full error details
        console.error("Full error data:", JSON.stringify(data, null, 2));
        console.error("Request data sent:", postData);
        const errorMessage = data?.error || data?.message || `Server error (${res.status})`;
        alert(`Error: ${errorMessage}\n\nStatus: ${res.status}\n\nCheck console (F12) for full details.`);
      }
    } catch (error: any) {
      console.error("Error saving post:", error);
      alert(`Error saving post: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="cms-modal-content"
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h2>{post ? "Edit" : "Create"} {type}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: "600" }}>
              {t.cms.language} <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={selectedLocale || ""}
              onChange={(e) => {
                const newLocale = e.target.value as Locale;
                if (newLocale) {
                  setSelectedLocale(newLocale);
                  setFormData({ ...formData, locale: newLocale });
                }
              }}
              required
              style={{
                width: "100%",
                maxWidth: "300px",
                padding: "6px 10px",
                border: "1px solid #8c8f94",
                borderRadius: "3px",
                fontSize: "14px",
                cursor: "pointer",
                background: "white",
              }}
            >
              <option value="" disabled>Please select language</option>
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {localeFlags[locale]} {localeNames[locale]} ({locale.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>
                {t.cms.title} <span style={{ color: "red" }}>*</span>
              </label>
            </div>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              required
              style={{ 
                width: "100%", 
                padding: "0.5rem",
                border: "1px solid #8c8f94",
                borderRadius: "3px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              {t.cms.slug} *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              style={{ 
                width: "100%", 
                padding: "0.5rem",
                border: "1px solid #8c8f94",
                borderRadius: "3px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: "600" }}>
              {t.cms.excerpt}
            </label>
            <RichTextEditor
              value={formData.excerpt || ""}
              onChange={(value) => setFormData({ ...formData, excerpt: value })}
              placeholder={t.cms.excerptPlaceholder}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: "600" }}>
              {t.cms.content} *
            </label>
            <RichTextEditor
              value={formData.content || ""}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder={t.cms.contentPlaceholder}
            />
          </div>

          <ImageUpload
            value={formData.featuredImage || ""}
            onChange={(url) => setFormData({ ...formData, featuredImage: url })}
            label={t.cms.featuredImage}
          />

          {type === "event" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  {t.cms.eventDate}
                </label>
                <input
                  type="datetime-local"
                  value={
                    formData.eventDate
                      ? (() => {
                          const date = new Date(formData.eventDate);
                          // Convert to local timezone for datetime-local input
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          const hours = String(date.getHours()).padStart(2, "0");
                          const minutes = String(date.getMinutes()).padStart(2, "0");
                          return `${year}-${month}-${day}T${hours}:${minutes}`;
                        })()
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      // datetime-local gives us local time, create Date object
                      const localDate = new Date(e.target.value);
                      setFormData({
                        ...formData,
                        eventDate: localDate,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        eventDate: undefined,
                      });
                    }
                  }}
                  style={{ width: "100%", padding: "0.5rem" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  {t.cms.eventLocation}
                </label>
                <input
                  type="text"
                  value={formData.eventLocation || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, eventLocation: e.target.value })
                  }
                  style={{ width: "100%", padding: "0.5rem" }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              {t.cms.status}
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "draft" | "published",
                })
              }
              style={{ 
                width: "100%", 
                padding: "0.5rem",
                border: "1px solid #8c8f94",
                borderRadius: "3px",
              }}
            >
              <option value="draft">{t.cms.draft}</option>
              <option value="published">{t.cms.published}</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#2271b1",
                color: "white",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                borderRadius: "3px",
              }}
            >
              {saving ? t.cms.saving : t.cms.save}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#6c757d",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "3px",
              }}
            >
              {t.cms.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
