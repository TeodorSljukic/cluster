"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Locale } from "@/lib/i18n";
import { getTranslations } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";

interface RegisterFormProps {
  locale: Locale;
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const t = getTranslations(locale);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as "admin" | "moderator" | "editor" | "user",
    organization: "",
    city: "",
    region: "",
    country: "",
    role_custom: "Student",
    interests: "",
    platforms: [] as string[],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const selectedPlatforms = formData.platforms.filter(p => p !== "all");
      console.log("📤 Sending registration request:", {
        username: formData.username,
        email: formData.email,
        selectedPlatforms: selectedPlatforms,
        platformsCount: selectedPlatforms.length,
        willRegisterOn: {
          lms: selectedPlatforms.includes("lms") || selectedPlatforms.length === 0,
          ecommerce: selectedPlatforms.includes("ecommerce") || selectedPlatforms.length === 0,
          dms: selectedPlatforms.includes("dms") || selectedPlatforms.length === 0,
        }
      });
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          location: formData.city ? `${formData.city}, ${formData.region}, ${formData.country}` : undefined,
          selectedPlatforms: selectedPlatforms,
          role: formData.role, // Explicitly send role
        }),
      });

      const data = await res.json();
      
      console.log("📥 Registration response:", {
        ok: res.ok,
        status: res.status,
        registrations: data.registrations,
        warnings: data.warnings,
        partialSuccess: data.partialSuccess,
      });

      if (res.ok) {
        // Log registration results
        if (data.registrations) {
          console.log("📊 Registration results:", {
            lms: data.registrations.lms?.success ? "✅ CREATED" : `❌ FAILED: ${data.registrations.lms?.error || "Unknown"}`,
            ecommerce: data.registrations.ecommerce?.success ? "✅ CREATED" : `❌ FAILED: ${data.registrations.ecommerce?.error || "Unknown"}`,
            dms: data.registrations.dms?.success ? "✅ CREATED" : `❌ FAILED: ${data.registrations.dms?.error || "Unknown"}`,
          });
        }
        
        // Check if there are warnings (partial success)
        if (data.warnings && data.warnings.length > 0) {
          // Build detailed message showing what succeeded and what failed
          const succeeded = [];
          const failed = [];
          
          if (data.registrations?.lms?.success) {
            succeeded.push("✅ LMS");
          } else if (data.registrations?.lms?.error) {
            failed.push(`❌ LMS: ${data.registrations.lms.error}`);
          }
          
          if (data.registrations?.ecommerce?.success) {
            succeeded.push("✅ Ecommerce");
          } else if (data.registrations?.ecommerce?.error) {
            failed.push(`❌ Ecommerce: ${data.registrations.ecommerce.error}`);
          }
          
          if (data.registrations?.dms?.success) {
            succeeded.push("✅ DMS");
          } else if (data.registrations?.dms?.error) {
            failed.push(`❌ DMS: ${data.registrations.dms.error}`);
          }
          
          const warningMessage = `⚠️ Registracija delimično uspješna:\n\n${succeeded.length > 0 ? "Uspješno kreiran na:\n" + succeeded.join("\n") + "\n\n" : ""}${failed.length > 0 ? "Neuspješno:\n" + failed.join("\n") + "\n\n" : ""}Možete se prijaviti i koristiti platforme na kojima ste kreirani.`;
          
          // Use success style if at least one succeeded
          if (succeeded.length > 0) {
            setSuccess(warningMessage);
          } else {
            setError(warningMessage);
          }
          
          // Still allow login after a delay
          setTimeout(() => {
            router.push(localeLink("/dashboard", locale));
            router.refresh();
          }, 3000);
        } else {
          const successMessage = `✅ Registracija uspješna!\n\nKorisnik kreiran na:\n${
            data.registrations?.lms?.success ? "✅ LMS\n" : ""
          }${
            data.registrations?.ecommerce?.success ? "✅ Ecommerce\n" : ""
          }${
            data.registrations?.dms?.success ? "✅ DMS\n" : ""
          }`;
          setSuccess(successMessage);
          setTimeout(() => {
            router.push(localeLink("/dashboard", locale));
            router.refresh();
          }, 1500);
        }
      } else {
        setError(`❌ Greška: ${data.error || data.message || "Nešto je pošlo po zlu"}`);
      }
    } catch (error) {
      setError("❌ Greška pri registraciji. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  }

  const isPlatformChecked = (platformId: string) => {
    if (platformId === "all") {
      return formData.platforms.length === 3 && 
        formData.platforms.includes("lms") && 
        formData.platforms.includes("ecommerce") && 
        formData.platforms.includes("dms");
    }
    return formData.platforms.includes(platformId);
  };

  const platformOptions = [
    { 
      id: "lms", 
      label: t.platform.elearning || "eLearning", 
      image: "/wp-content/uploads/2025/09/Frame-1000002235.webp"
    },
    { 
      id: "ecommerce", 
      label: t.platform.ecommerce || "eCommerce", 
      image: "/wp-content/uploads/2025/09/Frame-1000002234.webp"
    },
    { 
      id: "dms", 
      label: t.platform.documents || "Documents", 
      image: "/wp-content/uploads/2025/09/Frame-10000022262.webp"
    },
    { 
      id: "all", 
      label: t.join.allPlatforms || "Sve platforme"
    }
  ];

  return (
    <section style={{ 
      padding: "60px 20px 80px",
      background: "#FFFFFF",
      minHeight: "100vh"
    }}>
      <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Main Content: Form Left, Logo Right */}
        <div style={{ 
          display: "flex", 
          alignItems: "flex-start",
          gap: "60px",
          marginBottom: "80px"
        }}>
          {/* Left Side - Form */}
          <div style={{ flex: "1", maxWidth: "500px" }}>
            <h1 style={{ 
              fontSize: "32px", 
              fontWeight: "600", 
              color: "#52484C",
              marginBottom: "8px",
              lineHeight: "1.2"
            }}>
              {t.join.title}
            </h1>
            <p style={{ 
              fontSize: "16px", 
              color: "#666",
              marginBottom: "30px",
              lineHeight: "1.5"
            }}>
              {t.join.subtitle.split("<a>").map((part, i) => {
                if (i === 0) return part;
                const [linkText, rest] = part.split("</a>");
                return (
                  <span key={i}>
                    <a href={localeLink("/register", locale)} style={{ 
                      color: "#0073e6", 
                      textDecoration: "none",
                      fontWeight: "500"
                    }}>
                      {linkText}
                    </a>
                    {rest}
                  </span>
                );
              })}
            </p>

            {/* Messages */}
            {error && (
              <div style={{ 
                background: "#fee", 
                color: "#c33", 
                padding: "12px 16px", 
                borderRadius: "6px", 
                marginBottom: "20px",
                border: "1px solid #fcc",
                fontSize: "14px"
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ 
                background: "#efe", 
                color: "#3c3", 
                padding: "12px 16px", 
                borderRadius: "6px", 
                marginBottom: "20px",
                border: "1px solid #cfc",
                fontSize: "14px"
              }}>
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "6px", 
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#333"
                }}>
                  {t.join.fullName || "Korisničko ime"} <span style={{ color: "#B53251" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#B53251"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#ddd"}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "6px", 
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#333"
                }}>
                  {t.join.email} <span style={{ color: "#B53251" }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#B53251"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#ddd"}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "6px", 
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#333"
                }}>
                  {t.join.password} <span style={{ color: "#B53251" }}>*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#B53251"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#ddd"}
                />
              </div>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(2, 1fr)", 
                gap: "15px",
                marginBottom: "20px"
              }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#333"
                  }}>
                    {t.join.organization}
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#B53251"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#ddd"}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#333"
                  }}>
                    {t.join.country}
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#B53251"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#ddd"}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "6px", 
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#333"
                }}>
                  Nivo korisnika <span style={{ color: "#B53251" }}>*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "moderator" | "editor" | "user" })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "white",
                    cursor: "pointer"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#B53251"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#ddd"}
                >
                  <option value="user">User - Osnovni korisnik</option>
                  <option value="editor">Editor - Može kreirati i uređivati sadržaj</option>
                  <option value="moderator">Moderator - Može moderirati i upravljati korisnicima</option>
                  <option value="admin">Admin - Puni pristup svim funkcionalnostima</option>
                </select>
                <p style={{ 
                  marginTop: "4px", 
                  fontSize: "12px", 
                  color: "#666",
                  lineHeight: "1.4"
                }}>
                  {formData.role === "user" && "Osnovni pristup - može pregledati sadržaj"}
                  {formData.role === "editor" && "Može kreirati i uređivati postove, vesti i resurse"}
                  {formData.role === "moderator" && "Može moderirati sadržaj i upravljati korisnicima (osim admina)"}
                  {formData.role === "admin" && "Puni pristup - može upravljati svim korisnicima i sistemom"}
                </p>
              </div>

              {/* Platform Selection */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "12px", 
                  fontWeight: "500",
                  fontSize: "15px",
                  color: "#333"
                }}>
                  {t.join.platforms || "Odaberite platforme:"}
                </label>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, 1fr)", 
                  gap: "12px" 
                }}>
                  {platformOptions.map((platform) => {
                    const isChecked = isPlatformChecked(platform.id);
                    return (
                      <label
                        key={platform.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "15px",
                          border: isChecked ? "2px solid #B53251" : "2px solid #e0e0e0",
                          borderRadius: "8px",
                          cursor: "pointer",
                          background: isChecked ? "#fff5f5" : "#fff",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.borderColor = "#B53251";
                            e.currentTarget.style.background = "#fff9f9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.borderColor = "#e0e0e0";
                            e.currentTarget.style.background = "#fff";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (platform.id === "all") {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  platforms: ["lms", "ecommerce", "dms"] 
                                });
                              } else {
                                setFormData({ ...formData, platforms: [] });
                              }
                            } else {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  platforms: [...formData.platforms, platform.id] 
                                });
                              } else {
                                setFormData({ 
                                  ...formData, 
                                  platforms: formData.platforms.filter(p => p !== platform.id) 
                                });
                              }
                            }
                          }}
                          style={{ 
                            width: "18px", 
                            height: "18px", 
                            cursor: "pointer",
                            accentColor: "#B53251"
                          }}
                        />
                        {platform.image ? (
                          <img 
                            src={platform.image} 
                            alt={platform.label}
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "contain"
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            background: "#f0f0f0",
                            borderRadius: "6px"
                          }}>
                            🌐
                          </div>
                        )}
                        <span style={{ 
                          fontSize: "14px", 
                          fontWeight: "500",
                          color: "#333"
                        }}>
                          {platform.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Terms */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  cursor: "pointer"
                }}>
                  <input 
                    type="checkbox" 
                    name="terms" 
                    required 
                    style={{ 
                      width: "18px", 
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#B53251"
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#666", lineHeight: "1.4" }}>
                    {t.join.terms}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: "100%",
                  background: "#B53251",
                  color: "#fff",
                  border: "none",
                  padding: "14px 25px",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s ease",
                  marginBottom: "20px"
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#8e2440";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#B53251";
                }}
              >
                {loading ? "Registrujem..." : t.join.register}
              </button>

              <p style={{ 
                textAlign: "center", 
                fontSize: "14px", 
                color: "#666" 
              }}>
                Već imaš nalog?{" "}
                <a 
                  href={localeLink("/login", locale)} 
                  style={{ 
                    color: "#0073e6", 
                    textDecoration: "none",
                    fontWeight: "600"
                  }}
                >
                  Uloguj se ovdje
                </a>
              </p>
            </form>
          </div>

          {/* Right Side - Logo */}
          <div style={{ 
            flex: "1", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            paddingTop: "40px"
          }}>
            <img
              src="/wp-content/uploads/2025/09/Frame-10000022261.webp"
              alt="ABGC Logo"
              style={{
                maxWidth: "100%",
                height: "auto",
                maxHeight: "600px"
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 992px) {
          section > div > div[style*="flex"] {
            flex-direction: column !important;
          }
          section > div > div > div[style*="flex"] {
            max-width: 100% !important;
          }
          form > div[style*="grid"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
