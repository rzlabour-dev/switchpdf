# SwitchPDF Multi-Domain Deployment Guide

## Overview
You have purchased 4 domains for your PDF tools website:
- **switchpdf.io** (Primary - Professional branding)
- **switchpdf.info**
- **switchpdf.one**
- **switchpdf.online**

## Branding & Logo

### Logo Files Created:
- `images/switchpdf-logo.svg` - Futuristic SVG logo with glow effects and tech elements
- `images/switchpdf-logo-white-bg.svg` - PNG-ready version with white background
- `images/favicon.svg` - 32x32 futuristic favicon
- `images/ascii-logo.txt` - Futuristic ASCII art logo for terminals/docs
- `components/logo.html` - Reusable futuristic logo component

### Logo Implementation:
- Header: Uses `images/switchpdf-logo.svg`
- Navigation: Uses `images/switchpdf-logo.svg` (scaled down)
- Footer: Uses `images/switchpdf-logo.svg`
- Favicon: `images/favicon.svg`
- Social Media: SVG logo for Open Graph images

### CSS Classes Added:
- `.logo-image` - Main logo styling
- `.nav-logo` - Navigation logo
- `.footer-logo-image` - Footer logo
- `.brand-subtitle` - Subtitle styling

### Branding Elements:
- **Primary Color**: Futuristic cyan-to-blue gradient (#00d4ff to #0066ff)
- **Accent Color**: Neon pink (#ff006e) for PDF elements
- **Typography**: Bold, modern design with glow effects
- **Tagline**: "Futuristic PDF Tools"
- **Copyright**: "© 2026 SwitchPDF.io - Professional PDF Tools"

## Recommended Domain Strategy

### 1. Primary Domain: switchpdf.io
- **Purpose**: Main brand domain
- **Content**: Full website with all tools
- **SEO Focus**: Primary domain for search rankings

### 2. Secondary Domains: .info, .one, .online
- **Purpose**: Additional brand presence and traffic sources
- **Content**: Same website, domain-specific meta tags
- **SEO Focus**: Additional backlinks and brand mentions

## Deployment Options

### Option A: Single Repository, Multiple Deployments
Deploy the same codebase to 4 different hosting services:

1. **Vercel/Netlify/Github Pages** for each domain
2. Each deployment uses the same repository
3. Domain-specific configuration handled by `domain-config.js`

### Option B: Single Hosting with Domain Aliases
1. Host on one service (e.g., Vercel)
2. Configure domain aliases for all 4 domains
3. Use domain-config.js for dynamic content

## Setup Instructions

### For Each Domain:

1. **Point Domain to Hosting Service**
   ```
   switchpdf.io     → CNAME: your-vercel-app.vercel.app
   switchpdf.info   → CNAME: your-netlify-app.netlify.app
   switchpdf.one    → CNAME: your-github-pages.github.io
   switchpdf.online → CNAME: your-render-app.onrender.com
   ```

2. **Update Sitemap and Robots.txt**
   - Change all URLs in `sitemap.xml` to match the domain
   - Update `robots.txt` sitemap URL

3. **Create Domain-Specific Files**
   For each domain, create:
   - `sitemap-[domain].xml`
   - `robots-[domain].txt`

## Analytics Setup

### Google Analytics 4
```javascript
// Add to domain-config.js
gtag('config', 'GA_MEASUREMENT_ID', {
    'custom_map': {'dimension1': getCurrentDomainConfig().name}
});
```

### Search Console
- Add all 4 domains to Google Search Console
- Submit domain-specific sitemaps

## SEO Strategy

### 1. Interlinking
- Link between domains for internal link equity
- Cross-domain navigation in footer

### 2. Content Strategy
- Same content across all domains
- Domain-specific meta descriptions
- Consistent branding with "SwitchPDF" prefix

### 3. Backlink Building
- Build links to all domains
- Use different anchor text variations

## Technical Implementation

### Domain Detection
The `domain-config.js` automatically detects the current domain and:
- Updates page title
- Changes meta descriptions
- Sets canonical URLs
- Updates social media tags

### Canonical URLs
Each page sets its canonical URL to the current domain to prevent duplicate content issues.

## Monitoring & Maintenance

### Tools to Set Up:
1. **Google Analytics** - Track traffic per domain
2. **Google Search Console** - Monitor indexing per domain
3. **Uptime monitoring** - Ensure all domains are accessible
4. **SSL certificates** - All domains need HTTPS

### Regular Tasks:
- Update sitemaps when adding new tools
- Monitor search rankings across domains
- Update meta tags for seasonal campaigns

## Cost Optimization

### Hosting Costs:
- Use free tiers where possible (Vercel, Netlify, GitHub Pages)
- Consider domain-specific hosting based on traffic

### Domain Management:
- Keep all domains active
- Set up auto-renewal
- Monitor domain expiration dates

## Migration Checklist

- [ ] Point all domains to hosting services
- [ ] Set up SSL certificates
- [ ] Update DNS records
- [ ] Submit sitemaps to search engines
- [ ] Set up analytics tracking
- [ ] Test all tools on each domain
- [ ] Verify meta tags update correctly
- [ ] Test social sharing on each domain

## SEO canonical domain

`https://switchpdf.io` is the only canonical/indexable site. Secondary SwitchPDF domains should permanently redirect to `switchpdf.io` and should not publish duplicate site copies or separate sitemaps.
