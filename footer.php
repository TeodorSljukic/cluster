<footer class="site-footer">
  <div class="footer-top container">
    <div class="footer-left">
      <?php
      if (has_custom_logo()) {
          the_custom_logo();
      }
      ?>
    </div>

    <div class="footer-right">
      <nav class="footer-nav">
        <ul>
          <li><a href="<?php echo site_url('/contact'); ?>">Contact</a></li>
          <li><a href="<?php echo site_url('/privacy-policy'); ?>">Privacy Policy</a></li>
        </ul>
      </nav>
    </div>
  </div>

  <div class="footer-bottom">
    <p>© <?php echo date('Y'); ?> Adriatic Blue Growth Cluster</p>
  </div>
</footer>

<?php wp_footer(); ?>

<!-- Swiper JS -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-element-bundle.min.js"></script>
<!-- Floating Chat Button -->
<div id="chat-widget">
  <a href="<?php echo site_url('/chat'); ?>" title="Chat">💬</a>
</div>


</body>
</html>
