<?php
// Kreiranje tabele za poruke
function create_messages_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'messages';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        sender_id BIGINT(20) UNSIGNED NOT NULL,
        receiver_id BIGINT(20) UNSIGNED NULL,
        group_id BIGINT(20) UNSIGNED NULL,
        message TEXT NOT NULL,
        file_url VARCHAR(255) DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY sender_id (sender_id),
        KEY receiver_id (receiver_id),
        KEY group_id (group_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
add_action('after_switch_theme', 'create_messages_table');

// Dohvati poruke privatnog chata
function get_messages($user_id, $other_user_id, $limit = 50) {
    global $wpdb;
    $table = $wpdb->prefix . 'messages';

    return $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM $table
             WHERE group_id IS NULL
               AND (
                    (sender_id=%d AND receiver_id=%d) 
                 OR (sender_id=%d AND receiver_id=%d)
               )
             ORDER BY id ASC
             LIMIT %d",
             $user_id, $other_user_id, $other_user_id, $user_id, $limit
        )
    );
}

// AJAX: dohvatanje novih poruka (privatni chat)
function ajax_get_messages() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    $current_user = get_current_user_id();
    $other_id = intval($_POST['receiver_id']);
    $last_id  = intval($_POST['last_id']);

    global $wpdb;
    $table = $wpdb->prefix . 'messages';

    $results = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM $table 
             WHERE group_id IS NULL
               AND (
                    (sender_id=%d AND receiver_id=%d) 
                 OR (sender_id=%d AND receiver_id=%d)
               )
               AND id > %d
             ORDER BY id ASC",
            $current_user, $other_id, $other_id, $current_user, $last_id
        )
    );

    wp_send_json_success($results);
}
add_action('wp_ajax_get_messages', 'ajax_get_messages');

// AJAX: slanje privatne poruke
function send_chat_message() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    global $wpdb;
    $current_user = wp_get_current_user();
    $receiver_id = intval($_POST["receiver_id"]);
    $message = sanitize_text_field($_POST["message"]);
    $file_url = "";

    if (empty($receiver_id)) {
        wp_send_json_error("Nedostaje primaoc.");
    }
    if (empty($message) && empty($_FILES["file"]["name"])) {
        wp_send_json_error("Poruka ne može biti prazna.");
    }

    // Upload fajla
    if (!empty($_FILES["file"]["name"])) {
        require_once(ABSPATH . "wp-admin/includes/file.php");
        $uploaded = wp_handle_upload($_FILES["file"], ["test_form" => false]);
        if (!isset($uploaded["error"])) {
            $file_url = $uploaded["url"];
        }
    }

    // Insert u DB
    $wpdb->insert("{$wpdb->prefix}messages", [
        "sender_id"   => $current_user->ID,
        "receiver_id" => $receiver_id,
        "group_id"    => null,
        "message"     => $message,
        "file_url"    => $file_url,
        "created_at"  => current_time("mysql"),
        "is_read"     => 0
    ]);

    $id = $wpdb->insert_id;

    wp_send_json_success([
        "id"        => $id,
        "message"   => $message,
        "file"      => $file_url,
        "time"      => current_time("mysql"),
        "sender_id" => $current_user->ID
    ]);
}
add_action("wp_ajax_send_chat_message", "send_chat_message");

// Update last activity
function update_user_last_activity() {
    if (is_user_logged_in()) {
        update_user_meta(get_current_user_id(), 'last_activity', current_time('timestamp'));
    }
}
add_action('init', 'update_user_last_activity');

// Dohvati status korisnika
function get_user_status($user_id) {
    $last_activity = get_user_meta($user_id, 'last_activity', true);
    if (!$last_activity) return 'inactive';

    $now = current_time('timestamp');
    $diff = $now - $last_activity;

    if ($diff < 60) return 'online';
    if ($diff < 86400) return 'today';
    return 'inactive';
}

// AJAX: unread counts (privatne i grupne)
function get_unread_counts() {
    if (!is_user_logged_in()) wp_send_json_error("Niste ulogovani.");

    global $wpdb;
    $user_id = get_current_user_id();

    $messages_table = $wpdb->prefix . "messages";
    $group_members  = $wpdb->prefix . "chat_group_members";
    $group_reads    = $wpdb->prefix . "group_reads";

    $unread_users  = [];
    $unread_groups = [];

    // Privatne poruke
    $results = $wpdb->get_results($wpdb->prepare(
        "SELECT sender_id, COUNT(*) as cnt
         FROM $messages_table
         WHERE receiver_id = %d 
           AND is_read = 0
           AND group_id IS NULL
         GROUP BY sender_id",
        $user_id
    ));
    foreach ($results as $row) {
        $unread_users[$row->sender_id] = intval($row->cnt);
    }

    // Grupne poruke
    $results = $wpdb->get_results($wpdb->prepare(
        "SELECT m.group_id, COUNT(*) as cnt
         FROM $messages_table m
         INNER JOIN $group_members gm ON m.group_id = gm.group_id
         LEFT JOIN $group_reads r ON m.id = r.message_id AND r.user_id = %d
         WHERE gm.user_id = %d
           AND m.sender_id != %d
           AND m.group_id IS NOT NULL
           AND r.id IS NULL
         GROUP BY m.group_id",
        $user_id, $user_id, $user_id
    ));
    foreach ($results as $row) {
        $unread_groups[$row->group_id] = intval($row->cnt);
    }

    wp_send_json_success([
        "users"  => $unread_users,
        "groups" => $unread_groups
    ]);
}
add_action("wp_ajax_get_unread_counts", "get_unread_counts");

// AJAX: mark group read
function mark_group_read() {
    if (!is_user_logged_in()) wp_send_json_error("Niste ulogovani.");

    global $wpdb;
    $user_id  = get_current_user_id();
    $group_id = intval($_POST['group_id']);

    $messages = $wpdb->get_results($wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}messages
         WHERE group_id = %d AND sender_id != %d",
        $group_id, $user_id
    ));

    foreach ($messages as $msg) {
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}group_reads WHERE message_id = %d AND user_id = %d",
            $msg->id, $user_id
        ));
        if (!$exists) {
            $wpdb->insert(
                $wpdb->prefix . 'group_reads',
                [
                    'message_id' => $msg->id,
                    'user_id'    => $user_id,
                    'read_at'    => current_time('mysql')
                ]
            );
        }
    }

    wp_send_json_success("Sve poruke u grupi označene kao pročitane.");
}
add_action("wp_ajax_mark_group_read", "mark_group_read");
