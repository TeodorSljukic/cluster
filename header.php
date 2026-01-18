<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/assets/css/main.css?ver=<?php echo time(); ?>">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
  <div class="container header-inner">
    
    <!-- Logo -->
    <div class="site-branding">
      <?php 
      if (function_exists('the_custom_logo') && has_custom_logo()) {
        the_custom_logo();
      } else { ?>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="site-title"><?php bloginfo('name'); ?></a>
        <p class="site-description"><?php bloginfo('description'); ?></p>
      <?php } ?>
    </div>

    <!-- Hamburger dugme -->
    <button class="hamburger" aria-label="Open menu" aria-controls="site-menu" aria-expanded="false">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Desktop navigacija -->
    <nav class="main-nav" aria-label="Main Menu">
      <?php
      wp_nav_menu(array(
        'theme_location' => 'primary',
        'container'      => false,
        'menu_class'     => 'nav-menu',
      ));
      ?>
    </nav>

    <!-- Extra buttons (desktop) -->
    <div class="header-actions">
      <!-- Search -->
      <button class="search-btn">
        <img src="/wp-content/uploads/2025/09/search.png" alt="Search icon" class="search-icon">
        <span>Search</span>
      </button>

      <!-- Language switcher -->
      <div class="lang-switcher">
        <button class="lang-btn">
          <img class="lang-icon" src="/wp-content/uploads/2025/09/languages.png" alt="Language icon">
          <span class="lang-current">
            <?php 
            if (function_exists('pll_current_language')) {
              $lang = strtoupper(pll_current_language());
              echo ($lang === 'CNR') ? 'MNE' : $lang;
            }
            ?>
          </span>
        </button>
        <ul class="lang-dropdown">
          <?php
          if (function_exists('pll_the_languages')) {
            pll_the_languages(array(
              'dropdown'      => 0,
              'show_flags'    => 0,
              'show_names'    => 1,
              'hide_if_empty' => 0
            ));
          }
          ?>
        </ul>
      </div>

      <!-- Register / Profile button -->
      <?php if (is_user_logged_in()) : 
        $current_user = wp_get_current_user(); ?>
        <a href="<?php echo site_url('/profile/?id=' . $current_user->ID); ?>" class="btn-register">
          <img src="/wp-content/uploads/2025/09/icons.png" alt="Profile icon" class="register-icon">
          <span>Profile</span>
        </a>
      <?php else: ?>
        <a href="<?php echo site_url('/login'); ?>" class="btn-register">
          <img src="/wp-content/uploads/2025/09/icons.png" alt="Register icon" class="register-icon">
          <span>Register</span>
        </a>
      <?php endif; ?>
    </div>

  </div>

  <!-- Mobilni overlay meni -->
  <div class="mobile-overlay-menu" id="mobileMenu">
    <div class="mobile-overlay-header">
      <div class="mobile-overlay-logo">
        <?php 
        if (has_custom_logo()) { the_custom_logo(); }
        else { echo '<span class="site-title">'. get_bloginfo('name') .'</span>'; }
        ?>
      </div>
      <button class="close-mobile" aria-label="Close menu">&times;</button>
    </div>

    <nav class="mobile-overlay-nav">
      <?php
      wp_nav_menu(array(
        'theme_location' => 'primary',
        'container'      => false,
        'menu_class'     => 'mobile-menu-list',
      ));
      ?>

      <!-- Extra actions (mobile) -->
      <div class="mobile-actions">
        <!-- Search -->
        <button class="search-btn">
          <img src="/wp-content/uploads/2025/09/search.png" alt="Search icon" class="search-icon">
          <span>Search</span>
        </button>

        <!-- Language switcher -->
        <div class="lang-switcher">
          <button class="lang-btn">
            <img class="lang-icon" src="/wp-content/uploads/2025/09/languages.png" alt="Language icon">
            <span class="lang-current">
              <?php 
              if (function_exists('pll_current_language')) {
                $lang = strtoupper(pll_current_language());
                echo ($lang === 'CNR') ? 'MNE' : $lang;
              }
              ?>
            </span>
          </button>
          <ul class="lang-dropdown">
            <?php
            if (function_exists('pll_the_languages')) {
              pll_the_languages(array(
                'dropdown'      => 0,
                'show_flags'    => 0,
                'show_names'    => 1,
                'hide_if_empty' => 0
              ));
            }
            ?>
          </ul>
        </div>

        <!-- Register / Profile button (mobile) -->
     <?php if (is_user_logged_in()) : ?>
  <a href="<?php echo site_url('/profile'); ?>" class="btn-register">
    <img src="/wp-content/uploads/2025/09/icons.png" alt="Profile icon" class="register-icon">
    <span>Profile</span>
  </a>
<?php else: ?>
  <a href="<?php echo site_url('/login'); ?>" class="btn-register">
    <img src="/wp-content/uploads/2025/09/icons.png" alt="Register icon" class="register-icon">
    <span>Register</span>
  </a>
<?php endif; ?>


      </div>
    </nav>
  </div>
</header>
