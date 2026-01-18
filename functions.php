<?php
// Učitavanje svih modula
require get_template_directory() . '/inc/setup.php';
require get_template_directory() . '/inc/enqueue.php';
require get_template_directory() . '/inc/auth.php';
require get_template_directory() . '/inc/profile.php';
require get_template_directory() . '/inc/chat.php';
require get_template_directory() . '/inc/groups.php';
require get_template_directory() . '/inc/connections.php';
require get_template_directory() . '/inc/search.php';
require get_template_directory() . '/inc/rest.php';

function add_ajax_url() {
    $current_user_id = get_current_user_id();
    ?>
    <script type="text/javascript">
        var ajaxurl = "<?php echo admin_url('admin-ajax.php'); ?>";
        var CURRENT_USER_ID = "<?php echo $current_user_id; ?>";
    </script>
    <?php
}
add_action('wp_head', 'add_ajax_url');
function ajax_get_unread_counts() {
    if (!is_user_logged_in()) {
        wp_send_json_error("Morate biti ulogovani.");
    }

    global $wpdb;
    $uid = get_current_user_id();
    $table = $wpdb->prefix . 'messages';

    $priv = $wpdb->get_results($wpdb->prepare(
        "SELECT sender_id, COUNT(*) as cnt
         FROM $table
         WHERE receiver_id=%d AND is_read=0
         GROUP BY sender_id",
        $uid
    ));

    $data = [];
    foreach ($priv as $row) {
        $data[$row->sender_id] = (int)$row->cnt;
    }

    wp_send_json_success($data);
}
add_action('wp_ajax_get_unread_counts', 'ajax_get_unread_counts');
function theme_enqueue_styles() {
    wp_enqueue_style(
        'theme-main',
        get_template_directory_uri() . '/assets/css/main.css',
        array(),
        filemtime(get_template_directory() . '/assets/css/main.css')
    );
}
add_action('wp_enqueue_scripts', 'theme_enqueue_styles');

function bg_track_visitor() {
    global $wpdb;
    $table = $wpdb->prefix . 'visitors';

    $ip   = $_SERVER['REMOTE_ADDR'];
    $ua   = $_SERVER['HTTP_USER_AGENT'];
    $date = current_time('Y-m-d');

    $wpdb->insert($table, [
        'ip_address' => $ip,
        'user_agent' => $ua,
        'visit_date' => $date
    ]);
}
add_action('wp_footer', 'bg_track_visitor');
