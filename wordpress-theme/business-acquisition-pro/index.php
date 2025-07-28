<?php
/**
 * The main template file
 * 
 * This is the most generic template file in a WordPress theme and one
 * of the two required files for a theme (the other being style.css).
 */

get_header(); ?>

<main class="main-content">
    <div class="container">
        <div class="content-wrapper">
            <?php if (is_home() && !is_front_page()) : ?>
                <div class="article-header">
                    <h1 class="article-title"><?php single_post_title(); ?></h1>
                </div>
            <?php endif; ?>
            
            <div class="article-content">
                <?php if (have_posts()) : ?>
                    <?php while (have_posts()) : the_post(); ?>
                        <article id="post-<?php the_ID(); ?>" <?php post_class('content-section'); ?>>
                            <?php if (!is_singular()) : ?>
                                <header class="entry-header">
                                    <h2 class="section-title">
                                        <a href="<?php the_permalink(); ?>" rel="bookmark">
                                            <?php the_title(); ?>
                                        </a>
                                    </h2>
                                    <div class="entry-meta">
                                        <span class="posted-on">
                                            <?php echo get_the_date(); ?>
                                        </span>
                                        <span class="byline">
                                            by <?php the_author(); ?>
                                        </span>
                                    </div>
                                </header>
                            <?php endif; ?>
                            
                            <div class="entry-content">
                                <?php
                                if (is_singular()) {
                                    the_content();
                                } else {
                                    the_excerpt();
                                }
                                ?>
                            </div>
                            
                            <?php if (!is_singular()) : ?>
                                <footer class="entry-footer">
                                    <a href="<?php the_permalink(); ?>" class="cta-button">
                                        Read More
                                    </a>
                                </footer>
                            <?php endif; ?>
                        </article>
                    <?php endwhile; ?>
                    
                    <?php if (!is_singular()) : ?>
                        <nav class="pagination">
                            <?php
                            the_posts_pagination(array(
                                'prev_text' => '← Previous',
                                'next_text' => 'Next →',
                            ));
                            ?>
                        </nav>
                    <?php endif; ?>
                    
                <?php else : ?>
                    <div class="no-posts">
                        <h2>Nothing Found</h2>
                        <p>It looks like nothing was found at this location. Maybe try a search?</p>
                        <?php get_search_form(); ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>