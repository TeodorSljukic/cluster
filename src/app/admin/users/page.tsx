"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { AdminGuard } from "@/components/AdminGuard";
import { getTranslations } from "@/lib/getTranslations";
import { defaultLocale, type Locale } from "@/lib/i18n";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  displayName?: string;
  organization?: string;
  location?: string;
  country?: string;
  city?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  headline?: string;
  about?: string;
  profilePicture?: string;
  coverImage?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState<string | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ userId: string; link: string } | null>(null);
  const [cmsLocale, setCmsLocale] = useState<Locale>(defaultLocale);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserRole, setCreateUserRole] = useState("user");
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{ username: string; password: string } | null>(null);

  const t = getTranslations(cmsLocale);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    // Load CMS locale from localStorage
    const savedLocale = localStorage.getItem("cms-locale") as Locale;
    if (savedLocale) {
      setCmsLocale(savedLocale);
    }
    // Listen for locale changes
    const handleLocaleChange = () => {
      const newLocale = localStorage.getItem("cms-locale") as Locale;
      if (newLocale) {
        setCmsLocale(newLocale);
      }
    };
    window.addEventListener("cms-locale-changed", handleLocaleChange);
    return () => {
      window.removeEventListener("cms-locale-changed", handleLocaleChange);
    };
  }, [loadUsers]);

  const handleResetPassword = useCallback(async (userId: string, email: string) => {
    console.log("[RESET PASSWORD] Starting reset password for user:", userId, email);
    
    if (!confirm(`${t.adminUsers.generateResetLink} ${email}?`)) {
      console.log("[RESET PASSWORD] User cancelled");
      return;
    }

    setResetPasswordLoading(userId);
    setResetPasswordResult(null);
    
    try {
      console.log("[RESET PASSWORD] Making API request to:", `/api/admin/users/${userId}/reset-password`);
      
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      console.log("[RESET PASSWORD] Response status:", res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("[RESET PASSWORD] Error response:", errorData);
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log("[RESET PASSWORD] Success response:", data);
      if (res.ok) {
        setResetPasswordResult({ userId, link: data.resetLink });
        
        // Show message based on email sending status
        if (data.emailSent) {
          alert(`${t.adminUsers.resetLinkGenerated}\n\nEmail has been sent to ${data.email}.`);
        } else if (data.emailSent === false) {
          // Email failed, show link to copy
          try {
            await navigator.clipboard.writeText(data.resetLink);
            alert(`${t.adminUsers.resetLinkGenerated}\n\nEmail sending failed. Link copied to clipboard:\n${data.resetLink}`);
          } catch (err) {
            alert(`${t.adminUsers.resetLinkGenerated}\n\nEmail sending failed. Please copy this link manually:\n${data.resetLink}`);
          }
        } else {
          // Fallback for old API responses
          try {
            await navigator.clipboard.writeText(data.resetLink);
            alert(`${t.adminUsers.resetLinkGenerated}\n\n${t.adminUsers.copyLink}`);
          } catch (err) {
            alert(`${t.adminUsers.resetLinkGeneratedNoCopy}\n\n${t.adminUsers.copyLink}`);
          }
        }
      } else {
        alert(`${t.adminUsers.errorGeneratingLink}: ${data.error || t.adminUsers.failedToGenerate}`);
      }
    } catch (error: any) {
      console.error("[RESET PASSWORD] Error sending reset password:", error);
      console.error("[RESET PASSWORD] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      alert(`${t.adminUsers.failedToGenerate}\n\nError: ${error?.message || "Unknown error"}`);
    } finally {
      setResetPasswordLoading(null);
    }
  }, [t.adminUsers.generateResetLink, t.adminUsers.resetLinkGenerated, t.adminUsers.copyLink, t.adminUsers.resetLinkGeneratedNoCopy, t.adminUsers.errorGeneratingLink, t.adminUsers.failedToGenerate]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t.adminUsers.confirmDelete)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }, [t.adminUsers.confirmDelete, loadUsers]);

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  }


  const handleToggleCreateForm = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCreateForm(!showCreateForm);
  }, [showCreateForm]);

  const handleViewDetailsClick = useCallback((userId: string) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setExpandedUser(prev => prev === userId ? null : userId);
    };
  }, []);

  const handleResetPasswordClick = useCallback((userId: string, email: string) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[RESET PASSWORD BUTTON] Clicked for user:", userId, email);
      handleResetPassword(userId, email).catch((err) => {
        console.error("[RESET PASSWORD BUTTON] Unhandled error:", err);
      });
    };
  }, [handleResetPassword]);

  const handleDeleteClick = useCallback((userId: string) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleDelete(userId);
    };
  }, [handleDelete]);

  return (
    <AdminGuard>
      <CMSLayout>
      <div className="cms-form-container" style={{ background: "white", padding: "20px", borderRadius: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "23px", fontWeight: "400" }}>
            {t.adminUsers.title}
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleToggleCreateForm}
              style={{
                padding: "8px 16px",
                background: "#2271b1",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                position: "relative",
                zIndex: 10000,
                pointerEvents: "auto",
              }}
            >
              {showCreateForm ? t.adminUsers.cancelCreate : t.adminUsers.createUser}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div style={{
            background: "#f6f7f7",
            padding: "20px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #c3c4c7"
          }}>
            <h2 style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "600" }}>
              {t.adminUsers.createNewUser}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!createUserEmail) {
                  alert(t.adminUsers.emailRequired);
                  return;
                }

                setCreateUserLoading(true);
                setCreatedUserCredentials(null);

                try {
                  const res = await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: createUserEmail,
                      role: createUserRole,
                      sendPasswordEmail: true,
                    }),
                  });

                  const data = await res.json();

                  if (res.ok && data.success) {
                    if (data.emailSent) {
                      alert(`${t.adminUsers.userCreatedSuccess}\n\n${t.adminUsers.credentialsSentTo} ${createUserEmail}`);
                    } else {
                      // Email failed, show credentials
                      setCreatedUserCredentials({
                        username: data.user.username,
                        password: data.password,
                      });
                      alert(`${t.adminUsers.userCreatedSuccess}\n\n${t.adminUsers.emailFailed}: ${data.emailError || "Unknown error"}\n\n${t.adminUsers.credentialsBelow}`);
                    }
                    setCreateUserEmail("");
                    setCreateUserRole("user");
                    loadUsers();
                  } else {
                    alert(`${t.adminUsers.errorCreatingUser}: ${data.error || "Unknown error"}`);
                  }
                } catch (error: any) {
                  alert(`${t.adminUsers.errorCreatingUser}: ${error.message || "Unknown error"}`);
                } finally {
                  setCreateUserLoading(false);
                }
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "500" }}>
                  {t.adminUsers.email} *
                </label>
                <input
                  type="email"
                  value={createUserEmail}
                  onChange={(e) => setCreateUserEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "8px 12px",
                    border: "1px solid #8c8f94",
                    borderRadius: "3px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "500" }}>
                  {t.adminUsers.role}
                </label>
                <select
                  value={createUserRole}
                  onChange={(e) => setCreateUserRole(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #8c8f94",
                    borderRadius: "3px",
                    fontSize: "14px",
                  }}
                >
                  <option value="user">{t.adminUsers.user}</option>
                  <option value="editor">{t.adminUsers.editor}</option>
                  <option value="moderator">{t.adminUsers.moderator}</option>
                  <option value="admin">{t.adminUsers.admin}</option>
                </select>
              </div>
              {createdUserCredentials && (
                <div style={{
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "4px",
                  padding: "15px",
                  marginBottom: "15px",
                }}>
                  <strong style={{ display: "block", marginBottom: "10px" }}>
                    {t.adminUsers.userCredentials}:
                  </strong>
                  <div style={{ marginBottom: "5px" }}>
                    <strong>{t.adminUsers.username}:</strong> {createdUserCredentials.username}
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <strong>{t.adminUsers.password}:</strong> {createdUserCredentials.password}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `${t.adminUsers.username}: ${createdUserCredentials.username}\n${t.adminUsers.password}: ${createdUserCredentials.password}`;
                      navigator.clipboard.writeText(text);
                      alert(t.adminUsers.credentialsCopied);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "#2271b1",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {t.adminUsers.copyCredentials}
                  </button>
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    padding: "8px 16px",
                    background: createUserLoading ? "#ccc" : "#2271b1",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: createUserLoading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                    position: "relative",
                    zIndex: 10000,
                    pointerEvents: createUserLoading ? "none" : "auto",
                  }}
                >
                  {createUserLoading ? t.adminUsers.creating : t.adminUsers.createUser}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCreateForm(false);
                    setCreateUserEmail("");
                    setCreateUserRole("user");
                    setCreatedUserCredentials(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "white",
                    color: "#50575e",
                    border: "1px solid #8c8f94",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "13px",
                    position: "relative",
                    zIndex: 10000,
                    pointerEvents: "auto",
                  }}
                >
                  {t.adminUsers.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>{t.adminUsers.loading}</p>
        ) : (
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
                    fontSize: "13px",
                    color: "#50575e",
                  }}
                >
                  {t.adminUsers.username}
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "13px",
                    color: "#50575e",
                  }}
                >
                  {t.adminUsers.email}
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "13px",
                    color: "#50575e",
                  }}
                >
                  {t.adminUsers.role}
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "13px",
                    color: "#50575e",
                  }}
                >
                  {t.adminUsers.organization}
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    fontWeight: "400",
                    fontSize: "13px",
                    color: "#50575e",
                  }}
                >
                  {t.adminUsers.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <React.Fragment key={user._id}>
                  <tr
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
                      <strong style={{ fontSize: "14px" }}>
                        {user.displayName || user.username}
                      </strong>
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px" }}>{user.email}</td>
                    <td style={{ padding: "10px" }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "13px",
                          border: "1px solid #8c8f94",
                          borderRadius: "3px",
                        }}
                      >
                        <option value="user">{t.adminUsers.user}</option>
                        <option value="editor">{t.adminUsers.editor}</option>
                        <option value="moderator">{t.adminUsers.moderator}</option>
                        <option value="admin">{t.adminUsers.admin}</option>
                      </select>
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#50575e" }}>
                      {user.organization || "-"}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={handleViewDetailsClick(user._id)}
                          style={{
                            background: expandedUser === user._id ? "#2271b1" : "transparent",
                            border: "1px solid #2271b1",
                            color: expandedUser === user._id ? "white" : "#2271b1",
                            cursor: "pointer",
                            fontSize: "13px",
                            padding: "4px 8px",
                            borderRadius: "3px",
                            position: "relative",
                            zIndex: 10000,
                            pointerEvents: "auto",
                          }}
                        >
                          {expandedUser === user._id ? t.adminUsers.hideDetails : t.adminUsers.viewDetails}
                        </button>
                        <button
                          type="button"
                          onClick={handleResetPasswordClick(user._id, user.email)}
                          disabled={resetPasswordLoading === user._id}
                          style={{
                            background: "transparent",
                            border: "1px solid #2271b1",
                            color: "#2271b1",
                            cursor: resetPasswordLoading === user._id ? "not-allowed" : "pointer",
                            fontSize: "13px",
                            padding: "4px 8px",
                            borderRadius: "3px",
                            opacity: resetPasswordLoading === user._id ? 0.6 : 1,
                            position: "relative",
                            zIndex: 10000,
                            pointerEvents: resetPasswordLoading === user._id ? "none" : "auto",
                          }}
                        >
                          {resetPasswordLoading === user._id ? t.adminUsers.sending : t.adminUsers.resetPassword}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteClick(user._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#b32d2e",
                            cursor: "pointer",
                            fontSize: "13px",
                            padding: "0 5px",
                            textDecoration: "underline",
                            position: "relative",
                            zIndex: 10000,
                            pointerEvents: "auto",
                          }}
                        >
                          {t.adminUsers.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUser === user._id && (
                  <tr>
                    <td colSpan={5} style={{ padding: "20px", background: "#f6f7f7" }}>
                      {resetPasswordResult && resetPasswordResult.userId === user._id && (
                        <div style={{
                          padding: "12px",
                          background: "#e8f5e9",
                          border: "1px solid #4caf50",
                          borderRadius: "6px",
                          marginBottom: "20px",
                          fontSize: "13px"
                        }}>
                          <div style={{ fontWeight: "600", marginBottom: "8px", color: "#2e7d32" }}>
                            {t.adminUsers.passwordResetLinkGenerated}
                          </div>
                          <div style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            background: "white",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd"
                          }}>
                            <input
                              type="text"
                              value={resetPasswordResult.link}
                              readOnly
                              style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                fontSize: "12px",
                                fontFamily: "monospace"
                              }}
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(resetPasswordResult.link);
                                alert(t.adminUsers.linkCopied);
                              }}
                              style={{
                                padding: "4px 8px",
                                background: "#2271b1",
                                color: "white",
                                border: "none",
                                borderRadius: "3px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              {t.adminUsers.copy}
                            </button>
                          </div>
                          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                            {t.adminUsers.sendLinkTo} {user.email}
                          </div>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>{t.adminUsers.basicInformation}</h3>
                          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                            <div><strong>{t.adminUsers.username}:</strong> {user.username}</div>
                            <div><strong>{t.adminUsers.email}:</strong> {user.email}</div>
                            <div><strong>{t.adminUsers.displayName}:</strong> {user.displayName || "-"}</div>
                            <div><strong>{t.adminUsers.role}:</strong> {user.role}</div>
                            <div><strong>{t.adminUsers.created}:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}</div>
                            {user.updatedAt && (
                              <div><strong>{t.adminUsers.lastUpdated}:</strong> {new Date(user.updatedAt).toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>{t.adminUsers.contactInformation}</h3>
                          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                            <div><strong>{t.adminUsers.phone}:</strong> {user.phone || "-"}</div>
                            <div><strong>{t.adminUsers.website}:</strong> {user.website ? <a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a> : "-"}</div>
                            <div><strong>{t.adminUsers.linkedin}:</strong> {user.linkedin ? <a href={user.linkedin} target="_blank" rel="noopener noreferrer">{user.linkedin}</a> : "-"}</div>
                            <div><strong>{t.adminUsers.twitter}:</strong> {user.twitter ? <a href={user.twitter} target="_blank" rel="noopener noreferrer">{user.twitter}</a> : "-"}</div>
                          </div>
                        </div>

                        <div>
                          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>{t.adminUsers.location}</h3>
                          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                            <div><strong>{t.adminUsers.location}:</strong> {user.location || "-"}</div>
                            <div><strong>{t.adminUsers.country}:</strong> {user.country || "-"}</div>
                            <div><strong>{t.adminUsers.city}:</strong> {user.city || "-"}</div>
                            <div><strong>{t.adminUsers.organization}:</strong> {user.organization || "-"}</div>
                          </div>
                        </div>

                        <div>
                          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>{t.adminUsers.profile}</h3>
                          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                            <div><strong>{t.adminUsers.headline}:</strong> {user.headline || "-"}</div>
                            <div style={{ marginTop: "10px" }}>
                              <strong>{t.adminUsers.about}:</strong>
                              <div style={{ marginTop: "5px", padding: "10px", background: "white", borderRadius: "4px", maxHeight: "200px", overflow: "auto" }}>
                                {user.about ? (
                                  <div dangerouslySetInnerHTML={{ __html: user.about }} />
                                ) : (
                                  "-"
                                )}
                              </div>
                            </div>
                            {user.profilePicture && (
                              <div style={{ marginTop: "10px" }}>
                                <strong>{t.adminUsers.profilePicture}:</strong>
                                <div style={{ marginTop: "5px" }}>
                                  <img src={user.profilePicture} alt="Profile" style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "50%" }} />
                                </div>
                              </div>
                            )}
                            {user.coverImage && (
                              <div style={{ marginTop: "10px" }}>
                                <strong>{t.adminUsers.coverImage}:</strong>
                                <div style={{ marginTop: "5px" }}>
                                  <img src={user.coverImage} alt="Cover" style={{ maxWidth: "200px", maxHeight: "100px", borderRadius: "4px" }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {user.skills && user.skills.length > 0 && (
                          <div>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>{t.adminUsers.skills}</h3>
                            <div style={{ fontSize: "13px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                {user.skills.map((skill, idx) => (
                                  <span key={idx} style={{ padding: "4px 8px", background: "#e0e0e0", borderRadius: "3px" }}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {user.experience && user.experience.length > 0 && (
                          <div>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>{t.adminUsers.experience} ({user.experience.length})</h3>
                            <div style={{ fontSize: "13px", maxHeight: "200px", overflow: "auto" }}>
                              {user.experience.map((exp: any, idx: number) => (
                                <div key={idx} style={{ marginBottom: "10px", padding: "10px", background: "white", borderRadius: "4px" }}>
                                  <div><strong>{exp.title || "-"}</strong></div>
                                  <div>{exp.company || exp.organization || "-"}</div>
                                  {exp.location && <div style={{ fontSize: "12px", color: "#666" }}>{exp.location}</div>}
                                  <div style={{ fontSize: "12px", color: "#666" }}>
                                    {exp.startDate || "-"} - {exp.endDate || (exp.current ? t.adminUsers.present : "-")}
                                  </div>
                                  {exp.description && (
                                    <div style={{ marginTop: "5px", fontSize: "12px" }}>
                                      <div dangerouslySetInnerHTML={{ __html: exp.description }} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {user.education && user.education.length > 0 && (
                          <div>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>{t.adminUsers.education} ({user.education.length})</h3>
                            <div style={{ fontSize: "13px", maxHeight: "200px", overflow: "auto" }}>
                              {user.education.map((edu: any, idx: number) => (
                                <div key={idx} style={{ marginBottom: "10px", padding: "10px", background: "white", borderRadius: "4px" }}>
                                  <div><strong>{edu.school || "-"}</strong></div>
                                  <div>{edu.degree || edu.field || "-"}</div>
                                  <div style={{ fontSize: "12px", color: "#666" }}>
                                    {edu.startDate || "-"} - {edu.endDate || (edu.current ? t.adminUsers.present : "-")}
                                  </div>
                                  {edu.description && (
                                    <div style={{ marginTop: "5px", fontSize: "12px" }}>
                                      <div dangerouslySetInnerHTML={{ __html: edu.description }} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {!loading && users.length === 0 && (
          <p style={{ marginTop: "2rem", color: "#666" }}>{t.adminUsers.noUsersFound}</p>
        )}
      </div>
      </CMSLayout>
    </AdminGuard>
  );
}
