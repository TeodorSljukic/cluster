"use client";

import { useState, useEffect } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { AdminGuard } from "@/components/AdminGuard";

interface MediaFile {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error loading media:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        loadMedia();
        e.target.value = ""; // Reset input
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("URL copied to clipboard!");
  }

  return (
    <AdminGuard>
      <CMSLayout>
        <div style={{ background: "white", padding: "20px", borderRadius: "4px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "23px", fontWeight: "400" }}>
              Media Library
            </h1>
            <label
              style={{
                background: "#2271b1",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "3px",
                cursor: uploading ? "not-allowed" : "pointer",
                fontSize: "14px",
                display: "inline-block",
              }}
            >
              {uploading ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
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
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              {files.map((file) => (
                <div
                  key={file.filename}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      paddingTop: "100%",
                      position: "relative",
                      background: "#f0f0f0",
                    }}
                  >
                    <img
                      src={file.url}
                      alt={file.filename}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div style={{ padding: "10px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "5px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={file.filename}
                    >
                      {file.filename}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999", marginBottom: "8px" }}>
                      {formatFileSize(file.size)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(file.url)}
                      style={{
                        width: "100%",
                        padding: "6px",
                        background: "#2271b1",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && files.length === 0 && (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "#666",
              }}
            >
              <p style={{ fontSize: "18px", marginBottom: "10px" }}>
                No media files yet
              </p>
              <p style={{ fontSize: "14px" }}>
                Upload your first image to get started
              </p>
            </div>
          )}
        </div>
      </CMSLayout>
    </AdminGuard>
  );
}
