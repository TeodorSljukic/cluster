<?php
function custom_user_profile_fields($user) { ?>
    <h3>Dodatne informacije</h3>
    <table class="form-table">
        <tr>
            <th><label for="organization">Organizacija</label></th>
            <td><input type="text" name="organization" id="organization"
                value="<?php echo esc_attr(get_user_meta($user->ID, 'organization', true)); ?>"
                class="regular-text"></td>
        </tr>
        <tr>
            <th><label for="location">Lokacija</label></th>
            <td><input type="text" name="location" id="location"
                value="<?php echo esc_attr(get_user_meta($user->ID, 'location', true)); ?>"
                class="regular-text"></td>
        </tr>
        <tr>
            <th><label for="sector">Sektor</label></th>
            <td><input type="text" name="sector" id="sector"
                value="<?php echo esc_attr(get_user_meta($user->ID, 'sector', true)); ?>"
                class="regular-text"></td>
        </tr>
        <tr>
            <th><label for="role_custom">Uloga</label></th>
            <td>
                <select name="role_custom" id="role_custom">
                    <option value="Student" <?php selected(get_user_meta($user->ID, 'role_custom', true), 'Student'); ?>>Student</option>
                    <option value="Researcher" <?php selected(get_user_meta($user->ID, 'role_custom', true), 'Researcher'); ?>>Researcher</option>
                    <option value="Manager" <?php selected(get_user_meta($user->ID, 'role_custom', true), 'Manager'); ?>>Manager</option>
                    <option value="Policy Maker" <?php selected(get_user_meta($user->ID, 'role_custom', true), 'Policy Maker'); ?>>Policy Maker</option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="interests">Interesovanja</label></th>
            <td><input type="text" name="interests" id="interests"
                value="<?php echo esc_attr(get_user_meta($user->ID, 'interests', true)); ?>"
                class="regular-text"></td>
        </tr>
        <tr>
            <th><label for="profile_picture">Profilna slika (URL)</label></th>
            <td><input type="text" name="profile_picture" id="profile_picture"
                value="<?php echo esc_attr(get_user_meta($user->ID, 'profile_picture', true)); ?>"
                class="regular-text"></td>
        </tr>
        <tr>
            <th><label for="newsletter">Newsletter</label></th>
            <td>
                <input type="checkbox" name="newsletter" value="1"
                    <?php checked(get_user_meta($user->ID, 'newsletter', true), '1'); ?>>
                Prijavljen
            </td>
        </tr>
    </table>
<?php }
add_action('show_user_profile', 'custom_user_profile_fields');
add_action('edit_user_profile', 'custom_user_profile_fields');

function save_custom_user_profile_fields($user_id) {
    if (!current_user_can('edit_user', $user_id)) return false;

    update_user_meta($user_id, 'organization', sanitize_text_field($_POST['organization']));
    update_user_meta($user_id, 'location', sanitize_text_field($_POST['location']));
    update_user_meta($user_id, 'sector', sanitize_text_field($_POST['sector']));
    update_user_meta($user_id, 'role_custom', sanitize_text_field($_POST['role_custom']));
    update_user_meta($user_id, 'interests', sanitize_text_field($_POST['interests']));
    update_user_meta($user_id, 'profile_picture', esc_url_raw($_POST['profile_picture']));
    update_user_meta($user_id, 'newsletter', isset($_POST['newsletter']) ? '1' : '0');
}
add_action('personal_options_update', 'save_custom_user_profile_fields');
add_action('edit_user_profile_update', 'save_custom_user_profile_fields');
