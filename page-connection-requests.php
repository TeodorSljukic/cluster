<?php
/* Template Name: Connection Requests */
get_header();

$current_user_id = get_current_user_id();
global $wpdb;

// svi zahtjevi gdje je trenutni user target (connection_id)
$requests = $wpdb->get_results($wpdb->prepare("
    SELECT c.id, c.user_id, u.display_name, u.user_email
    FROM wp_user_connections c
    JOIN {$wpdb->users} u ON c.user_id = u.ID
    WHERE c.connection_id = %d AND c.status = 'pending'
", $current_user_id));
?>

<div class="requests-container">
    <h2>Pending Connection Requests</h2>

    <?php if ($requests): ?>
        <div class="requests-list">
            <?php foreach ($requests as $req): ?>
                <div class="request-card">
                    <p><strong><?php echo esc_html($req->display_name); ?></strong> (<?php echo esc_html($req->user_email); ?>)</p>
                    <div class="request-actions">
                        <button class="btn-accept" data-id="<?php echo $req->id; ?>">Accept</button>
                        <button class="btn-decline" data-id="<?php echo $req->id; ?>">Decline</button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php else: ?>
        <p>No pending requests.</p>
    <?php endif; ?>
</div>

<?php get_footer(); ?>
