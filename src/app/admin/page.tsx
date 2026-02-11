"use client";

import { useState, useEffect } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { AdminGuard } from "@/components/AdminGuard";
import type { Post } from "@/models/Post";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [news, events, users] = await Promise.all([
        fetch("/api/posts?type=news&status=published").then((r) => r.json()),
        fetch("/api/posts?type=event&status=published").then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
      ]);

      setStats({
        news: news.posts?.length || 0,
        events: events.posts?.length || 0,
        resources: 0,
        users: users.users?.length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  return (
    <AdminGuard>
      <CMSLayout>
      <div style={{ background: "white", padding: "20px", borderRadius: "4px" }}>
        <h1 style={{ margin: "0 0 20px 0", fontSize: "23px", fontWeight: "400" }}>
          Dashboard
        </h1>

        <div
          className="cms-dashboard-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "#f6f7f7",
              padding: "20px",
              borderRadius: "4px",
              border: "1px solid #c3c4c7",
            }}
          >
            <div style={{ fontSize: "30px", marginBottom: "10px" }}>📰</div>
            <div style={{ fontSize: "28px", fontWeight: "600", marginBottom: "5px" }}>
              {stats.news || 0}
            </div>
            <div style={{ fontSize: "13px", color: "#50575e" }}>News Posts</div>
          </div>

          <div
            style={{
              background: "#f6f7f7",
              padding: "20px",
              borderRadius: "4px",
              border: "1px solid #c3c4c7",
            }}
          >
            <div style={{ fontSize: "30px", marginBottom: "10px" }}>📅</div>
            <div style={{ fontSize: "28px", fontWeight: "600", marginBottom: "5px" }}>
              {stats.events || 0}
            </div>
            <div style={{ fontSize: "13px", color: "#50575e" }}>Events</div>
          </div>

          <div
            style={{
              background: "#f6f7f7",
              padding: "20px",
              borderRadius: "4px",
              border: "1px solid #c3c4c7",
            }}
          >
            <div style={{ fontSize: "30px", marginBottom: "10px" }}>👥</div>
            <div style={{ fontSize: "28px", fontWeight: "600", marginBottom: "5px" }}>
              {stats.users || 0}
            </div>
            <div style={{ fontSize: "13px", color: "#50575e" }}>Users</div>
          </div>
        </div>

        <div style={{ marginTop: "30px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "400", marginBottom: "15px" }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="/admin/posts?type=news"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                background: "#2271b1",
                color: "white",
                textDecoration: "none",
                borderRadius: "3px",
                fontSize: "13px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#135e96";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2271b1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Manage News
            </a>
            <a
              href="/admin/posts?type=event"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                background: "#2271b1",
                color: "white",
                textDecoration: "none",
                borderRadius: "3px",
                fontSize: "13px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#135e96";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2271b1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Manage Events
            </a>
            <a
              href="/admin/users"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                background: "#2271b1",
                color: "white",
                textDecoration: "none",
                borderRadius: "3px",
                fontSize: "13px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#135e96";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2271b1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Manage Users
            </a>
          </div>
        </div>
      </div>
      </CMSLayout>
    </AdminGuard>
  );
}

function PostForm({
  post,
  type,
  onClose,
  onSave,
}: {
  post: Post | null;
  type: "news" | "event";
  onClose: () => void;
  onSave: () => void;
}) {
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
  });

  const [saving, setSaving] = useState(false);

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
      slug: formData.slug || generateSlug(title),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = post?._id ? `/api/posts/${post._id}` : "/api/posts";
      const method = post?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error saving post");
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
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Excerpt
            </label>
            <textarea
              value={formData.excerpt || ""}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              rows={3}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
              rows={10}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Featured Image URL
            </label>
            <input
              type="text"
              value={formData.featuredImage || ""}
              onChange={(e) =>
                setFormData({ ...formData, featuredImage: e.target.value })
              }
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          {type === "event" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  Event Date
                </label>
                <input
                  type="datetime-local"
                  value={
                    formData.eventDate
                      ? new Date(formData.eventDate).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eventDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  style={{ width: "100%", padding: "0.5rem" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  Event Location
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
              style={{ width: "100%", padding: "0.5rem" }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#0070f3",
                color: "white",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save"}
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
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
