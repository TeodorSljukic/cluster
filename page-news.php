<?php
/* Template Name: News & Events */
get_header(); ?>

<main class="blog-archive container">
  <h2 data-aos="fade-up">News & Events</h2>

  <div class="posts-grid">
    <?php
      // WP Query za 20 postova po stranici
      $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
$args = array(
  'post_type'      => 'post',
  'posts_per_page' => 20,
  'paged'          => $paged,
  'lang'           => '', // Polylang: povuci sve jezike
);
$news_query = new WP_Query($args);


      if ($news_query->have_posts()) :
        $delay = 100; // delay za chain animaciju
        while ($news_query->have_posts()) : $news_query->the_post(); ?>
          <article class="post-card" data-aos="fade-up" data-aos-delay="<?php echo $delay; ?>">
            <a href="<?php the_permalink(); ?>">
              <?php if (has_post_thumbnail()) : ?>
                <div class="post-thumb">
                  <?php the_post_thumbnail('medium'); ?>
                </div>
              <?php endif; ?>
            </a>
            <div class="post-content">
              <span class="post-date"><?php echo get_the_date(); ?></span>
              <h3 class="post-title">
                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
              </h3>
              <a href="<?php the_permalink(); ?>" class="btn">Read more</a>
            </div>
          </article>
        <?php 
          $delay += 100; // poveća delay za svaki sledeći post
          if ($delay > 400) $delay = 100; // reset nakon 4 posta da ne ode predaleko
        endwhile;
      else :
        echo '<p>No posts found.</p>';
      endif;
      wp_reset_postdata();
    ?>
  </div>

  <div class="pagination" data-aos="fade-up" data-aos-delay="200">
    <?php
      echo paginate_links(array(
        'total'   => $news_query->max_num_pages,
        'current' => $paged,
        'mid_size'  => 2,
        'prev_text' => __('« Prev'),
        'next_text' => __('Next »'),
      ));
    ?>
  </div>
</main>

<?php get_footer(); ?>
