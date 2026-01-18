<?php
/* Template Name: Dashboard */
get_header();
?>

<div class="dashboard-container">
  <div class="dashboard-grid">

    <div class="card chart-card">
      <h3>📊 Users by City</h3>
      <canvas id="usersByCity"></canvas>
    </div>

    <div class="card chart-card">
      <h3>📊 Users by Region</h3>
      <canvas id="usersByRegion"></canvas>
    </div>

    <div class="card chart-card full-width">
      <h3>📊 Users by Country</h3>
      <canvas id="usersByCountry"></canvas>
    </div>

    <div class="card full-width">
      <h3>🔥 Activity Heatmap</h3>
      <div id="heatmap" style="height:300px;"></div>
    </div>

    <div class="card small-card">
      <h3>👥 Visitors</h3>
      <p><span id="visitors-today">0</span> Today</p>
      <p><span id="visitors-total">0</span> Total</p>
    </div>

    <div class="card small-card">
      <h3>⭐ Most Common Interests</h3>
      <canvas id="interests-cloud"></canvas>
    </div>

    <div class="card full-width">
      <h3>📰 News & Updates</h3>
      <ul id="news-list"></ul>
    </div>

    <div class="card full-width">
      <h3>📂 Documents & Reports</h3>
      <ul id="docs-list"></ul>
    </div>

  </div>
</div>


<?php get_footer(); ?>
