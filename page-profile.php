<?php
/* Template Name: Profile */
get_header();

global $wpdb;

if ( is_user_logged_in() ) {
    $user_id = get_current_user_id();
    $user_info = get_userdata($user_id);

    // Ako je poslata forma za update profila
    if ($_POST && isset($_POST['update_profile'])) {
        // Update text polja
        if (!empty($_POST['display_name'])) {
            wp_update_user([
                'ID' => $user_id,
                'display_name' => sanitize_text_field($_POST['display_name'])
            ]);
        }
        update_user_meta($user_id, 'organization', sanitize_text_field($_POST['organization']));
        update_user_meta($user_id, 'location', sanitize_text_field($_POST['location']));
        update_user_meta($user_id, 'role_custom', sanitize_text_field($_POST['role_custom']));
        update_user_meta($user_id, 'interests', sanitize_text_field($_POST['interests']));

        // Upload slike ako postoji
        if (!empty($_FILES['profile_picture']['name'])) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');

            $upload = wp_handle_upload($_FILES['profile_picture'], ['test_form' => false]);

            if (isset($upload['file'])) {
                $file_path = $upload['file'];

                // Otvori sliku pomoću WP image editora
                $image = wp_get_image_editor($file_path);
                if (!is_wp_error($image)) {
                    // Resize: max 500x500, crop = true
                    $image->resize(500, 500, true);
                    $image->save($file_path);
                }

                // Snimi URL u user_meta
                update_user_meta($user_id, 'profile_picture', esc_url($upload['url']));
            }
        }

        echo "<p class='profile-success'>✅ Profil ažuriran!</p>";
    }

    // Povuci vrijednosti
    $organization    = get_user_meta($user_id, 'organization', true);
    $location        = get_user_meta($user_id, 'location', true);
    $role_custom     = get_user_meta($user_id, 'role_custom', true);
    $interests       = get_user_meta($user_id, 'interests', true);
    $profile_picture = get_user_meta($user_id, 'profile_picture', true);

    // Pending connection requests
    $requests = $wpdb->get_results($wpdb->prepare("
        SELECT c.id, c.user_id, u.display_name, u.user_email
        FROM wp_user_connections c
        JOIN {$wpdb->users} u ON c.user_id = u.ID
        WHERE c.connection_id = %d AND c.status = 'pending'
    ", $user_id));
    ?>
    
    <div class="profile-wrapper">
        <h2 class="profile-title">Moj Profil</h2>
        
        <!-- Profile Card -->
        <div class="profile-card">
            <div class="profile-avatar">
                <?php if ($profile_picture): ?>
                    <img src="<?php echo esc_url($profile_picture); ?>" alt="Profilna slika">
                <?php else: ?>
                    <?php echo get_avatar($user_id, 120); ?>
                <?php endif; ?>
            </div>
            <div class="profile-info">
                <p><strong>Ime:</strong> <?php echo esc_html($user_info->display_name); ?></p>
                <p><strong>Email:</strong> <?php echo esc_html($user_info->user_email); ?></p>
                <p><strong>Organizacija:</strong> <?php echo esc_html($organization); ?></p>
                <p><strong>Lokacija:</strong> <?php echo esc_html($location); ?></p>
                <p><strong>Uloga:</strong> <?php echo esc_html($role_custom); ?></p>
                <p><strong>Interesovanja:</strong> <?php echo esc_html($interests); ?></p>
            </div>
        </div>

        <!-- Pending Requests -->
       <div class="profile-requests">
    <h3>
        🔔 Connection Requests 
        <?php if ($requests): ?>
            <span class="badge"><?php echo count($requests); ?></span>
        <?php endif; ?>
    </h3>

    <?php if ($requests): ?>
        <div class="requests-list">
            <?php foreach ($requests as $req): ?>
                <div class="request-card">
                    <p><strong><?php echo esc_html($req->display_name); ?></strong> 
                        (<?php echo esc_html($req->user_email); ?>)</p>
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


        <!-- Edit forma -->
        <form method="post" enctype="multipart/form-data" class="profile-form">
            <h3>Uredi profil</h3>
            <div class="form-group">
                <label for="display_name">Ime i prezime</label>
                <input type="text" name="display_name" id="display_name" 
                       value="<?php echo esc_attr($user_info->display_name); ?>">
            </div>
            <div class="form-group">
                <label for="organization">Organizacija</label>
                <input type="text" name="organization" id="organization" 
                       value="<?php echo esc_attr($organization); ?>">
            </div>
            <div class="form-group">
                <label for="location">Lokacija</label>
                <input type="text" name="location" id="location" 
                       value="<?php echo esc_attr($location); ?>">
            </div>
            <div class="form-group">
                <label for="role_custom">Uloga</label>
                <select name="role_custom" id="role_custom">
                    <option value="Student" <?php selected($role_custom, 'Student'); ?>>Student</option>
                    <option value="Researcher" <?php selected($role_custom, 'Researcher'); ?>>Researcher</option>
                    <option value="Manager" <?php selected($role_custom, 'Manager'); ?>>Manager</option>
                    <option value="Policy Maker" <?php selected($role_custom, 'Policy Maker'); ?>>Policy Maker</option>
                </select>
            </div>
            <div class="form-group">
                <label for="interests">Interesovanja</label>
                <input type="text" name="interests" id="interests" 
                       value="<?php echo esc_attr($interests); ?>">
            </div>
            <div class="form-group">
                <label for="profile_picture">Profilna slika</label>
                <input type="file" name="profile_picture" id="profile_picture" accept="image/*">
            </div>
            <button type="submit" name="update_profile" class="btn-update">Ažuriraj profil</button>
        </form>

        <a href="<?php echo wp_logout_url(site_url('/login')); ?>" class="btn-logout">Logout</a>
    </div>
    <?php
} else {
    echo "<p class='profile-error'>⚠️ Morate biti prijavljeni da biste vidjeli profil. <a href='/login'>Login</a></p>";
}

get_footer();
