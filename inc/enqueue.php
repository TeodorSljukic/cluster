<?php
function mojcustom_enqueue_scripts() {
    // Swiper
    wp_enqueue_style(
        'swiper-css',
        'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
    );
    wp_enqueue_script(
        'swiper-js',
        'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
        [],
        null,
        true
    );

    // Glavni CSS
    wp_enqueue_style(
        'moja-tema-style',
        get_template_directory_uri() . '/assets/css/main.css',
        [],
        '1.0'
    );
    wp_enqueue_style(
        'custom-style',
        get_template_directory_uri() . '/assets/css/custom.css',
        [],
        '1.0'
    );

    // Glavni JS
    wp_enqueue_script(
        'main-js',
        get_template_directory_uri() . '/assets/js/main.js',
        ['jquery', 'swiper-js'],
        '1.0',
        true
    );

    // Odvojeni JS fajlovi
    wp_enqueue_script(
        'chat-js',
        get_template_directory_uri() . '/assets/js/chat.js',
        ['jquery'],
        '1.0',
        true
    );
    wp_enqueue_script(
        'groups-js',
        get_template_directory_uri() . '/assets/js/groups.js',
        ['jquery'],
        '1.0',
        true
    );
    wp_enqueue_script(
        'search-js',
        get_template_directory_uri() . '/assets/js/search.js',
        ['jquery'],
        '1.0',
        true
    );
    wp_enqueue_script(
        'connections-js',
        get_template_directory_uri() . '/assets/js/connections.js',
        ['jquery'],
        '1.0',
        true
    );
wp_enqueue_script('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', array(), null, true);
    wp_enqueue_script(
        'dashboard-js',
        get_template_directory_uri() . '/assets/js/dashboard.js',
        array('chartjs','jquery'),
        null,
        true
    );
    // 🔑 Prosljeđivanje ajaxurl i trenutnog usera u sve JS
    wp_localize_script('main-js', 'MyAjax', [
        'ajaxurl'     => admin_url('admin-ajax.php'),
        'currentUser' => get_current_user_id(),
    ]);
}
add_action('wp_enqueue_scripts', 'mojcustom_enqueue_scripts');

// AOS
function theme_enqueue_aos() {
    wp_enqueue_style(
        'aos-css',
        'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css'
    );
    wp_enqueue_script(
        'aos-js',
        'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js',
        ['jquery'],
        null,
        true
    );
    wp_add_inline_script(
        'aos-js',
        'AOS.init({ duration: 800, once: true });'
    );
}
add_action('wp_enqueue_scripts', 'theme_enqueue_aos');
