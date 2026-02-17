import { NewsSection } from "@/components/NewsSection";
import { EventsSection } from "@/components/EventsSection";
import { StatsSection } from "@/components/StatsSection";
import { ChartsSection } from "@/components/ChartsSection";
import { AccordionSection } from "@/components/AccordionSection";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";
import { PlatformLinksSection } from "@/components/PlatformLinksSection";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = (resolvedParams.locale as Locale) || "me";
  const t = getTranslations(locale);
  const user = await getCurrentUser();

  return (
    <main className="site-main">
      {user ? (
        <>
          <section className="hero">
            <div className="container hero-inner">
              <div className="hero-content" data-aos="fade-left">
                <h1 className="hero-title" data-aos="fade-up">
                  {t.hero.title}
                </h1>
                <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
                  {t.hero.subtitle}
                </p>
              </div>

              <div className="hero-image" data-aos="fade-right">
                <Image
                  src="/wp-content/uploads/2025/09/Hero-image-Mask-group.webp"
                  alt="Hero illustration"
                  width={700}
                  height={700}
                  style={{ width: "100%", height: "auto", maxWidth: "700px" }}
                  priority
                  unoptimized
                />
              </div>
            </div>
          </section>

          <section className="about">
            <div className="container about-inner">
              <div className="about-content" data-aos="fade-right">
                <h2 className="about-title">{t.about.title}</h2>
                <p>{t.about.text1}</p>
                <p>{t.about.text2}</p>
                <p>{t.about.text3}</p>
              </div>

              <div className="about-image" data-aos="fade-left">
                <Image
                  src="/wp-content/uploads/2025/09/Frame-10000022261.webp"
                  alt="ABGC logo"
                  width={800}
                  height={600}
                  style={{ width: "100%", height: "auto" }}
                  loading="lazy"
                  unoptimized
                />
              </div>
            </div>
          </section>

          <PlatformLinksSection locale={locale} />

          <AccordionSection locale={locale} />

          <NewsSection locale={locale} />
          <EventsSection locale={locale} />
          <StatsSection locale={locale} />
          <ChartsSection locale={locale} />
        </>
      ) : (
        <>
          <section className="hero">
            <div className="container hero-inner">
              <div className="hero-content" data-aos="fade-left">
                <h1 className="hero-title" data-aos="fade-up">
                  {locale === "me" ? (
                    "Dobrodošli na ABGC"
                  ) : (
                    t.welcome.title
                  )}
                </h1>
                <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
                  {t.welcome.subtitle}
                </p>
              </div>

              <div className="hero-image" data-aos="fade-right">
                <Image
                  src="/wp-content/uploads/2025/09/Hero-image-Mask-group.webp"
                  alt="Hero illustration"
                  width={700}
                  height={700}
                  style={{ width: "100%", height: "auto", maxWidth: "700px" }}
                  priority
                  unoptimized
                />
              </div>
            </div>
          </section>

          <RegisterForm locale={locale} />
          <PlatformLinksSection locale={locale} />
          <section className="about" style={{ 
            padding: "80px 20px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(234,243,250,0.75) 100%)"
          }}>
            <div className="container" style={{ 
              maxWidth: "1600px",
              margin: "0 auto"
            }}>
              <div style={{ 
                display: "flex", 
                flexDirection: "row",
                alignItems: "center", 
                gap: "60px", 
                justifyContent: "space-between"
              }} className="about-responsive">
                <div style={{ flex: "1", maxWidth: "100%", minWidth: 0 }} data-aos="fade-right">
                  <h2 style={{ 
                    fontSize: "36px", 
                    fontWeight: "600", 
                    color: "#E23F65", 
                    marginBottom: "25px",
                    lineHeight: "1.3"
                  }}>
                    {t.about.title}
                  </h2>
                  <div style={{ 
                    fontSize: "16px", 
                    lineHeight: "1.8", 
                    color: "#333" 
                  }}>
                    <p style={{ marginBottom: "20px" }}>{t.about.text1}</p>
                    <p style={{ marginBottom: "20px" }}>{t.about.text2}</p>
                    <p>{t.about.text3}</p>
                  </div>
                </div>

                <div style={{ flex: "1", maxWidth: "50%", minWidth: 0, display: "none", justifyContent: "center", alignItems: "center" }} data-aos="fade-left">
                  <Image
                    src="/wp-content/uploads/2025/09/Frame-10000022261.webp"
                    alt="ABGC logo"
                    width={800}
                    height={600}
                    style={{ 
                      maxWidth: "100%", 
                      height: "auto",
                      maxHeight: "500px"
                    }}
                    loading="lazy"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
