<?php
/* Template Name: Resources */
get_header(); ?>

<main class="blog-archive container">
  <h2 data-aos="fade-up">Valuable Resources for the Blue Economy</h2>
  <p class="archive-subtitle" data-aos="fade-up" data-aos-delay="100">
    Access guides, reports, case studies, and knowledge tools that help shape a sustainable future for the Adriatic region and beyond.
  </p>

  <div class="posts-grid">
    <?php
      // Query za resources
      $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
      $args = array(
        'post_type'      => 'resources',
        'posts_per_page' => 20,
        'paged'          => $paged,
      );
      $resources_query = new WP_Query($args);

      if ($resources_query->have_posts()) :
        $delay = 100;
        while ($resources_query->have_posts()) : $resources_query->the_post(); ?>
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
          $delay += 100;
          if ($delay > 400) $delay = 100;
        endwhile;
      else :
        echo '<p>No resources found.</p>';
      endif;
      wp_reset_postdata();
    ?>
  </div>

  <div class="pagination" data-aos="fade-up" data-aos-delay="200">
    <?php
      echo paginate_links(array(
        'total'   => $resources_query->max_num_pages,
        'current' => $paged,
        'mid_size'  => 2,
        'prev_text' => __('« Prev'),
        'next_text' => __('Next »'),
      ));
    ?>
  </div>
</main>

<?php get_footer(); ?>
