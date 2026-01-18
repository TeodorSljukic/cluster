<?php
/* Template Name: User Search */
get_header();
?>

<div class="search-page-container">
    <h2>Search Users</h2>
    <form id="user-search-form">
        <input type="text" id="global-user-search" placeholder="Enter name or email..." autocomplete="off" />
        <button type="submit">Search</button>
    </form>

    <div id="global-search-results"></div>
</div>

<?php get_footer(); ?>
