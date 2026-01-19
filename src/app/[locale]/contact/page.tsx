import { use } from "react";
import { getTranslations } from "@/lib/getTranslations";
import { type Locale } from "@/lib/localeLink";

export default function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale = (resolvedParams.locale as Locale) || "me";
  const t = getTranslations(locale);

  return (
    <main className="contact-page">
      <div className="container contact-info" data-aos="fade-up">
        <h2>{t.contact.title}</h2>

        <div className="info-cards">
          <div className="card" data-aos="zoom-in" data-aos-delay="100">
            <h4>📞 {t.contact.phone}</h4>
            <p>+012 8237 2934</p>
          </div>
          <div className="card" data-aos="zoom-in" data-aos-delay="200">
            <h4>✉️ {t.contact.email}</h4>
            <p>info@bluegrowth-adriatic.org</p>
          </div>
          <div className="card" data-aos="zoom-in" data-aos-delay="300">
            <h4>🏢 {t.contact.companyInfo}</h4>
            <p>
              {t.contact.companyInfoText}
            </p>
          </div>
          <div className="card" data-aos="zoom-in" data-aos-delay="400">
            <h4>📍 {t.contact.address}</h4>
            <p>
              Adriatic Blue Growth Cluster (ABGC)
              <br />
              Put I Bokeške brigade, Dobrota bb
              <br />
              P.O. Box 69
              <br />
              85330 Kotor, Montenegro
            </p>
          </div>
        </div>
      </div>

      <div className="container contact-map" data-aos="fade-up">
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=18.75,42.42,18.90,42.45&layer=mapnik"
          style={{ border: 0, width: "100%", height: 400 }}
          allowFullScreen
          title="Map"
        />
      </div>

      <div className="container contact-form" data-aos="fade-up">
        <h2>{t.contact.messageUs}</h2>
        <p>{t.contact.formComingSoon}</p>
      </div>
    </main>
  );
}
