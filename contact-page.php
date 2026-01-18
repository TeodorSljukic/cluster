<?php
/* Template Name: Contact */
get_header(); ?>

<main class="contact-page">
  <div class="container contact-info" data-aos="fade-up">
    <h2>Feel free to Call & Write us</h2>

    <div class="info-cards">
      <div class="card" data-aos="zoom-in" data-aos-delay="100">
        <h4>📞 Phone</h4>
        <p>+012 8237 2934</p>
      </div>
      <div class="card" data-aos="zoom-in" data-aos-delay="200">
        <h4>✉️ Email</h4>
        <p>info@bluegrowth-adriatic.org</p>
      </div>
      <div class="card" data-aos="zoom-in" data-aos-delay="300">
        <h4>🏢 Company info</h4>
        <p>
          Registered as a non-governmental organization (NVO) in Montenegro in accordance with 
          the Law on NGOs ("Official Gazette of Montenegro", Nos. 39/11 and 37/17)
        </p>
      </div>
      <div class="card" data-aos="zoom-in" data-aos-delay="400">
        <h4>📍 Address</h4>
        <p>
          Adriatic Blue Growth Cluster (ABGC)<br>
          Put I Bokeške brigade, Dobrota bb<br>
          P.O. Box 69<br>
          85330 Kotor, Montenegro
        </p>
      </div>
    </div>
  </div>

  <div class="container contact-map" data-aos="fade-up">
    <!-- Ovdje staviš iframe ili mapu iz plugin-a -->
    <iframe 
      src="https://www.openstreetmap.org/export/embed.html?bbox=18.75,42.42,18.90,42.45&layer=mapnik" 
      style="border:0; width:100%; height:400px;" allowfullscreen>
    </iframe>
  </div>

  <div class="container contact-form" data-aos="fade-up">
    <h2>Message us and let's work together</h2>
    <?php echo do_shortcode('[contact-form-7 id="b444f1b" title="Contact form 1"]'); ?>
  </div>
</main>

<?php get_footer(); ?>
