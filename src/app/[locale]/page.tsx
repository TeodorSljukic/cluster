import { NewsSection } from "@/components/NewsSection";
import { EventsSection } from "@/components/EventsSection";
import { StatsSection } from "@/components/StatsSection";
import { ChartsSection } from "@/components/ChartsSection";
import { AccordionSection } from "@/components/AccordionSection";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = (resolvedParams.locale as Locale) || "me";
  const t = getTranslations(locale);

  return (
    <main className="site-main">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-image" data-aos="fade-right">
            <img
              src="/wp-content/uploads/2025/09/Hero-image-Mask-group.webp"
              alt="Hero illustration"
            />
          </div>

          <div className="hero-content" data-aos="fade-left">
            <h1 className="hero-title" data-aos="fade-up">
              {t.hero.title}
            </h1>
            <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
              {t.hero.subtitle}
            </p>
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
            <img
              src="/wp-content/uploads/2025/09/Frame-10000022261.webp"
              alt="ABGC logo"
            />
          </div>
        </div>
      </section>

      <section className="platform">
        <div className="container">
          <h2 className="platform-title" data-aos="fade-up">
            {t.platform.title}
          </h2>

          <div className="platform-grid">
            <div className="platform-item" data-aos="zoom-in" data-aos-delay="100">
              <img
                src="/wp-content/uploads/2025/09/Frame-10000022262.webp"
                alt={t.platform.documents}
              />
              <h3>{t.platform.documents}</h3>
            </div>

            <div className="platform-item" data-aos="zoom-in" data-aos-delay="200">
              <img
                src="/wp-content/uploads/2025/09/Frame-1000002235.webp"
                alt={t.platform.elearning}
              />
              <h3>{t.platform.elearning}</h3>
            </div>

            <div className="platform-item" data-aos="zoom-in" data-aos-delay="300">
              <img
                src="/wp-content/uploads/2025/09/Frame-1000002234.webp"
                alt={t.platform.ecommerce}
              />
              <h3>{t.platform.ecommerce}</h3>
            </div>
          </div>
        </div>
      </section>

      <AccordionSection locale={locale} />

      <section className="projects">
        <div className="container projects-inner">
          <div className="projects-image" data-aos="fade-right">
            <img
              src="/wp-content/uploads/2025/09/Frame-10000022263.png"
              alt="Projects logo"
            />
          </div>

          <div className="projects-content" data-aos="fade-left">
            <h2 className="projects-title">{t.projects.title}</h2>
            <ul className="projects-list">
              <li data-aos="fade-up" data-aos-delay="100">
                {t.projects.skills}
              </li>
              <li data-aos="fade-up" data-aos-delay="200">
                {t.projects.blueconnect}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <NewsSection locale={locale} />
      <EventsSection locale={locale} />
      <StatsSection />
      <ChartsSection />

      <section className="join">
        <div className="container">
          <div className="join-header" data-aos="fade-up">
            <h2 className="join-title">{t.join.title}</h2>
            <p className="join-subtitle">
              {t.join.subtitle.split("<a>").map((part, i) => {
                if (i === 0) return part;
                const [linkText, rest] = part.split("</a>");
                return (
                  <span key={i}>
                    <Link href={`/${locale}/register`}>{linkText}</Link>
                    {rest}
                  </span>
                );
              })}
            </p>
          </div>

          <div className="join-inner">
            <div className="join-left" data-aos="fade-right">
              <img
                src="/wp-content/uploads/2025/09/00ad0771c445ce2057c0b8cf1fc2e6dd9b6d84b8-scaled.webp"
                alt="ABGC Logo"
              />
            </div>

            <div className="join-right" data-aos="fade-left">
              <form className="register-form" action={`/${locale}/register`}>
                <label htmlFor="full_name">{t.join.fullName}</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  placeholder={t.join.fullName}
                  required
                />

                <label htmlFor="user_email">{t.join.email}</label>
                <input
                  type="email"
                  id="user_email"
                  name="user_email"
                  placeholder={t.join.email}
                  required
                />

                <label htmlFor="user_password">{t.join.password}</label>
                <input
                  type="password"
                  id="user_password"
                  name="user_password"
                  placeholder={t.join.password}
                  required
                />

                <label htmlFor="organization">{t.join.organization}</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  placeholder={t.join.organization}
                />

                <label htmlFor="country">{t.join.country}</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  placeholder={t.join.country}
                />

                <label htmlFor="sector">{t.join.sector}</label>
                <input
                  type="text"
                  id="sector"
                  name="sector"
                  placeholder={t.join.sector}
                />

                <label>
                  <input type="checkbox" name="newsletter" />
                  {t.join.newsletter}
                </label>

                <label>
                  <input type="checkbox" name="terms" required />
                  {t.join.terms}
                </label>

                <button type="submit" name="custom_register">
                  {t.join.register}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
