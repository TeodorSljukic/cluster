"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { localeLink, type Locale } from "@/lib/localeLink";
import { getTranslations } from "@/lib/getTranslations";

interface User {
  _id?: string;
  username: string;
  email: string;
  displayName?: string;
  headline?: string;
  about?: string;
  organization?: string;
  location?: string;
  role_custom?: string;
  interests?: string;
  profilePicture?: string;
  coverImage?: string;
  experience?: any[];
  education?: any[];
  skills?: string[];
  website?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale = (resolvedParams.locale as Locale) || "me";
  const t = getTranslations(locale);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [editingExp, setEditingExp] = useState<any>(null);
  const [editingEdu, setEditingEdu] = useState<any>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [processingConnection, setProcessingConnection] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileVisitors, setProfileVisitors] = useState<any[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [connectionsSearchTerm, setConnectionsSearchTerm] = useState("");
  const [connectionsSortBy, setConnectionsSortBy] = useState<"recently" | "firstName" | "lastName">("recently");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showConnectionMenu, setShowConnectionMenu] = useState<string | null>(null);
  const [removingConnection, setRemovingConnection] = useState<string | null>(null);
  const router = useRouter();

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    applyDarkMode(savedDarkMode);
  }, []);

  function applyDarkMode(enabled: boolean) {
    if (enabled) {
      document.documentElement.classList.add("dark");
      document.body.style.background = "#1a1a1a";
      document.body.style.color = "#e0e0e0";
      // Apply to header
      const header = document.querySelector(".site-header") as HTMLElement;
      if (header) {
        header.style.background = "#2a2a2a";
        header.style.borderBottomColor = "#3a3a3a";
      }
      // Apply to footer
      const footer = document.querySelector(".site-footer") as HTMLElement;
      if (footer) {
        footer.style.background = "#2a2a2a";
        footer.style.color = "#e0e0e0";
      }
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.background = "";
      document.body.style.color = "";
      // Reset header
      const header = document.querySelector(".site-header") as HTMLElement;
      if (header) {
        header.style.background = "";
        header.style.borderBottomColor = "";
      }
      // Reset footer
      const footer = document.querySelector(".site-footer") as HTMLElement;
      if (footer) {
        footer.style.background = "";
        footer.style.color = "";
      }
    }
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    applyDarkMode(newDarkMode);
    // Force re-render by updating state
    setDarkMode(newDarkMode);
  }

  // Helper function to get card background style
  const getCardStyle = () => ({
    background: darkMode ? "#2a2a2a" : "white",
    color: darkMode ? "#e0e0e0" : "inherit",
    boxShadow: darkMode ? "0 0 0 1px rgba(255,255,255,0.1)" : "0 0 0 1px rgba(0,0,0,0.08)",
    transition: "background 0.3s ease, color 0.3s ease",
  });

  // Helper function to get input style
  const getInputStyle = () => ({
    background: darkMode ? "#1a1a1a" : "white",
    color: darkMode ? "#e0e0e0" : "inherit",
    border: darkMode ? "1px solid #3a3a3a" : "1px solid #ddd",
  });

  // Helper function for button animations
  const buttonAnimations = {
    style: {
      transition: "all 0.2s ease",
    },
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1.05)";
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "none";
    },
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(0.95)";
    },
    onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1.05)";
    },
  };

  const primaryButtonAnimations = {
    ...buttonAnimations,
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1.05)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(10, 102, 194, 0.3)";
    },
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    try {
      // First check if user is authenticated
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      
      if (!authData.user) {
        // User not authenticated, redirect to login
        router.push(localeLink("/login", locale));
        return;
      }
      
      // User is authenticated, load profile
      await loadProfile();
      await loadConnections();
      await loadProfileVisitors();
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push(localeLink("/login", locale));
    }
  }

  async function loadProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push(localeLink("/login", locale));
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error loading profile:", res.status, errorData);
        if (res.status === 404) {
          router.push(localeLink("/login", locale));
          return;
        }
        return;
      }
      const data = await res.json();
      if (data.error) {
        console.error("API error:", data.error);
        if (data.error === "Unauthorized" || data.error.includes("Unauthorized")) {
          router.push(localeLink("/login", locale));
          return;
        }
        return;
      }
      setUser(data);
      setFormData(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditing(false);
        // Profile updated successfully - no alert needed
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File, type: "cover" | "profile", inputElement?: HTMLInputElement) {
    if (!file.type.startsWith("image/")) {
      alert(locale === "en" ? "Please upload an image file" : locale === "me" ? "Molimo učitajte sliku" : locale === "sq" ? "Ju lutem ngarkoni një skedar imazhi" : "Si prega di caricare un file immagine");
      if (inputElement) inputElement.value = "";
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(locale === "en" ? "Image size must be less than 5MB" : locale === "me" ? "Veličina slike mora biti manja od 5MB" : locale === "sq" ? "Madhësia e imazhit duhet të jetë më pak se 5MB" : "La dimensione dell'immagine deve essere inferiore a 5MB");
      if (inputElement) inputElement.value = "";
      return;
    }

    if (type === "cover") {
      setUploadingCover(true);
    } else {
      setUploadingProfile(true);
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        const updatedFormData = {
          ...formData,
          [type === "cover" ? "coverImage" : "profilePicture"]: data.url,
        };
        setFormData(updatedFormData);
        
        // Auto-save after upload
        const saveRes = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });
        
        if (saveRes.ok) {
          const updated = await saveRes.json();
          // Update both user and formData with the new image URL
          setUser({
            ...updated,
            [type === "cover" ? "coverImage" : "profilePicture"]: data.url,
          });
          setFormData(updatedFormData);
        } else {
          const error = await saveRes.json();
          alert(`Error saving: ${error.error}`);
        }
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Upload failed"}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(locale === "en" ? "Error uploading image" : locale === "me" ? "Greška pri učitavanju slike" : locale === "sq" ? "Gabim gjatë ngarkimit të imazhit" : "Errore durante il caricamento dell'immagine");
    } finally {
      if (type === "cover") {
        setUploadingCover(false);
      } else {
        setUploadingProfile(false);
      }
      // Reset input to allow same file to be selected again
      if (inputElement) inputElement.value = "";
    }
  }

  function formatDate(dateValue?: string | Date) {
    if (!dateValue) return "";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  }

  async function loadConnections() {
    setLoadingConnections(true);
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      } else {
        console.error("Failed to load connections:", res.status);
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    } finally {
      setLoadingConnections(false);
    }
  }

  async function loadProfileVisitors() {
    setLoadingVisitors(true);
    try {
      const res = await fetch("/api/profile/visitors");
      if (res.ok) {
        const data = await res.json();
        setProfileVisitors(data.visitors || []);
      } else {
        console.error("Failed to load profile visitors:", res.status);
      }
    } catch (error) {
      console.error("Error loading profile visitors:", error);
    } finally {
      setLoadingVisitors(false);
    }
  }

  async function handleAcceptConnection(connectionId: string) {
    setProcessingConnection(connectionId);
    try {
      const res = await fetch("/api/connections/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (res.ok) {
        await loadConnections();
      } else {
        const error = await res.json();
        alert(error.error || (locale === "en" ? "Failed to accept request" : locale === "me" ? "Neuspješno prihvatanje zahtjeva" : locale === "sq" ? "Dështoi pranimi i kërkesës" : "Impossibile accettare la richiesta"));
      }
    } catch (error) {
      console.error("Error accepting connection:", error);
      alert(locale === "en" ? "Error accepting connection" : locale === "me" ? "Greška pri prihvatanju veze" : locale === "sq" ? "Gabim gjatë pranimit të lidhjes" : "Errore durante l'accettazione della connessione");
    } finally {
      setProcessingConnection(null);
    }
  }

  async function handleDeclineConnection(connectionId: string) {
    setProcessingConnection(connectionId);
    try {
      const res = await fetch("/api/connections/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (res.ok) {
        await loadConnections();
      } else {
        const error = await res.json();
        alert(error.error || (locale === "en" ? "Failed to decline request" : locale === "me" ? "Neuspješno odbijanje zahtjeva" : locale === "sq" ? "Dështoi refuzimi i kërkesës" : "Impossibile rifiutare la richiesta"));
      }
    } catch (error) {
      console.error("Error declining connection:", error);
      alert(locale === "en" ? "Error declining connection" : locale === "me" ? "Greška pri odbijanju veze" : locale === "sq" ? "Gabim gjatë refuzimit të lidhjes" : "Errore durante il rifiuto della connessione");
    } finally {
      setProcessingConnection(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(localeLink("/login", locale));
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      alert(locale === "en" ? "Error logging out" : locale === "me" ? "Greška pri odjavi" : locale === "sq" ? "Gabim gjatë daljes" : "Errore durante il logout");
    }
  }

  async function handleChangePassword() {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert(locale === "en" ? "Please fill in all fields" : locale === "me" ? "Molimo popunite sva polja" : locale === "sq" ? "Ju lutem plotësoni të gjitha fushat" : "Si prega di compilare tutti i campi");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(locale === "en" ? "New passwords do not match" : locale === "me" ? "Nove lozinke se ne poklapaju" : locale === "sq" ? "Fjalëkalimet e rinj nuk përputhen" : "Le nuove password non corrispondono");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert(locale === "en" ? "New password must be at least 6 characters long" : locale === "me" ? "Nova lozinka mora imati najmanje 6 karaktera" : locale === "sq" ? "Fjalëkalimi i ri duhet të jetë së paku 6 karaktere" : "La nuova password deve essere di almeno 6 caratteri");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        alert("Password changed successfully");
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Error changing password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  const pendingRequests = connections.filter(
    (conn) => conn.status === "pending" && conn.isIncoming === true
  );
  
  const acceptedConnections = connections.filter(
    (conn) => conn.status === "accepted"
  );

  if (loading) {
    return (
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
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>{t.profile.pleaseLogin}</p>
        <Link href={localeLink("/login", locale)}>{t.common.login}</Link>
      </div>
    );
  }

  return (
    <main style={{ background: "#f3f2ef", minHeight: "100vh", paddingTop: "20px", paddingBottom: "60px" }}>
      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "0 24px" }}>
        {/* Profile Header */}
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            marginBottom: "16px",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
          }}
        >
          {/* Cover Image */}
          <div
            key={String(formData.coverImage || user.coverImage || 'no-cover')}
            style={{
              height: "200px",
              background: (formData.coverImage || user.coverImage)
                ? (formData.coverImage || user.coverImage).startsWith('data:')
                  ? `url(${formData.coverImage || user.coverImage}) center/cover`
                  : `url(${formData.coverImage || user.coverImage}) center/cover`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              position: "relative",
            }}
          >
            {editing && (
              <div style={{ position: "absolute", bottom: "16px", right: "16px" }}>
                <label
                  style={{
                    background: "white",
                    padding: "8px 16px",
                    borderRadius: "24px",
                    cursor: uploadingCover ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "inline-block",
                    opacity: uploadingCover ? 0.6 : 1,
                  }}
                >
                  {uploadingCover ? t.profile.uploading : t.profile.changeCover}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, "cover", e.target);
                      }
                    }}
                    disabled={uploadingCover}
                    style={{ display: "none" }}
                    id="cover-image-input"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div style={{ padding: "0 24px 24px", marginTop: "-72px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                {/* Profile Picture */}
                <div style={{ position: "relative", display: "inline-block" }}>
                  <div
                    key={String(formData.profilePicture || user.profilePicture || 'no-image')}
                    style={{
                      width: "168px",
                      height: "168px",
                      borderRadius: "50%",
                      border: "4px solid white",
                      background: (formData.profilePicture || user.profilePicture)
                        ? (formData.profilePicture || user.profilePicture).startsWith('data:')
                          ? `url(${formData.profilePicture || user.profilePicture}) center/cover`
                          : `url(${formData.profilePicture || user.profilePicture}) center/cover`
                        : "#e4e4e4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "64px",
                      color: "#666",
                      marginBottom: "12px",
                      position: "relative",
                    }}
                  >
                    {!(formData.profilePicture || user.profilePicture) && (user.displayName || user.username)?.[0]?.toUpperCase()}
                    {editing && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          right: "0",
                          background: "#0a66c2",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: uploadingProfile ? "not-allowed" : "pointer",
                          opacity: uploadingProfile ? 0.6 : 1,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!uploadingProfile) {
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!uploadingProfile) {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                          }
                        }}
                        onMouseDown={(e) => {
                          if (!uploadingProfile) {
                            e.currentTarget.style.transform = "scale(0.95)";
                          }
                        }}
                        onMouseUp={(e) => {
                          if (!uploadingProfile) {
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                      >
                        <label
                          style={{
                            cursor: uploadingProfile ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          {uploadingProfile ? (
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                border: "2px solid white",
                                borderTop: "2px solid transparent",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                              }}
                            />
                          ) : (
                            <span style={{ color: "white", fontSize: "20px" }}>📷</span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, "profile", e.target);
                              }
                            }}
                            disabled={uploadingProfile}
                            style={{ display: "none" }}
                            id="profile-image-input"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <h1 style={{ fontSize: "32px", fontWeight: "600", margin: "12px 0 4px" }}>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.displayName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, displayName: e.target.value })
                      }
                      placeholder={t.join.fullName}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "32px",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#0a66c2";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#ddd";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  ) : (
                    user.displayName || user.username
                  )}
                </h1>

                {editing ? (
                  <input
                    type="text"
                    value={formData.headline || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, headline: e.target.value })
                    }
                    placeholder={t.profile.headline}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "16px",
                      marginTop: "4px",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0a66c2";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#ddd";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                ) : (
                  <p style={{ fontSize: "16px", color: "#666", margin: "4px 0" }}>
                    {user.headline || user.role_custom || user.organization || "Member"}
                  </p>
                )}

                <p style={{ fontSize: "14px", color: "#666", margin: "4px 0" }}>
                  {user.location && `📍 ${user.location}`}
                  {user.location && user.organization && " • "}
                  {user.organization && user.organization}
                </p>
              </div>

              <div>
                {editing ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData(user);
                      }}
                      style={{
                        padding: "8px 24px",
                        border: "1px solid #666",
                        background: "white",
                        borderRadius: "24px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f5f5";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.95)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                    >
                      {t.profile.cancel}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: "8px 24px",
                        border: "none",
                        background: "#0a66c2",
                        color: "white",
                        borderRadius: "24px",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.background = "#004182";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.background = "#0a66c2";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                      onMouseDown={(e) => {
                        if (!saving) {
                          e.currentTarget.style.transform = "scale(0.95)";
                        }
                      }}
                      onMouseUp={(e) => {
                        if (!saving) {
                          e.currentTarget.style.transform = "scale(1.05)";
                        }
                      }}
                    >
                      {saving ? t.profile.saving : t.profile.saveProfile}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        padding: "8px 24px",
                        border: "1px solid #0a66c2",
                        background: "white",
                        color: "#0a66c2",
                        borderRadius: "24px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e3f0ff";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.95)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                    >
                      {t.profile.editProfile}
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        padding: "8px 24px",
                        border: "1px solid #dc3545",
                        background: "white",
                        color: "#dc3545",
                        borderRadius: "24px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ffe3e3";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.95)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                    >
                      {t.common.logout}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
          {/* Main Content */}
          <div>
            {/* About */}
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "16px",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
                {t.profile.about}
              </h2>
              {editing ? (
                <textarea
                  value={formData.about || ""}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder={t.profile.aboutPlaceholder}
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              ) : (
                <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#666" }}>
                  {user.about || t.profile.noAbout}
                </p>
              )}
            </div>

            {/* Experience */}
            <div
              style={{
                ...getCardStyle(),
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "16px",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "600" }}>{t.profile.experience}</h2>
                {editing && (
                  <button
                    onClick={() => {
                      setEditingExp(null);
                      setShowExpModal(true);
                    }}
                    style={{
                      padding: "6px 16px",
                      border: "1px solid #0a66c2",
                      background: "white",
                      color: "#0a66c2",
                      borderRadius: "24px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {t.profile.addExperience}
                  </button>
                )}
              </div>
              {user.experience && user.experience.length > 0 ? (
                <div>
                  {user.experience.map((exp: any, idx: number) => (
                    <div 
                      key={idx} 
                      style={{ 
                        marginBottom: "16px", 
                        paddingBottom: "16px", 
                        borderBottom: "1px solid #e0e0e0",
                        animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                            {exp.title}
                          </h3>
                          <p style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                            {exp.company}
                          </p>
                          <p style={{ fontSize: "12px", color: "#999" }}>
                            {formatDate(exp.startDate)} - {exp.current ? t.profile.present : formatDate(exp.endDate)}
                          </p>
                          {exp.description && (
                            <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                        {editing && (
                          <div>
                            <button
                              onClick={() => {
                                setEditingExp(exp);
                                setShowExpModal(true);
                              }}
                              style={{
                                padding: "4px 12px",
                                border: "1px solid #ddd",
                                background: "white",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                marginRight: "4px",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#e3f0ff";
                                e.currentTarget.style.borderColor = "#0a66c2";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.borderColor = "#ddd";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                            >
                              {t.profile.edit}
                            </button>
                            <button
                              onClick={() => {
                                const newExp = (formData.experience || []).filter((_: any, i: number) => i !== idx);
                                setFormData({ ...formData, experience: newExp });
                              }}
                              style={{
                                padding: "4px 12px",
                                border: "1px solid #ddd",
                                background: "white",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "#d32f2f",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#ffebee";
                                e.currentTarget.style.borderColor = "#d32f2f";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.borderColor = "#ddd";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                            >
                              {t.profile.delete}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "#666" }}>{t.profile.noExperience}</p>
              )}
            </div>

            {/* Education */}
            <div
              style={{
                ...getCardStyle(),
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "600" }}>{t.profile.education}</h2>
                {editing && (
                  <button
                    onClick={() => {
                      setEditingEdu(null);
                      setShowEduModal(true);
                    }}
                    style={{
                      padding: "6px 16px",
                      border: "1px solid #0a66c2",
                      background: "white",
                      color: "#0a66c2",
                      borderRadius: "24px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#e3f0ff";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = "scale(0.95)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                  >
                    {t.profile.addEducation}
                  </button>
                )}
              </div>
              {user.education && user.education.length > 0 ? (
                <div>
                  {user.education.map((edu: any, idx: number) => (
                    <div 
                      key={idx} 
                      style={{ 
                        marginBottom: "16px", 
                        paddingBottom: "16px", 
                        borderBottom: "1px solid #e0e0e0",
                        animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                            {edu.school}
                          </h3>
                          {edu.degree && (
                            <p style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                              {edu.degree} {edu.field && `in ${edu.field}`}
                            </p>
                          )}
                          <p style={{ fontSize: "12px", color: "#999" }}>
                            {formatDate(edu.startDate)} - {edu.current ? t.profile.present : formatDate(edu.endDate)}
                          </p>
                        </div>
                        {editing && (
                          <div>
                            <button
                              onClick={() => {
                                setEditingEdu(edu);
                                setShowEduModal(true);
                              }}
                              style={{
                                padding: "4px 12px",
                                border: "1px solid #ddd",
                                background: "white",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                marginRight: "4px",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#e3f0ff";
                                e.currentTarget.style.borderColor = "#0a66c2";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.borderColor = "#ddd";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                            >
                              {t.profile.edit}
                            </button>
                            <button
                              onClick={() => {
                                const newEdu = (formData.education || []).filter((_: any, i: number) => i !== idx);
                                setFormData({ ...formData, education: newEdu });
                              }}
                              style={{
                                padding: "4px 12px",
                                border: "1px solid #ddd",
                                background: "white",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "#d32f2f",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#ffebee";
                                e.currentTarget.style.borderColor = "#d32f2f";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.borderColor = "#ddd";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                            >
                              {t.profile.delete}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "#666" }}>{t.profile.noEducation}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Skills */}
            <div
              style={{
                ...getCardStyle(),
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "600" }}>{t.profile.skills}</h2>
              </div>
              {editing ? (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                    {(formData.skills || []).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          padding: "6px 12px",
                          background: "#e3f0ff",
                          color: "#0a66c2",
                          borderRadius: "16px",
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {skill}
                        <button
                          onClick={() => {
                            const newSkills = (formData.skills || []).filter((_: string, i: number) => i !== idx);
                            setFormData({ ...formData, skills: newSkills });
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#0a66c2",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: 0,
                            lineHeight: 1,
                            transition: "all 0.2s ease",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#0a66c2";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "scale(1.2) rotate(90deg)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#0a66c2";
                            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.transform = "scale(0.9) rotate(90deg)";
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.transform = "scale(1.2) rotate(90deg)";
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder={t.profile.addSkillPlaceholder}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          const newSkills = [...(formData.skills || []), e.currentTarget.value.trim()];
                          setFormData({ ...formData, skills: newSkills });
                          e.currentTarget.value = "";
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#0a66c2";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#ddd";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input && input.value.trim()) {
                          const newSkills = [...(formData.skills || []), input.value.trim()];
                          setFormData({ ...formData, skills: newSkills });
                          input.value = "";
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #0a66c2",
                        background: "white",
                        color: "#0a66c2",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#0a66c2";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.color = "#0a66c2";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.95)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                    >
                      {t.profile.addSkill}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {user.skills && user.skills.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {user.skills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: "6px 12px",
                            background: "#e3f0ff",
                            color: "#0a66c2",
                            borderRadius: "16px",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "14px", color: "#666" }}>{t.profile.noSkills}</p>
                  )}
                </>
              )}
            </div>

            {/* Connection Requests */}
            <div
              style={{
                ...getCardStyle(),
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
                {t.profile.connectionRequests} {pendingRequests.length > 0 && `(${pendingRequests.length})`}
              </h2>
              {loadingConnections ? (
                <p style={{ fontSize: "14px", color: "#666" }}>{t.profile.loading}</p>
              ) : pendingRequests.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {pendingRequests.map((conn) => (
                    <div
                      key={conn._id}
                      style={{
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <Link
                          href={localeLink(`/user-profile?id=${conn.user?._id}`, locale)}
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#0a66c2",
                            textDecoration: "none",
                          }}
                        >
                          {conn.user?.displayName || conn.user?.username}
                        </Link>
                        {conn.user?.headline && (
                          <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>
                            {conn.user.headline}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleAcceptConnection(conn._id)}
                          disabled={processingConnection === conn._id}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            border: "none",
                            background: "#0a66c2",
                            color: "white",
                            borderRadius: "16px",
                            cursor: processingConnection === conn._id ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            opacity: processingConnection === conn._id ? 0.6 : 1,
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (processingConnection !== conn._id) {
                              e.currentTarget.style.background = "#004182";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (processingConnection !== conn._id) {
                              e.currentTarget.style.background = "#0a66c2";
                              e.currentTarget.style.transform = "scale(1)";
                            }
                          }}
                        >
                          {processingConnection === conn._id ? "..." : t.profile.accept}
                        </button>
                        <button
                          onClick={() => handleDeclineConnection(conn._id)}
                          disabled={processingConnection === conn._id}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            border: "1px solid #ddd",
                            background: "white",
                            color: "#666",
                            borderRadius: "16px",
                            cursor: processingConnection === conn._id ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            opacity: processingConnection === conn._id ? 0.6 : 1,
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (processingConnection !== conn._id) {
                              e.currentTarget.style.background = "#f5f5f5";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (processingConnection !== conn._id) {
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.transform = "scale(1)";
                            }
                          }}
                        >
                          {t.profile.decline}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "#666" }}>{t.profile.noPendingRequests}</p>
              )}
            </div>

            {/* My Connections */}
            {acceptedConnections.length > 0 && (
              <div
                style={{
                  ...getCardStyle(),
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
                    {t.profile.myConnections} ({acceptedConnections.length})
                  </h2>
                  <button
                    onClick={() => setShowConnectionsModal(true)}
                    style={{
                      padding: "6px 16px",
                      border: "1px solid #0a66c2",
                      background: darkMode ? "#2a2a2a" : "white",
                      color: darkMode ? "#4a9eff" : "#0a66c2",
                      borderRadius: "16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#0a66c2";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode ? "#2a2a2a" : "white";
                      e.currentTarget.style.color = darkMode ? "#4a9eff" : "#0a66c2";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {t.profile.viewAll}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(Array.isArray(acceptedConnections) ? acceptedConnections.slice(0, 5) : []).map((conn) => (
                    <div
                      key={conn._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px",
                        border: darkMode ? "1px solid #3a3a3a" : "1px solid #e0e0e0",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: conn.user?.profilePicture
                            ? `url(${conn.user.profilePicture}) center/cover`
                            : "#e4e4e4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          color: darkMode ? "#a0a0a0" : "#666",
                        }}
                      >
                        {!conn.user?.profilePicture &&
                          (conn.user?.displayName || conn.user?.username)?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Link
                          href={localeLink(`/user-profile?id=${conn.user?._id}`, locale)}
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: darkMode ? "#4a9eff" : "#0a66c2",
                            textDecoration: "none",
                          }}
                        >
                          {conn.user?.displayName || conn.user?.username}
                        </Link>
                        {conn.user?.headline && (
                          <p style={{ fontSize: "12px", color: darkMode ? "#888" : "#666", margin: "2px 0 0" }}>
                            {conn.user.headline}
                          </p>
                        )}
                      </div>
                      <Link
                        href={localeLink(`/chat?userId=${conn.user?._id}`, locale)}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid #0a66c2",
                          background: darkMode ? "#2a2a2a" : "white",
                          color: darkMode ? "#4a9eff" : "#0a66c2",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#0a66c2";
                          e.currentTarget.style.color = "white";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = darkMode ? "#2a2a2a" : "white";
                          e.currentTarget.style.color = darkMode ? "#4a9eff" : "#0a66c2";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {t.profile.message}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "16px",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
                {t.profile.settings}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Dark Mode Toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>{t.profile.darkMode}</h3>
                    <p style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666" }}>{t.profile.darkModeDesc}</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    style={{
                      width: "50px",
                      height: "28px",
                      borderRadius: "14px",
                      background: darkMode ? "#0a66c2" : "#ccc",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.3s ease",
                      padding: "2px",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "white",
                        transition: "all 0.3s ease",
                        transform: darkMode ? "translateX(22px)" : "translateX(0)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>

                {/* Password Reset */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>{t.profile.password}</h3>
                    <p style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666" }}>{t.profile.passwordDesc}</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    style={{
                      padding: "6px 16px",
                      border: "1px solid #0a66c2",
                      background: darkMode ? "#2a2a2a" : "white",
                      color: darkMode ? "#4a9eff" : "#0a66c2",
                      borderRadius: "16px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#0a66c2";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode ? "#2a2a2a" : "white";
                      e.currentTarget.style.color = darkMode ? "#4a9eff" : "#0a66c2";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {t.profile.change}
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Visitors */}
            <div
              style={{
                ...getCardStyle(),
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
                {t.profile.profileVisitors} ({profileVisitors.length})
              </h2>
              {loadingVisitors ? (
                <p style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666" }}>{t.profile.loading}</p>
              ) : profileVisitors.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {profileVisitors.map((visit) => (
                    <div
                      key={visit._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px",
                        border: darkMode ? "1px solid #3a3a3a" : "1px solid #e0e0e0",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: visit.visitor.profilePicture
                            ? `url(${visit.visitor.profilePicture}) center/cover`
                            : "#e4e4e4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          color: darkMode ? "#a0a0a0" : "#666",
                          flexShrink: 0,
                        }}
                      >
                        {!visit.visitor.profilePicture &&
                          (visit.visitor.displayName || visit.visitor.username)?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Link
                          href={localeLink(`/user-profile?id=${visit.visitor._id}`, locale)}
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: darkMode ? "#4a9eff" : "#0a66c2",
                            textDecoration: "none",
                          }}
                        >
                          {visit.visitor.displayName || visit.visitor.username}
                        </Link>
                        <p style={{ fontSize: "12px", color: darkMode ? "#888" : "#999", margin: "2px 0 0" }}>
                          {new Date(visit.visitedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666" }}>
                  {t.profile.noVisitors}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div
              style={{
                ...getCardStyle(),
                borderRadius: "8px",
                padding: "24px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>
                {t.profile.contactInfo}
              </h2>
              {editing ? (
                <div style={{ fontSize: "14px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: darkMode ? "#a0a0a0" : "#666" }}>
                      {t.profile.email}
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      disabled
                      style={{
                        width: "100%",
                        padding: "8px",
                        ...getInputStyle(),
                        borderRadius: "4px",
                        fontSize: "14px",
                        opacity: 0.7,
                      }}
                    />
                    <p style={{ fontSize: "12px", color: darkMode ? "#a0a0a0" : "#999", marginTop: "4px" }}>{t.profile.emailCannotChange}</p>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: darkMode ? "#a0a0a0" : "#666" }}>
                      {t.profile.phone}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890"
                      style={{
                        width: "100%",
                        padding: "8px",
                        ...getInputStyle(),
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: darkMode ? "#a0a0a0" : "#666" }}>
                      {t.profile.website}
                    </label>
                    <input
                      type="url"
                      value={formData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      style={{
                        width: "100%",
                        padding: "8px",
                        ...getInputStyle(),
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: darkMode ? "#a0a0a0" : "#666" }}>
                      {t.profile.linkedin}
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin || ""}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      style={{
                        width: "100%",
                        padding: "8px",
                        ...getInputStyle(),
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: darkMode ? "#a0a0a0" : "#666" }}>
                      {t.profile.twitter}
                    </label>
                    <input
                      type="url"
                      value={formData.twitter || ""}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="https://twitter.com/username"
                      style={{
                        width: "100%",
                        padding: "8px",
                        ...getInputStyle(),
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666" }}>
                  {user.email && <p style={{ marginBottom: "8px" }}>📧 {user.email}</p>}
                  {user.phone && <p style={{ marginBottom: "8px" }}>📱 {user.phone}</p>}
                  {user.website && (
                    <p style={{ marginBottom: "8px" }}>
                      🌐 <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? "#4a9eff" : "#0a66c2" }}>
                        {user.website}
                      </a>
                    </p>
                  )}
                  {user.linkedin && (
                    <p style={{ marginBottom: "8px" }}>
                      💼 <a href={user.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? "#4a9eff" : "#0a66c2" }}>
                        {t.profile.linkedin}
                      </a>
                    </p>
                  )}
                  {user.twitter && (
                    <p style={{ marginBottom: "8px" }}>
                      🐦 <a href={user.twitter} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? "#4a9eff" : "#0a66c2" }}>
                        {t.profile.twitter}
                      </a>
                    </p>
                  )}
                  {!user.phone && !user.website && !user.linkedin && !user.twitter && (
                    <p style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666" }}>{t.profile.noContactInfo}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Experience Modal */}
      {showExpModal && (
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
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => {
            setShowExpModal(false);
            setEditingExp(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "scaleIn 0.2s ease-out",
            }}
          >
            <ExperienceModal
              experience={editingExp}
              t={t}
              onClose={() => {
                setShowExpModal(false);
                setEditingExp(null);
              }}
              onSave={(exp) => {
                let newExp = [...(formData.experience || [])];
                if (editingExp) {
                  const idx = (formData.experience || []).findIndex((e: any) => e === editingExp);
                  if (idx >= 0) {
                    newExp[idx] = exp;
                  }
                } else {
                  newExp.push(exp);
                }
                setFormData({ ...formData, experience: newExp });
                setShowExpModal(false);
                setEditingExp(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Education Modal */}
      {showEduModal && (
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
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => {
            setShowEduModal(false);
            setEditingEdu(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "scaleIn 0.2s ease-out",
            }}
          >
            <EducationModal
              education={editingEdu}
              t={t}
              onClose={() => {
                setShowEduModal(false);
                setEditingEdu(null);
              }}
              onSave={(edu) => {
                let newEdu = [...(formData.education || [])];
                if (editingEdu) {
                  const idx = (formData.education || []).findIndex((e: any) => e === editingEdu);
                  if (idx >= 0) {
                    newEdu[idx] = edu;
                  }
                } else {
                  newEdu.push(edu);
                }
                setFormData({ ...formData, education: newEdu });
                setShowEduModal(false);
                setEditingEdu(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
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
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              animation: "scaleIn 0.2s ease-out",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>
              Reset Password
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                  {t.profile.currentPassword} *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder={t.profile.enterCurrentPassword}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0a66c2";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#ddd";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                  {t.profile.newPassword} *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder={t.profile.enterNewPassword}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0a66c2";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#ddd";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                  {t.profile.confirmPassword} *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder={t.profile.confirmNewPassword}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0a66c2";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#ddd";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  style={{
                    padding: "8px 24px",
                    border: "1px solid #666",
                    background: "white",
                    borderRadius: "24px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f5f5f5";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  style={{
                    padding: "8px 24px",
                    border: "none",
                    background: "#0a66c2",
                    color: "white",
                    borderRadius: "24px",
                    cursor: changingPassword ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    opacity: changingPassword ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!changingPassword) {
                      e.currentTarget.style.background = "#004182";
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(10, 102, 194, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!changingPassword) {
                      e.currentTarget.style.background = "#0a66c2";
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  {changingPassword ? t.profile.changing : t.profile.changePassword}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connections Modal */}
      {showConnectionsModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConnectionsModal(false);
              setShowSortDropdown(false);
            }
          }}
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
            zIndex: 10000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...getCardStyle(),
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "600" }}>
                {t.profile.myConnections} ({acceptedConnections.length})
              </h2>
              <button
                onClick={() => setShowConnectionsModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  color: darkMode ? "#a0a0a0" : "#666",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#f0f0f0";
                  e.currentTarget.style.color = darkMode ? "#e0e0e0" : "#333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = darkMode ? "#a0a0a0" : "#666";
                }}
              >
                ×
              </button>
            </div>

            {/* Search and Sort Controls */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              {/* Search Input */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <input
                  type="text"
                  placeholder={t.profile.searchByName}
                  value={connectionsSearchTerm}
                  onChange={(e) => setConnectionsSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    ...getInputStyle(),
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Sort Dropdown */}
              <div style={{ position: "relative" }} data-sort-dropdown>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666", whiteSpace: "nowrap" }}>
                    {t.profile.sortBy}
                  </span>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      style={{
                        padding: "10px 16px",
                        ...getInputStyle(),
                        borderRadius: "6px",
                        fontSize: "14px",
                        cursor: "pointer",
                        minWidth: "150px",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {connectionsSortBy === "recently" && t.profile.recentlyAdded}
                        {connectionsSortBy === "firstName" && t.profile.firstName}
                        {connectionsSortBy === "lastName" && t.profile.lastName}
                      </span>
                      <span style={{ fontSize: "12px" }}>▼</span>
                    </button>
                    {showSortDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "4px",
                          ...getCardStyle(),
                          borderRadius: "6px",
                          padding: "4px",
                          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.15)",
                          zIndex: 10001,
                        }}
                      >
                        {[
                          { value: "recently", label: t.profile.recentlyAdded },
                          { value: "firstName", label: t.profile.firstName },
                          { value: "lastName", label: t.profile.lastName },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setConnectionsSortBy(option.value as "recently" | "firstName" | "lastName");
                              setShowSortDropdown(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              textAlign: "left",
                              fontSize: "14px",
                              color: darkMode ? "#e0e0e0" : "#333",
                              cursor: "pointer",
                              borderRadius: "4px",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#f0f0f0";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(() => {
                // Filter and sort connections
                let filteredAndSorted = [...acceptedConnections];

                // Filter by search term
                if (connectionsSearchTerm.trim()) {
                  const searchLower = connectionsSearchTerm.toLowerCase();
                  filteredAndSorted = filteredAndSorted.filter((conn) => {
                    const displayName = (conn.user?.displayName || "").toLowerCase();
                    const username = (conn.user?.username || "").toLowerCase();
                    return displayName.includes(searchLower) || username.includes(searchLower);
                  });
                }

                // Sort connections
                filteredAndSorted.sort((a, b) => {
                  if (connectionsSortBy === "recently") {
                    // Sort by connection creation date (most recent first)
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                  } else if (connectionsSortBy === "firstName") {
                    const nameA = (a.user?.displayName || a.user?.username || "").split(" ")[0].toLowerCase();
                    const nameB = (b.user?.displayName || b.user?.username || "").split(" ")[0].toLowerCase();
                    return nameA.localeCompare(nameB);
                  } else if (connectionsSortBy === "lastName") {
                    const nameA = (a.user?.displayName || a.user?.username || "").split(" ").slice(-1)[0].toLowerCase();
                    const nameB = (b.user?.displayName || b.user?.username || "").split(" ").slice(-1)[0].toLowerCase();
                    return nameA.localeCompare(nameB);
                  }
                  return 0;
                });

                return filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((conn) => (
                  <div
                    key={conn._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      border: darkMode ? "1px solid #3a3a3a" : "1px solid #e0e0e0",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#f5f5f5";
                      e.currentTarget.style.borderColor = darkMode ? "#4a4a4a" : "#0a66c2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = darkMode ? "#3a3a3a" : "#e0e0e0";
                    }}
                  >
                    <Link
                      href={localeLink(`/user-profile?id=${conn.user?._id}`, locale)}
                      style={{
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          background: conn.user?.profilePicture
                            ? `url(${conn.user.profilePicture}) center/cover`
                            : "#e4e4e4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          color: darkMode ? "#a0a0a0" : "#666",
                          flexShrink: 0,
                          cursor: "pointer",
                          transition: "transform 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {!conn.user?.profilePicture &&
                          (conn.user?.displayName || conn.user?.username)?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: darkMode ? "#e0e0e0" : "#333",
                            marginBottom: "4px",
                          }}
                        >
                          {conn.user?.displayName || conn.user?.username}
                        </div>
                        {conn.user?.headline && (
                          <p style={{ fontSize: "14px", color: darkMode ? "#888" : "#666", margin: 0 }}>
                            {conn.user.headline}
                          </p>
                        )}
                      </div>
                    </Link>
                    <Link
                      href={localeLink(`/user-profile?id=${conn.user?._id}`, locale)}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #0a66c2",
                        background: darkMode ? "#2a2a2a" : "white",
                        color: darkMode ? "#4a9eff" : "#0a66c2",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#0a66c2";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? "#2a2a2a" : "white";
                        e.currentTarget.style.color = darkMode ? "#4a9eff" : "#0a66c2";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {t.profile.viewProfile}
                    </Link>
                    <Link
                      href={localeLink(`/chat?userId=${conn.user?._id}`, locale)}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #0a66c2",
                        background: "#0a66c2",
                        color: "white",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#004182";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#0a66c2";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {t.profile.message}
                    </Link>
                    {/* 3 Dots Menu */}
                    <div style={{ position: "relative" }} data-connection-menu>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConnectionMenu(showConnectionMenu === conn._id ? null : conn._id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: "20px",
                          color: darkMode ? "#a0a0a0" : "#666",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#f0f0f0";
                          e.currentTarget.style.color = darkMode ? "#e0e0e0" : "#333";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = darkMode ? "#a0a0a0" : "#666";
                        }}
                      >
                        ⋯
                      </button>
                      {showConnectionMenu === conn._id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "4px",
                            ...getCardStyle(),
                            borderRadius: "6px",
                            padding: "4px",
                            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.15)",
                            zIndex: 10002,
                            minWidth: "180px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(t.profile.areYouSureRemove)) {
                                setRemovingConnection(conn._id);
                                try {
                                  const res = await fetch("/api/connections/remove", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ connectionId: conn._id }),
                                  });
                                  if (res.ok) {
                                    await loadConnections();
                                    setShowConnectionMenu(null);
                                  } else {
                                    const error = await res.json();
                                    alert(error.error || (locale === "en" ? "Failed to remove connection" : locale === "me" ? "Neuspješno uklanjanje veze" : locale === "sq" ? "Dështoi heqja e lidhjes" : "Impossibile rimuovere la connessione"));
                                  }
                                } catch (error) {
                                  console.error("Error removing connection:", error);
                                  alert(locale === "en" ? "Error removing connection" : locale === "me" ? "Greška pri uklanjanju veze" : locale === "sq" ? "Gabim gjatë heqjes së lidhjes" : "Errore durante la rimozione della connessione");
                                } finally {
                                  setRemovingConnection(null);
                                }
                              }
                            }}
                            disabled={removingConnection === conn._id}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              textAlign: "left",
                              fontSize: "14px",
                              color: "#e63946",
                              cursor: removingConnection === conn._id ? "not-allowed" : "pointer",
                              borderRadius: "4px",
                              transition: "all 0.2s ease",
                              opacity: removingConnection === conn._id ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (removingConnection !== conn._id) {
                                e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#f0f0f0";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {removingConnection === conn._id ? t.profile.removing : t.profile.removeConnection}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <p style={{ fontSize: "14px", color: darkMode ? "#a0a0a0" : "#666", textAlign: "center", padding: "20px" }}>
                    {connectionsSearchTerm.trim() ? t.profile.noConnectionsFound : t.profile.noConnections}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Experience Modal Component
function ExperienceModal({
  experience,
  t,
  onClose,
  onSave,
}: {
  experience: any;
  t: any;
  onClose: () => void;
  onSave: (exp: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: experience?.title || "",
    company: experience?.company || "",
    location: experience?.location || "",
    startDate: experience?.startDate || "",
    endDate: experience?.endDate || "",
    current: experience?.current || false,
    description: experience?.description || "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: "8px",
        padding: "24px",
        width: "90%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>
        {experience ? t.profile.editExperienceTitle : t.profile.addExperienceTitle}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            {t.profile.title} *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0a66c2";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            {t.profile.company} *
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0a66c2";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            {t.profile.location}
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0a66c2";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 102, 194, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{ marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
              {t.profile.startDate} *
            </label>
            <input
              type="month"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
              {t.profile.endDate}
            </label>
            <input
              type="month"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              disabled={formData.current}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                opacity: formData.current ? 0.5 : 1,
              }}
            />
          </div>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={formData.current}
              onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: e.target.checked ? "" : formData.endDate })}
            />
            {t.profile.current}
          </label>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            {t.profile.description}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 24px",
              border: "1px solid #666",
              background: "white",
              borderRadius: "24px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {t.profile.cancel}
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 24px",
              border: "none",
              background: "#0a66c2",
              color: "white",
              borderRadius: "24px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#004182";
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(10, 102, 194, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0a66c2";
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
          >
            {t.cms.save}
          </button>
        </div>
      </form>
    </div>
  );
}

// Education Modal Component
function EducationModal({
  education,
  t,
  onClose,
  onSave,
}: {
  education: any;
  t: any;
  onClose: () => void;
  onSave: (edu: any) => void;
}) {
  const [formData, setFormData] = useState({
    school: education?.school || "",
    degree: education?.degree || "",
    field: education?.field || "",
    startDate: education?.startDate || "",
    endDate: education?.endDate || "",
    current: education?.current || false,
    description: education?.description || "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: "8px",
        padding: "24px",
        width: "90%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
        <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>
          {education ? t.profile.editEducationTitle : t.profile.addEducationTitle}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
              {t.profile.school} *
            </label>
          <input
            type="text"
            value={formData.school}
            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
        </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
              {t.profile.degree}
            </label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
              {t.profile.fieldOfStudy}
            </label>
          <input
            type="text"
            value={formData.field}
            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
        </div>
        <div style={{ marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                {t.profile.startDate} *
              </label>
              <input
                type="month"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                {t.profile.endDate}
              </label>
              <input
                type="month"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={formData.current}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  opacity: formData.current ? 0.5 : 1,
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={formData.current}
                onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: e.target.checked ? "" : formData.endDate })}
              />
              {t.profile.currentStudy}
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 24px",
                border: "1px solid #666",
                background: "white",
                borderRadius: "24px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {t.profile.cancel}
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 24px",
                border: "none",
                background: "#0a66c2",
                color: "white",
                borderRadius: "24px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {t.cms.save}
            </button>
          </div>
      </form>
    </div>
  );
}
