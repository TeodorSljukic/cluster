export default function ContactPage() {
  return (
    <main className="contact-page">
      <div className="container contact-info" data-aos="fade-up">
        <h2>Feel free to Call &amp; Write us</h2>

        <div className="info-cards">
          <div className="card" data-aos="zoom-in" data-aos-delay="100">
            <h4>📞 Phone</h4>
            <p>+012 8237 2934</p>
          </div>
          <div className="card" data-aos="zoom-in" data-aos-delay="200">
            <h4>✉️ Email</h4>
            <p>info@bluegrowth-adriatic.org</p>
          </div>
          <div className="card" data-aos="zoom-in" data-aos-delay="300">
            <h4>🏢 Company info</h4>
            <p>
              Registered as a non-governmental organization (NVO) in Montenegro
              in accordance with the Law on NGOs (&quot;Official Gazette of
              Montenegro&quot;, Nos. 39/11 and 37/17)
            </p>
          </div>
          <div className="card" data-aos="zoom-in" data-aos-delay="400">
            <h4>📍 Address</h4>
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
        <h2>Message us and let&apos;s work together</h2>
        <p>(Contact form will be wired later.)</p>
      </div>
    </main>
  );
}
