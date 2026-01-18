<?php
/* Template Name: User Profile */
get_header();

global $wpdb;

if (empty($_GET['id'])) {
    echo "<p>⚠️ Niste odabrali korisnika.</p>";
    get_footer();
    exit;
}

$user_id = intval($_GET['id']);
$user = get_userdata($user_id);

if (!$user) {
    echo "<p>Korisnik nije pronađen.</p>";
    get_footer();
    exit;
}

$current_user_id = get_current_user_id();

// meta podaci (custom polja iz usermeta)
$organization  = get_user_meta($user_id, 'organization', true);
$location      = get_user_meta($user_id, 'location', true);
$role          = get_user_meta($user_id, 'role', true);
$interests     = get_user_meta($user_id, 'interests', true);
$avatar        = get_avatar_url($user_id, ['size' => 150]);

// provjera konekcije
$status = 'none';
if ($current_user_id && $current_user_id !== $user_id) {
    $conn = $wpdb->get_row(
        $wpdb->prepare("
            SELECT status 
            FROM wp_user_connections
            WHERE (user_id = %d AND connection_id = %d)
               OR (user_id = %d AND connection_id = %d)
            LIMIT 1
        ", $current_user_id, $user_id, $user_id, $current_user_id)
    );

    if ($conn) {
        $status = $conn->status;
    }
}
?>

<div class="profile-container">
    <div class="profile-card">
        <div class="profile-inner">
            <div class="profile-avatar">
                <img src="<?php echo esc_url($avatar); ?>" alt="Avatar">
            </div>
            <div class="profile-info">
                <p><strong>Ime:</strong> <?php echo esc_html($user->display_name); ?></p>
                <p><strong>Email:</strong> <?php echo esc_html($user->user_email); ?></p>
                <p><strong>Organizacija:</strong> <?php echo esc_html($organization ?: '-'); ?></p>
                <p><strong>Lokacija:</strong> <?php echo esc_html($location ?: '-'); ?></p>
                <p><strong>Uloga:</strong> <?php echo esc_html($role ?: '-'); ?></p>
                <p><strong>Interesovanja:</strong> <?php echo esc_html($interests ?: '-'); ?></p>
            </div>
        </div>

        <?php if ($current_user_id && $current_user_id !== $user_id): ?>
            <div class="profile-actions">
                <?php if ($status === 'accepted'): ?>
                    <!-- ✅ vodi direktno u chat -->
                    <a class="btn-message" href="<?php echo site_url('/chat/?chat_with=' . $user_id); ?>">Message</a>
                <?php elseif ($status === 'pending'): ?>
                    <button disabled>Request Sent</button>
                <?php else: ?>
                    <button class="btn-connect" data-id="<?php echo $user_id; ?>">Connect</button>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>
