<?php
/**
 * Business Acquisition Pro functions and definitions
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Theme setup
 */
function business_acquisition_pro_setup() {
    // Add default posts and comments RSS feed links to head
    add_theme_support('automatic-feed-links');

    // Let WordPress manage the document title
    add_theme_support('title-tag');

    // Enable support for Post Thumbnails on posts and pages
    add_theme_support('post-thumbnails');

    // This theme uses wp_nav_menu() in one location
    register_nav_menus(array(
        'menu-1' => esc_html__('Primary', 'business-acquisition-pro'),
    ));

    // Switch default core markup for search form, comment form, and comments to output valid HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));

    // Add theme support for selective refresh for widgets
    add_theme_support('customize-selective-refresh-widgets');

    // Add support for core custom logo
    add_theme_support('custom-logo', array(
        'height'      => 250,
        'width'       => 250,
        'flex-width'  => true,
        'flex-height' => true,
    ));

    // Add support for wide alignment
    add_theme_support('align-wide');

    // Add support for responsive embeds
    add_theme_support('responsive-embeds');
}
add_action('after_setup_theme', 'business_acquisition_pro_setup');

/**
 * Set the content width in pixels, based on the theme's design and stylesheet
 */
function business_acquisition_pro_content_width() {
    $GLOBALS['content_width'] = apply_filters('business_acquisition_pro_content_width', 1200);
}
add_action('after_setup_theme', 'business_acquisition_pro_content_width', 0);

/**
 * Enqueue scripts and styles
 */
function business_acquisition_pro_scripts() {
    wp_enqueue_style('business-acquisition-pro-style', get_stylesheet_uri(), array(), '1.0.0');
    
    // Add Google Fonts
    wp_enqueue_style('business-acquisition-pro-fonts', 
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', 
        array(), null);

    wp_enqueue_script('business-acquisition-pro-navigation', 
        get_template_directory_uri() . '/js/navigation.js', 
        array(), '1.0.0', true);

    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
}
add_action('wp_enqueue_scripts', 'business_acquisition_pro_scripts');

/**
 * Custom template tags for this theme
 */
function business_acquisition_pro_posted_on() {
    $time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
    if (get_the_time('U') !== get_the_modified_time('U')) {
        $time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
    }

    $time_string = sprintf($time_string,
        esc_attr(get_the_date(DATE_W3C)),
        esc_html(get_the_date()),
        esc_attr(get_the_modified_date(DATE_W3C)),
        esc_html(get_the_modified_date())
    );

    $posted_on = sprintf(
        esc_html_x('Posted on %s', 'post date', 'business-acquisition-pro'),
        '<a href="' . esc_url(get_permalink()) . '" rel="bookmark">' . $time_string . '</a>'
    );

    echo '<span class="posted-on">' . $posted_on . '</span>';
}

/**
 * Custom shortcodes for tier cards and statistics
 */
function business_acquisition_pro_tier_card_shortcode($atts, $content = null) {
    $atts = shortcode_atts(array(
        'name' => 'Tier Name',
        'price' => '$0',
        'subtitle' => '',
        'features' => '',
    ), $atts);

    $features_array = explode('|', $atts['features']);
    
    $output = '<div class="tier-card">';
    $output .= '<div class="tier-header">';
    $output .= '<h3 class="tier-name">' . esc_html($atts['name']) . '</h3>';
    if ($atts['subtitle']) {
        $output .= '<p class="tier-subtitle">' . esc_html($atts['subtitle']) . '</p>';
    }
    $output .= '<div class="tier-price">' . esc_html($atts['price']) . '</div>';
    $output .= '</div>';
    
    if ($atts['features']) {
        $output .= '<ul class="tier-features">';
        foreach ($features_array as $feature) {
            $output .= '<li>' . esc_html(trim($feature)) . '</li>';
        }
        $output .= '</ul>';
    }
    
    if ($content) {
        $output .= '<div class="tier-content">' . do_shortcode($content) . '</div>';
    }
    
    $output .= '</div>';
    
    return $output;
}
add_shortcode('tier_card', 'business_acquisition_pro_tier_card_shortcode');

function business_acquisition_pro_stat_card_shortcode($atts) {
    $atts = shortcode_atts(array(
        'number' => '0',
        'label' => 'Statistic',
        'description' => '',
    ), $atts);

    $output = '<div class="stat-card">';
    $output .= '<div class="stat-number">' . esc_html($atts['number']) . '</div>';
    $output .= '<div class="stat-label">' . esc_html($atts['label']) . '</div>';
    if ($atts['description']) {
        $output .= '<div class="stat-description">' . esc_html($atts['description']) . '</div>';
    }
    $output .= '</div>';
    
    return $output;
}
add_shortcode('stat_card', 'business_acquisition_pro_stat_card_shortcode');

function business_acquisition_pro_highlight_box_shortcode($atts, $content = null) {
    $atts = shortcode_atts(array(
        'type' => 'default',
        'title' => '',
    ), $atts);

    $class = 'highlight-box';
    if (in_array($atts['type'], array('success', 'warning'))) {
        $class .= ' ' . $atts['type'];
    }

    $output = '<div class="' . $class . '">';
    if ($atts['title']) {
        $output .= '<h3>' . esc_html($atts['title']) . '</h3>';
    }
    $output .= do_shortcode($content);
    $output .= '</div>';
    
    return $output;
}
add_shortcode('highlight_box', 'business_acquisition_pro_highlight_box_shortcode');

/**
 * Add custom CSS classes to body
 */
function business_acquisition_pro_body_classes($classes) {
    // Adds a class of hfeed to non-singular pages
    if (!is_singular()) {
        $classes[] = 'hfeed';
    }

    // Adds a class of no-sidebar when there is no sidebar present
    if (!is_active_sidebar('sidebar-1')) {
        $classes[] = 'no-sidebar';
    }

    return $classes;
}
add_filter('body_class', 'business_acquisition_pro_body_classes');

/**
 * Add a pingback url auto-discovery header for single posts, pages, or attachments
 */
function business_acquisition_pro_pingback_header() {
    if (is_singular() && pings_open()) {
        printf('<link rel="pingback" href="%s">', esc_url(get_bloginfo('pingback_url')));
    }
}
add_action('wp_head', 'business_acquisition_pro_pingback_header');

/**
 * Custom excerpt length
 */
function business_acquisition_pro_excerpt_length($length) {
    return 30;
}
add_filter('excerpt_length', 'business_acquisition_pro_excerpt_length');

/**
 * Custom excerpt more
 */
function business_acquisition_pro_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'business_acquisition_pro_excerpt_more');

/**
 * Register widget area
 */
function business_acquisition_pro_widgets_init() {
    register_sidebar(array(
        'name'          => esc_html__('Sidebar', 'business-acquisition-pro'),
        'id'            => 'sidebar-1',
        'description'   => esc_html__('Add widgets here.', 'business-acquisition-pro'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ));
}
add_action('widgets_init', 'business_acquisition_pro_widgets_init');

/**
 * Customize the admin area
 */
function business_acquisition_pro_admin_styles() {
    echo '<style>
        .post-type-post .editor-post-title__input,
        .post-type-page .editor-post-title__input {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 700;
        }
    </style>';
}
add_action('admin_head', 'business_acquisition_pro_admin_styles');