<?php
get_header(); // učitava <head> + CSS + JS

// REGISTRACIJA logika
if ($_POST && isset($_POST['username'], $_POST['email'], $_POST['password'])) {
    $username = sanitize_user($_POST['username']);
    $email    = sanitize_email($_POST['email']);
    $password = $_POST['password'];

    $user_id = wp_create_user($username, $password, $email);

    if (!is_wp_error($user_id)) {
        // Snimi dodatna polja
        if (!empty($_POST['organization'])) {
            update_user_meta($user_id, 'organization', sanitize_text_field($_POST['organization']));
        }
        if (!empty($_POST['city'])) {
            update_user_meta($user_id, 'city', sanitize_text_field($_POST['city']));
        }
        if (!empty($_POST['region'])) {
            update_user_meta($user_id, 'region', sanitize_text_field($_POST['region']));
        }
        if (!empty($_POST['country'])) {
            update_user_meta($user_id, 'country', sanitize_text_field($_POST['country']));
        }
        if (!empty($_POST['role_custom'])) {
            update_user_meta($user_id, 'role_custom', sanitize_text_field($_POST['role_custom']));
        }
        if (!empty($_POST['interests'])) {
            update_user_meta($user_id, 'interests', sanitize_text_field($_POST['interests']));
        }

        echo "<p class='register-success'>✅ Registracija uspješna! <a href='/login'>Klikni ovdje da se uloguješ</a></p>";
    } else {
        echo "<p class='register-error'>❌ Greška: " . $user_id->get_error_message() . "</p>";
    }
}
?>

<div class="register-wrapper">
    <h2 class="register-title">Registracija</h2>
    <form method="post" class="register-form">
        <div class="form-group">
            <label for="username">Korisničko ime</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
            <label for="password">Lozinka</label>
            <input type="password" id="password" name="password" required>
        </div>
        <div class="form-group">
            <label for="organization">Organizacija</label>
            <input type="text" id="organization" name="organization">
        </div>

        <!-- NOVA polja -->
        <div class="form-group">
            <label for="city">Grad</label>
            <input type="text" id="city" name="city" placeholder="Beograd, Podgorica">
        </div>
        <div class="form-group">
            <label for="region">Region</label>
            <input type="text" id="region" name="region" placeholder="Centralna Srbija, Primorje">
        </div>
        <div class="form-group">
            <label for="country">Država</label>
            <input type="text" id="country" name="country" placeholder="Serbia, Montenegro">
        </div>
        <!-- /NOVA polja -->

        <div class="form-group">
            <label for="role_custom">Uloga</label>
            <select id="role_custom" name="role_custom">
                <option value="Student">Student</option>
                <option value="Researcher">Researcher</option>
                <option value="Manager">Manager</option>
                <option value="Policy Maker">Policy Maker</option>
            </select>
        </div>
        <div class="form-group">
            <label for="interests">Interesovanja</label>
            <input type="text" id="interests" name="interests" placeholder="Blue Economy, Sustainability">
        </div>
        <button type="submit" class="btn-register">Registruj se</button>
    </form>

    <p class="register-login-link">
        Već imaš nalog? <a href="/login">Uloguj se ovdje</a>
    </p>
</div>

<?php get_footer(); ?>
