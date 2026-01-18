"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    organization: "",
    city: "",
    region: "",
    country: "",
    role_custom: "Student",
    interests: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const locale = pathname?.match(/^\/([^\/]+)/)?.[1] || "me";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          location: formData.city ? `${formData.city}, ${formData.region}, ${formData.country}` : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ Registracija uspješna! Preusmjeravam...");
        setTimeout(() => {
          router.push(`/${locale}/dashboard`);
          router.refresh();
        }, 1500);
      } else {
        setError(`❌ Greška: ${data.error}`);
      }
    } catch (error) {
      setError("❌ Greška pri registraciji. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="register-wrapper">
        <h2 className="register-title">Registracija</h2>

        {error && <p className="register-error">{error}</p>}
        {success && <p className="register-success">{success}</p>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Korisničko ime</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Lozinka</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="organization">Organizacija</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">Grad</label>
            <input
              type="text"
              id="city"
              name="city"
              placeholder="Beograd, Podgorica"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="region">Region</label>
            <input
              type="text"
              id="region"
              name="region"
              placeholder="Centralna Srbija, Primorje"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="country">Država</label>
            <input
              type="text"
              id="country"
              name="country"
              placeholder="Serbia, Montenegro"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role_custom">Uloga</label>
            <select
              id="role_custom"
              name="role_custom"
              value={formData.role_custom}
              onChange={(e) => setFormData({ ...formData, role_custom: e.target.value })}
            >
              <option value="Student">Student</option>
              <option value="Researcher">Researcher</option>
              <option value="Manager">Manager</option>
              <option value="Policy Maker">Policy Maker</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="interests">Interesovanja</label>
            <input
              type="text"
              id="interests"
              name="interests"
              placeholder="Blue Economy, Sustainability"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-register" disabled={loading}>
            {loading ? "Registrujem..." : "Registruj se"}
          </button>
        </form>

        <p className="register-login-link">
          Već imaš nalog? <a href={`/${locale}/login`}>Uloguj se ovdje</a>
        </p>
      </div>
    </main>
  );
}
