"use client";

import { useState, useEffect } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { AdminGuard } from "@/components/AdminGuard";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  displayName?: string;
  organization?: string;
  location?: string;
  createdAt?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
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
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

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

  return (
    <AdminGuard>
      <CMSLayout>
      <div className="cms-form-container" style={{ background: "white", padding: "20px", borderRadius: "4px" }}>
        <h1 style={{ margin: "0 0 20px 0", fontSize: "23px", fontWeight: "400" }}>
          Users
        </h1>

        {loading ? (
          <p>Loading...</p>
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
                  Username
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
                  Email
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
                  Role
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
                  Organization
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
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
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: "10px", fontSize: "13px", color: "#50575e" }}>
                    {user.organization || "-"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <button
                      onClick={() => handleDelete(user._id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#b32d2e",
                        cursor: "pointer",
                        fontSize: "13px",
                        padding: "0 5px",
                        textDecoration: "underline",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {!loading && users.length === 0 && (
          <p style={{ marginTop: "2rem", color: "#666" }}>No users found.</p>
        )}
      </div>
      </CMSLayout>
    </AdminGuard>
  );
}
