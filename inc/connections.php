<?php
// Slanje zahtjeva za konekciju
function send_connection_request_callback() {
    global $wpdb;
    $current_user = get_current_user_id();
    $target_id = intval($_POST['target_id']);

    if (!$current_user || !$target_id) wp_send_json_error("Invalid request");

    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM wp_user_connections 
         WHERE (user_id=%d AND connection_id=%d)
            OR (user_id=%d AND connection_id=%d)",
        $current_user, $target_id, $target_id, $current_user
    ));
    if ($exists) wp_send_json_error("Connection already exists or pending.");

    $wpdb->insert("wp_user_connections", [
        "user_id"       => $current_user,
        "connection_id" => $target_id,
        "status"        => "pending",
        "created_at"    => current_time('mysql')
    ]);

    wp_send_json_success("Connection request sent.");
}
add_action('wp_ajax_send_connection_request', 'send_connection_request_callback');

// Accept
function accept_connection_callback() {
    global $wpdb;
    $req_id = intval($_POST['req_id']);
    $current_user = get_current_user_id();

    $wpdb->update("wp_user_connections", ["status" => "accepted"], ["id" => $req_id, "connection_id" => $current_user]);
    wp_send_json_success("Connection accepted");
}
add_action('wp_ajax_accept_connection', 'accept_connection_callback');

// Decline
function decline_connection_callback() {
    global $wpdb;
    $req_id = intval($_POST['req_id']);
    $current_user = get_current_user_id();

    $wpdb->update("wp_user_connections", ["status" => "declined"], ["id" => $req_id, "connection_id" => $current_user]);
    wp_send_json_success("Connection declined");
}
add_action('wp_ajax_decline_connection', 'decline_connection_callback');
