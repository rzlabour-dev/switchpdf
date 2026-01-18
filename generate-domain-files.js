#!/usr/bin/env node

// Domain-specific file generator for SwitchPDF
const fs = require('fs');
const path = require('path');

const domains = ['switchpdf.io', 'switchpdf.info', 'switchpdf.one', 'switchpdf.online'];

const tools = [
    'pdf-to-images',
    'image-to-pdf',
    'pdf-merger',
    'pdf-splitter',
    'pdf-compressor',
    'pdf-rotator',
    'pdf-watermark',
    'pdf-password-remover',
    'pdf-text-extractor',
    'pdf-page-remover',
    'pdf-metadata-editor',
    'pdf-unlock'
];

const pages = ['about', 'contact', 'privacy', 'terms'];

function generateSitemap(domain) {
    const baseUrl = `https://${domain}`;
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Main pages -->
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>2024-01-18</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
`;

    // Add static pages
    pages.forEach(page => {
        sitemap += `    <url>
        <loc>${baseUrl}/pages/${page}.html</loc>
        <lastmod>2024-01-18</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.${page === 'about' ? 8 : page === 'contact' ? 7 : 5}</priority>
    </url>
`;
    });

    // Add tool pages
    tools.forEach(tool => {
        sitemap += `    <url>
        <loc>${baseUrl}/pages/${tool}.html</loc>
        <lastmod>2024-01-18</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
`;
    });

    sitemap += '</urlset>';
    return sitemap;
}

function generateRobotsTxt(domain) {
    return `User-agent: *
Allow: /

# Block access to sensitive directories
Disallow: /admin/
Disallow: /private/
Disallow: /.git/

# Allow crawling of all PDF tools
Allow: /pages/

# Sitemap
Sitemap: https://${domain}/sitemap.xml`;
}

function generateFiles() {
    domains.forEach(domain => {
        // Generate sitemap
        const sitemap = generateSitemap(domain);
        fs.writeFileSync(path.join(__dirname, `sitemap-${domain}.xml`), sitemap);
        console.log(`Generated sitemap-${domain}.xml`);

        // Generate robots.txt
        const robotsTxt = generateRobotsTxt(domain);
        fs.writeFileSync(path.join(__dirname, `robots-${domain}.txt`), robotsTxt);
        console.log(`Generated robots-${domain}.txt`);
    });

    console.log('\nDomain-specific files generated successfully!');
    console.log('Copy these files to your domain-specific deployments.');
}

if (require.main === module) {
    generateFiles();
}

module.exports = { generateSitemap, generateRobotsTxt, generateFiles };