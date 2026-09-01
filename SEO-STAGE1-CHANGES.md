# SwitchPDF SEO Stage 1 changes

Primary canonical site: https://www.switchpdf.io

## Changed
- Added unique HTML title, meta description, robots and canonical tags to every indexable HTML page.
- Removed the homepage JavaScript domain-based SEO override (`js/domain-config.js`). HTML metadata is now authoritative.
- Changed internal navigation/footer/tool-card links to clean canonical URLs.
- Added permanent redirects for `switchpdf.io` -> `www.switchpdf.io`.
- Added permanent redirects for secondary SwitchPDF domains -> `switchpdf.io`.
- Added permanent redirects from legacy `/pages/*.html` URLs to clean URLs.
- Kept Vercel rewrites from clean URLs to the existing `/pages/*.html` implementation files.
- Rebuilt `sitemap.xml` using only canonical clean URLs.
- Updated sitemap lastmod to 2026-09-01 because these pages were materially changed in this deployment.
- Simplified `generate-domain-files.js` so future generation only produces the primary-domain sitemap and robots.txt.
- Removed obsolete secondary-domain sitemap/robots artifacts.

## Deliberately not changed
- CSS/design/layout.
- PDF processing functionality.
- Page body copy/content strategy.
- JavaScript PDF tools.
- Structured data/FAQ schema beyond what already existed.

## Important deployment note
Vercel must have the following domains attached to this project if you want the host redirects to take effect:
- switchpdf.io
- www.switchpdf.io
- switchpdf.info / www.switchpdf.info
- switchpdf.one / www.switchpdf.one
- switchpdf.online / www.switchpdf.online

If a secondary domain is not attached to the Vercel project, its DNS/provider must perform the redirect instead.
