<?php
// Kreiranje grupe
function create_group($name, $user_ids = []) {
    global $wpdb;
    $groups = $wpdb->prefix . 'chat_groups';
    $members = $wpdb->prefix . 'chat_group_members';
    $current_user = get_current_user_id();

    $wpdb->insert($groups, [
        'name'       => sanitize_text_field($name),
        'created_by' => $current_user,
        'created_at' => current_time('mysql')
    ]);
    $group_id = $wpdb->insert_id;

    // Dodaj kreatora
    $wpdb->insert($members, [
        'group_id' => $group_id,
        'user_id'  => $current_user
    ]);

    // Dodaj ostale
    foreach ($user_ids as $uid) {
        $wpdb->insert($members, [
            'group_id' => $group_id,
            'user_id'  => intval($uid)
        ]);
    }

    return $group_id;
}

// Slanje poruke u grupu
function send_group_message($sender_id, $group_id, $message, $file = null) {
    global $wpdb;
    $table = $wpdb->prefix . 'messages';
    $file_url = null;

    if ($file && isset($file['name']) && $file['name'] !== '') {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        $uploaded = wp_handle_upload($file, ['test_form' => false]);
        if (!isset($uploaded['error'])) {
            $file_url = $uploaded['url'];
        }
    }

    $wpdb->insert($table, [
        'sender_id'   => intval($sender_id),
        'receiver_id' => 0,
        'group_id'    => intval($group_id),
        'message'     => sanitize_text_field($message),
        'file_url'    => $file_url,
        'created_at'  => current_time('mysql')
    ]);

    return $wpdb->insert_id;
}

// Dohvati poruke grupe
function get_group_messages($group_id, $limit = 50) {
    global $wpdb;
    $table = $wpdb->prefix . 'messages';

    return $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM $table WHERE group_id=%d ORDER BY created_at ASC LIMIT %d",
            $group_id, $limit
        )
    );
}

// AJAX: kreiranje grupe
function ajax_create_group() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    $name = sanitize_text_field($_POST['group_name']);
    $members = (array)($_POST['members'] ?? []);

    if (empty($name)) wp_send_json_error("Naziv grupe je obavezan.");

    $group_id = create_group($name, $members);
    wp_send_json_success(['group_id' => $group_id, 'name' => $name]);
}
add_action('wp_ajax_create_group', 'ajax_create_group');

// AJAX: slanje poruke u grupu
function ajax_send_group_message() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    $sender_id = get_current_user_id();
    $group_id  = intval($_POST['group_id']);
    $message   = trim($_POST['message']);
    $file      = $_FILES['file'] ?? null;

    if (!$group_id) wp_send_json_error("Nedostaje grupa.");
    if ($message === '' && !$file) wp_send_json_error("Poruka ne može biti prazna.");

    $msg_id = send_group_message($sender_id, $group_id, $message, $file);

    wp_send_json_success([
        'id'      => $msg_id,
        'message' => $message,
        'time'    => current_time('mysql'),
        'sender'  => $sender_id
    ]);
}
add_action('wp_ajax_send_group_message', 'ajax_send_group_message');

// AJAX: dodavanje člana
function ajax_add_group_member() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    global $wpdb;
    $group_id = intval($_POST['group_id']);
    $user_id  = intval($_POST['user_id']);
    $members  = $wpdb->prefix . 'chat_group_members';
    $groups   = $wpdb->prefix . 'chat_groups';

    $created_by = $wpdb->get_var($wpdb->prepare("SELECT created_by FROM $groups WHERE id=%d", $group_id));
    if ($created_by != get_current_user_id()) wp_send_json_error("Samo admin može dodavati.");

    $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $members WHERE group_id=%d AND user_id=%d", $group_id, $user_id));
    if ($exists) wp_send_json_error("Korisnik je već u grupi.");

    $wpdb->insert($members, ['group_id' => $group_id, 'user_id' => $user_id]);
    wp_send_json_success("Član dodat.");
}
add_action('wp_ajax_add_group_member', 'ajax_add_group_member');

// AJAX: uklanjanje člana
function ajax_remove_group_member() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    global $wpdb;
    $group_id = intval($_POST['group_id']);
    $user_id  = intval($_POST['user_id']);
    $members  = $wpdb->prefix . 'chat_group_members';
    $groups   = $wpdb->prefix . 'chat_groups';

    $created_by = $wpdb->get_var($wpdb->prepare("SELECT created_by FROM $groups WHERE id=%d", $group_id));
    if ($created_by != get_current_user_id()) wp_send_json_error("Samo admin može uklanjati.");

    if ($user_id == $created_by) wp_send_json_error("Admina nije moguće ukloniti.");

    $wpdb->delete($members, ['group_id' => $group_id, 'user_id' => $user_id]);
    wp_send_json_success("Član uklonjen.");
}
add_action('wp_ajax_remove_group_member', 'ajax_remove_group_member');
// AJAX: admin briše grupu
function ajax_delete_group() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    global $wpdb;
    $group_id = intval($_POST['group_id']);
    $user_id  = get_current_user_id();

    $groups   = $wpdb->prefix . 'chat_groups';
    $members  = $wpdb->prefix . 'chat_group_members';
    $messages = $wpdb->prefix . 'messages';

    // samo admin grupe može obrisati
    $created_by = $wpdb->get_var($wpdb->prepare("SELECT created_by FROM $groups WHERE id=%d", $group_id));
    if ($created_by != $user_id) {
        wp_send_json_error("Samo admin može obrisati grupu.");
    }

    // obriši iz svih tabela
    $wpdb->delete($groups, ['id' => $group_id]);
    $wpdb->delete($members, ['group_id' => $group_id]);
    $wpdb->delete($messages, ['group_id' => $group_id]);

    wp_send_json_success("Grupa je obrisana.");
}
add_action('wp_ajax_delete_group', 'ajax_delete_group');

// AJAX: član napušta grupu
function ajax_leave_group() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    global $wpdb;
    $group_id = intval($_POST['group_id']);
    $user_id  = get_current_user_id();

    $groups  = $wpdb->prefix . 'chat_groups';
    $members = $wpdb->prefix . 'chat_group_members';

    // ako je admin, ne sme samo leave – on treba delete
    $created_by = $wpdb->get_var($wpdb->prepare("SELECT created_by FROM $groups WHERE id=%d", $group_id));
    if ($created_by == $user_id) {
        wp_send_json_error("Admin ne može napustiti grupu – on može samo obrisati.");
    }

    $wpdb->delete($members, ['group_id' => $group_id, 'user_id' => $user_id]);
    wp_send_json_success("Napustili ste grupu.");
}
add_action('wp_ajax_leave_group', 'ajax_leave_group');
// AJAX: dohvatanje novih grupnih poruka
function ajax_get_group_messages() {
    if (!is_user_logged_in()) wp_send_json_error("Morate biti ulogovani.");

    $group_id = intval($_POST['group_id']);
    $last_id  = intval($_POST['last_id']);
    global $wpdb;
    $table = $wpdb->prefix . 'messages';

    $results = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM $table 
             WHERE group_id=%d AND id > %d
             ORDER BY created_at ASC",
            $group_id, $last_id
        )
    );

    wp_send_json_success($results);
}
add_action('wp_ajax_get_group_messages', 'ajax_get_group_messages');
