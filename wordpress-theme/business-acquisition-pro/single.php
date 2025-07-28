<?php
/**
 * The template for displaying all single posts
 */

get_header(); ?>

<main class="main-content">
    <div class="container">
        <div class="content-wrapper">
            <?php while (have_posts()) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <div class="article-header">
                        <h1 class="article-title"><?php the_title(); ?></h1>
                        <div class="article-meta">
                            <span class="posted-on">
                                <?php echo get_the_date(); ?>
                            </span>
                            <span class="byline">
                                by <?php the_author(); ?>
                            </span>
                            <?php if (has_category()) : ?>
                                <span class="categories">
                                    in <?php the_category(', '); ?>
                                </span>
                            <?php endif; ?>
                        </div>
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
                    
                    <footer class="entry-footer">
                        <?php if (has_tag()) : ?>
                            <div class="tags">
                                <strong>Tags:</strong> <?php the_tags('', ', '); ?>
                            </div>
                        <?php endif; ?>
                        
                        <?php
                        // Post navigation
                        the_post_navigation(array(
                            'prev_text' => '<span class="nav-subtitle">' . esc_html__('Previous:', 'business-acquisition-pro') . '</span> <span class="nav-title">%title</span>',
                            'next_text' => '<span class="nav-subtitle">' . esc_html__('Next:', 'business-acquisition-pro') . '</span> <span class="nav-title">%title</span>',
                        ));
                        ?>
                    </footer>
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