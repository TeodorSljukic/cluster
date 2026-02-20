"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { AdminGuard } from "@/components/AdminGuard";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { Post } from "@/models/Post";
import { locales, localeNames, localeFlags, localeFlagEmojis, type Locale, defaultLocale } from "@/lib/i18n";

function NewPostPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "news") as "news" | "event";
  const [selectedLocale, setSelectedLocale] = useState<Locale | "">("");

  // Load CMS locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem("cms-locale") as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setSelectedLocale(savedLocale);
    }
  }, []);

  const [formData, setFormData] = useState<Partial<Post>>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    status: "draft",
    type: type,
    eventDate: undefined,
    eventLocation: "",
  });

  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

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

      // Prepare data for API
      const postData: any = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || "",
        featuredImage: formData.featuredImage || "",
        type: type,
        status: formData.status || "draft",
        locale: selectedLocale, // Add locale to post data
        eventLocation: formData.eventLocation || "",
      };

      // Convert dates to ISO strings if they exist
      if (formData.eventDate) {
        if (formData.eventDate instanceof Date) {
          postData.eventDate = formData.eventDate.toISOString();
        } else if (typeof formData.eventDate === "string") {
          postData.eventDate = new Date(formData.eventDate).toISOString();
        }
      }

      console.log("[CLIENT] Sending post data:", {
        title: postData.title,
        contentLength: postData.content?.length || 0,
        contentPreview: postData.content?.substring(0, 100) || "empty",
        locale: postData.locale,
      });

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      console.log("[CLIENT] Response status:", res.status);

      let data;
      try {
        const responseText = await res.text();
        console.log("[CLIENT] Response text length:", responseText.length);
        console.log("[CLIENT] Response text preview:", responseText.substring(0, 500));
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        alert("Error: Invalid response from server");
        setSaving(false);
        return;
      }

      if (res.ok) {
        // Log translation debug info
        if (data.translationDebug) {
          console.log("[CLIENT] Translation Debug Info:", data.translationDebug);
          console.log("[CLIENT] Content Translation Lengths:", data.translationDebug.contentTranslationLengths);
          console.log("[CLIENT] Content Translation Previews:", data.translationDebug.contentTranslationPreviews);
        }
        
        // Wait a bit for the database to update before redirecting
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(`/admin/posts?type=${type}`);
        // Force reload to ensure the list is refreshed
        window.location.href = `/admin/posts?type=${type}`;
      } else {
        console.error("Save error response:", { status: res.status, data });
        const errorMessage = data?.error || data?.message || `Server error (${res.status})`;
        alert(`Error: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Error saving post:", error);
      alert(`Error saving post: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGuard>
      <CMSLayout>
      <div style={{ background: "white", padding: "20px", borderRadius: "4px" }}>
        <h1 style={{ margin: "0 0 20px 0", fontSize: "23px", fontWeight: "400" }}>
          Add New {type.charAt(0).toUpperCase() + type.slice(1)}
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: "600" }}>
              Language <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={selectedLocale || ""}
              onChange={(e) => {
                const newLocale = e.target.value as Locale;
                if (newLocale) {
                  setSelectedLocale(newLocale);
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
                  {localeNames[locale]} ({locale.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              required
              style={{
                width: "100%",
                maxWidth: "600px",
                padding: "6px 10px",
                border: "1px solid #8c8f94",
                borderRadius: "3px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              style={{
                width: "100%",
                maxWidth: "600px",
                padding: "6px 10px",
                border: "1px solid #8c8f94",
                borderRadius: "3px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: "600" }}>
              Excerpt
            </label>
            <RichTextEditor
              value={formData.excerpt || ""}
              onChange={(value) => setFormData({ ...formData, excerpt: value })}
              placeholder="Enter a short excerpt..."
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: "600" }}>
              Content *
            </label>
            <RichTextEditor
              value={formData.content || ""}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Enter your content here..."
            />
          </div>

          <ImageUpload
            value={formData.featuredImage || ""}
            onChange={(url) => setFormData({ ...formData, featuredImage: url })}
            label="Featured Image"
          />

          {type === "event" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>
                  Event Date
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
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    padding: "6px 10px",
                    border: "1px solid #8c8f94",
                    borderRadius: "3px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>
                  Event Location
                </label>
                <input
                  type="text"
                  value={formData.eventLocation || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, eventLocation: e.target.value })
                  }
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    padding: "6px 10px",
                    border: "1px solid #8c8f94",
                    borderRadius: "3px",
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>
              Status
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
                maxWidth: "200px",
                padding: "6px 10px",
                border: "1px solid #8c8f94",
                borderRadius: "3px",
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 16px",
                background: "#2271b1",
                color: "white",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                borderRadius: "3px",
                fontSize: "13px",
              }}
            >
              {saving ? "Publishing..." : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: "8px 16px",
                background: "#6c757d",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "3px",
                fontSize: "13px",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      </CMSLayout>
    </AdminGuard>
  );
}

export default function NewPostPage() {
  // Next.js requires useSearchParams() to be used under a Suspense boundary
  return (
    <Suspense fallback={null}>
      <NewPostPageInner />
    </Suspense>
  );
}
