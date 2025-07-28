# Business Acquisition Pro WordPress Theme

A professional WordPress theme converted from your Gamma site design, specifically crafted for business acquisition and monetization content.

## Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Professional Styling**: Clean, modern design with gradient headers and professional typography
- **Custom Content Sections**: Structured layouts for tier comparisons, statistics, and highlight boxes
- **Built-in Shortcodes**: Easy-to-use shortcodes for creating tier cards, statistics, and highlight boxes
- **SEO Friendly**: Semantic HTML structure and proper heading hierarchy
- **Fast Loading**: Optimized CSS and minimal JavaScript
- **Accessibility Ready**: Proper contrast ratios and semantic markup

## Installation

1. Download all theme files
2. Create a new folder in your WordPress themes directory: `/wp-content/themes/business-acquisition-pro/`
3. Upload all files to this directory:
   - `style.css`
   - `index.php`
   - `header.php`
   - `footer.php`
   - `functions.php`
   - `single.php`
   - `page.php`
   - `front-page.php`
4. Go to WordPress Admin → Appearance → Themes
5. Activate "Business Acquisition Pro"

## Theme Structure

### Core Files
- `style.css` - Main stylesheet with all theme styling
- `index.php` - Main template file for blog posts and archives
- `header.php` - Site header with navigation
- `footer.php` - Site footer
- `functions.php` - Theme functionality and custom features
- `single.php` - Single post template
- `page.php` - Static page template
- `front-page.php` - Homepage template with your content structure

### Custom Features

#### Shortcodes

**Tier Card**
```
[tier_card name="Premium Tier" price="$29/month" subtitle="For serious buyers" features="Feature 1|Feature 2|Feature 3"]
Additional content here
[/tier_card]
```

**Statistics Card**
```
[stat_card number="32%" label="Higher Customer LTV" description="With proper tier structure"]
```

**Highlight Box**
```
[highlight_box type="success" title="Pro Tip"]
Your highlight content here
[/highlight_box]
```

Types available: `default`, `success`, `warning`

#### Custom CSS Classes

- `.tier-grid` - Creates responsive grid for tier cards
- `.stats-grid` - Creates responsive grid for statistics
- `.content-section` - Sections with automatic numbering
- `.highlight-box` - Styled highlight boxes
- `.cta-button` - Professional call-to-action buttons

## Customization

### Colors
The theme uses a professional color scheme:
- Primary: `#667eea` (Blue gradient start)
- Secondary: `#764ba2` (Purple gradient end)
- Text: `#2c3e50` (Dark blue-gray)
- Background: `#ffffff` (White)
- Light background: `#fafafa`

### Typography
- Font family: Inter (loaded from Google Fonts)
- Fallback: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, etc.)

### Layout
- Maximum content width: 1200px
- Responsive breakpoints: 768px (tablet), 480px (mobile)
- Container padding: 2rem desktop, 1rem mobile

## Content Structure

The theme is designed to handle content with the following structure:

1. **Hero Section** - Main title and subtitle
2. **Numbered Sections** - Automatic section numbering with colored circles
3. **Tier Comparisons** - Professional pricing/feature comparison cards
4. **Statistics** - Eye-catching metric displays
5. **Highlight Boxes** - Important callouts and tips

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Internet Explorer 11+

## Performance

- Minimal external dependencies (only Google Fonts)
- Optimized CSS with efficient selectors
- No heavy JavaScript frameworks
- Fast loading times

## SEO Features

- Semantic HTML5 structure
- Proper heading hierarchy (H1-H6)
- Meta tag support
- Schema-ready markup
- Clean URL structure

## Accessibility

- WCAG 2.1 AA compliant color contrast
- Keyboard navigation support
- Screen reader friendly markup
- Alt text support for images
- Focus indicators for interactive elements

## Support

This theme is designed to match your original Gamma site design while providing full WordPress functionality. All styling and features have been carefully converted to work within the WordPress ecosystem.

### Recommended Plugins

- **Yoast SEO** - For enhanced SEO features
- **Advanced Custom Fields** - For additional custom fields
- **Contact Form 7** - For contact forms
- **UpdraftPlus** - For backups

### Menu Setup

1. Go to Appearance → Menus
2. Create a new menu
3. Add your pages/links
4. Assign to "Primary" location

### Homepage Setup

1. Go to Settings → Reading
2. Select "A static page" for homepage
3. Choose your homepage from the dropdown
4. The theme will automatically use the custom front-page design

## License

This theme is created specifically for your business acquisition platform. Feel free to modify and customize as needed for your specific requirements.