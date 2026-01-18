<?php get_header(); ?>

<div class="login-wrapper">
    <h2 class="login-title">Login</h2>

    <?php global $login_error; 
    if (!empty($login_error)) {
        echo "<p class='login-error'>❌ " . esc_html($login_error) . "</p>";
    } ?>

    <form method="post" class="login-form">
        <div class="form-group">
            <label for="username">Korisničko ime ili Email</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
            <label for="password">Lozinka</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit" class="btn-login">Uloguj se</button>
    </form>

    <p class="login-register-link">
        Nemaš nalog? <a href="/register">Registruj se ovdje</a>
    </p>
</div>

<?php get_footer(); ?>
