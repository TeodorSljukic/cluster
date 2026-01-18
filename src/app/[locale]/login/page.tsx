"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const locale = pathname?.match(/^\/([^\/]+)/)?.[1] || "me";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect all logged in users to dashboard with locale
        router.push(`/${locale}/dashboard`);
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="login-wrapper">
        <h2 className="login-title">Login</h2>

        {error && <p className="login-error">❌ {error}</p>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Korisničko ime ili Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Lozinka</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Ulogujem se..." : "Uloguj se"}
          </button>
        </form>

        <p className="login-register-link">
          Nemaš nalog? <a href={`/${locale}/register`}>Registruj se ovdje</a>
        </p>
      </div>
    </main>
  );
}
