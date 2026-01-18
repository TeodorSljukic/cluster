<?php
// Custom registracija
function custom_user_registration() {
    if (isset($_POST['custom_register'])) {

        $email    = sanitize_email($_POST['user_email']);
        $password = $_POST['user_password'];
        $fullname = sanitize_text_field($_POST['full_name']);
        $organization = sanitize_text_field($_POST['organization']);
        $country      = sanitize_text_field($_POST['country']);
        $sector       = sanitize_text_field($_POST['sector']);
        $newsletter   = isset($_POST['newsletter']) ? 'Yes' : 'No';

        if (email_exists($email)) {
            echo '<div class="register-error">This email is already registered.</div>';
            return;
        }

        $userdata = [
            'user_login'   => $email,
            'user_pass'    => $password,
            'user_email'   => $email,
            'display_name' => $fullname,
            'role'         => 'subscriber',
        ];

        $user_id = wp_insert_user($userdata);

        if (!is_wp_error($user_id)) {
            update_user_meta($user_id, 'organization', $organization);
            update_user_meta($user_id, 'country', $country);
            update_user_meta($user_id, 'sector', $sector);
            update_user_meta($user_id, 'newsletter', $newsletter);

            $to = get_option('admin_email');
            $subject = "New User Registration – ABGC";
            $message = "New user registered:\n\n";
            $message .= "Full Name: $fullname\n";
            $message .= "Email: $email\n";
            $message .= "Organization: $organization\n";
            $message .= "Country: $country\n";
            $message .= "Sector: $sector\n";
            $message .= "Newsletter: $newsletter\n";

            wp_mail($to, $subject, $message);

            echo '<div class="register-success">Thank you for registering! Your information has been sent.</div>';
        } else {
            echo '<div class="register-error">Registration failed: ' . $user_id->get_error_message() . '</div>';
        }
    }
}
add_action('init', 'custom_user_registration');

// Custom login
function custom_login_process() {
    if (isset($_POST['username']) && isset($_POST['password'])) {
        $creds = [
            'user_login'    => sanitize_text_field($_POST['username']),
            'user_password' => $_POST['password'],
            'remember'      => true
        ];

        $user = wp_signon($creds, false);

        if (!is_wp_error($user)) {
            wp_redirect(site_url('/profile'));
            exit;
        } else {
            global $login_error;
            $login_error = $user->get_error_message();
        }
    }
}
add_action('template_redirect', 'custom_login_process');
