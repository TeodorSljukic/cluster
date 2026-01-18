<?php
function global_search_users_callback() {
    global $wpdb;
    $current_user_id = get_current_user_id();

    $term = isset($_POST['term']) ? sanitize_text_field($_POST['term']) : '';

    if (empty($term)) {
        wp_send_json([]); // vraća prazan array
    }

    $results = $wpdb->get_results(
        $wpdb->prepare("
            SELECT ID, display_name, user_email 
            FROM {$wpdb->users}
            WHERE (display_name LIKE %s OR user_email LIKE %s)
              AND ID != %d
            LIMIT 20
        ", '%' . $wpdb->esc_like($term) . '%', '%' . $wpdb->esc_like($term) . '%', $current_user_id)
    );

    $final = [];
    foreach ($results as $user) {
        $conn = $wpdb->get_row($wpdb->prepare("
            SELECT status 
            FROM wp_user_connections
            WHERE (user_id = %d AND connection_id = %d)
               OR (user_id = %d AND connection_id = %d)
            LIMIT 1
        ", $current_user_id, $user->ID, $user->ID, $current_user_id));

        $status = $conn ? $conn->status : 'none';

        $final[] = [
            'ID'           => $user->ID,
            'display_name' => $user->display_name,
            'user_email'   => $user->user_email,
            'status'       => $status,
            'profile_url'  => site_url('/user-profile/?id=' . $user->ID)
        ];
    }

    wp_send_json($final); // 🔑 vraća čisti array
}
add_action('wp_ajax_global_search_users', 'global_search_users_callback');
add_action('wp_ajax_nopriv_global_search_users', 'global_search_users_callback');
