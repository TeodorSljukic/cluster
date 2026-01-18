<?php
// Registracija menija i podrška za logo
function mojcustom_theme_setup() {
    register_nav_menus([
        'primary' => __( 'Primary Menu', 'moja-tema' ),
    ]);

    add_theme_support('custom-logo', [
        'height'      => 80,
        'width'       => 250,
        'flex-height' => true,
        'flex-width'  => true,
    ]);
}
add_action('after_setup_theme', 'mojcustom_theme_setup');

// Prikaz admin bar-a samo za administratore
function custom_hide_admin_bar() {
    if (!current_user_can('administrator')) {
        show_admin_bar(false);
    }
}
add_action('after_setup_theme', 'custom_hide_admin_bar');
