<?php
// Users by City
add_action('rest_api_init', function () {
    register_rest_route('landing', '/users-by-city', array(
        'methods' => 'GET',
        'callback' => 'get_users_by_city',
    ));
});
function get_users_by_city() {
    global $wpdb;
    return $wpdb->get_results("
        SELECT meta_value as city, COUNT(*) as total
        FROM {$wpdb->prefix}usermeta
        WHERE meta_key = 'city' AND meta_value != ''
        GROUP BY meta_value
    ");
}

// Users by Region
add_action('rest_api_init', function () {
    register_rest_route('landing', '/users-by-region', array(
        'methods' => 'GET',
        'callback' => 'get_users_by_region',
    ));
});
function get_users_by_region() {
    global $wpdb;
    return $wpdb->get_results("
        SELECT meta_value as region, COUNT(*) as total
        FROM {$wpdb->prefix}usermeta
        WHERE meta_key = 'region' AND meta_value != ''
        GROUP BY meta_value
    ");
}

// Users by Country
add_action('rest_api_init', function () {
    register_rest_route('landing', '/users-by-country', array(
        'methods' => 'GET',
        'callback' => 'get_users_by_country',
    ));
});
function get_users_by_country() {
    global $wpdb;
    return $wpdb->get_results("
        SELECT meta_value as country, COUNT(*) as total
        FROM {$wpdb->prefix}usermeta
        WHERE meta_key = 'country' AND meta_value != ''
        GROUP BY meta_value
    ");
}
add_action('rest_api_init', function () {
    register_rest_route('bluegrowth/v1', '/visitors', [
        'methods'  => 'GET',
        'callback' => 'bg_get_visitors',
        'permission_callback' => '__return_true',
    ]);
});

function bg_get_visitors() {
    global $wpdb;
    $table = $wpdb->prefix . 'visitors';

    $today = current_time('Y-m-d');
    $today_count = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE visit_date = %s", $today));
    $total_count = $wpdb->get_var("SELECT COUNT(*) FROM $table");

    return [
        'today' => intval($today_count),
        'total' => intval($total_count)
    ];
}
add_action('rest_api_init', function () {
    register_rest_route('bluegrowth/v1', '/users-interests', [
        'methods'  => 'GET',
        'callback' => 'bg_get_users_interests',
        'permission_callback' => '__return_true',
    ]);
});

function bg_get_users_interests() {
    global $wpdb;

    // Uzmi sva user_meta interests polja
    $results = $wpdb->get_results(
        "SELECT meta_value FROM {$wpdb->prefix}usermeta WHERE meta_key = 'interests'"
    );

    $counts = [];

    if ($results) {
        foreach ($results as $row) {
            $interests = explode(',', $row->meta_value);
            foreach ($interests as $interest) {
                $interest = trim(strtolower($interest));
                if (!empty($interest)) {
                    $counts[$interest] = ($counts[$interest] ?? 0) + 1;
                }
            }
        }
    }

    // Sortiraj po count-u (od najvećeg ka najmanjem)
    arsort($counts);

    $output = [];
    foreach ($counts as $interest => $count) {
        $output[] = [
            'interest' => ucfirst($interest),
            'count'    => $count
        ];
    }

    return $output;
}
