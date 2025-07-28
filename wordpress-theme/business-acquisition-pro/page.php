<?php
/**
 * The template for displaying all pages
 */

get_header(); ?>

<main class="main-content">
    <div class="container">
        <div class="content-wrapper">
            <?php while (have_posts()) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <div class="article-header">
                        <h1 class="article-title"><?php the_title(); ?></h1>
                        <?php if (get_field('page_subtitle')) : ?>
                            <p class="article-subtitle"><?php the_field('page_subtitle'); ?></p>
                        <?php endif; ?>
                    </div>
                    
                    <div class="article-content">
                        <?php
                        the_content();
                        
                        wp_link_pages(array(
                            'before' => '<div class="page-links">' . esc_html__('Pages:', 'business-acquisition-pro'),
                            'after'  => '</div>',
                        ));
                        ?>
                    </div>
                </article>
                
                <?php
                // If comments are open or we have at least one comment, load the comment template
                if (comments_open() || get_comments_number()) :
                    comments_template();
                endif;
                ?>
            <?php endwhile; ?>
        </div>
    </div>
</main>

<?php get_footer(); ?>