#!/usr/bin/env node

// Generate the canonical SwitchPDF sitemap and robots.txt for the primary domain.
// www.switchpdf.io is the canonical/indexable host. Secondary domains should redirect to it.
const fs = require('fs');
const path = require('path');

const domain = 'www.switchpdf.io';
const tools = [
  'pdf-to-images', 'image-to-pdf', 'pdf-merger', 'pdf-splitter',
  'pdf-compressor', 'pdf-rotator', 'pdf-watermark', 'pdf-password-remover',
  'pdf-text-extractor', 'pdf-page-remover', 'pdf-metadata-editor', 'pdf-unlock'
];
const pages = ['about', 'contact', 'privacy', 'terms'];
const baseUrl = `https://${domain}`;
const lastmod = new Date().toISOString().slice(0, 10);

const urls = [
  '/',
  ...tools.map(tool => `/${tool}`),
  ...pages.map(page => `/${page}`)
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${baseUrl}${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /private/
Disallow: /.git/

Sitemap: ${baseUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(__dirname, 'robots.txt'), robots);
console.log(`Generated canonical sitemap.xml and robots.txt for ${domain}`);
