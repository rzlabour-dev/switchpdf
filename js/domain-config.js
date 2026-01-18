// Domain Configuration for SwitchPDF
const DOMAIN_CONFIG = {
    'switchpdf.io': {
        name: 'SwitchPDF.io',
        canonical: 'https://switchpdf.io/',
        title: 'SwitchPDF.io | Futuristic PDF Tools - Free Online PDF Converter',
        description: 'Futuristic PDF tools: convert PDF to images, merge PDFs, split PDFs, compress PDFs, and more. Advanced browser-based PDF processing with cutting-edge technology.',
        ogImage: 'https://switchpdf.io/images/switchpdf-logo.svg'
    },
    'switchpdf.info': {
        name: 'SwitchPDF.info',
        canonical: 'https://switchpdf.info/',
        title: 'SwitchPDF.info | Futuristic PDF Tools - Free Online PDF Converter',
        description: 'Futuristic PDF tools: convert PDF to images, merge PDFs, split PDFs, compress PDFs, and more. Advanced browser-based PDF processing with cutting-edge technology.',
        ogImage: 'https://switchpdf.info/images/switchpdf-logo.svg'
    },
    'switchpdf.one': {
        name: 'SwitchPDF.one',
        canonical: 'https://switchpdf.one/',
        title: 'SwitchPDF.one | Futuristic PDF Tools - Free Online PDF Converter',
        description: 'Futuristic PDF tools: convert PDF to images, merge PDFs, split PDFs, compress PDFs, and more. Advanced browser-based PDF processing with cutting-edge technology.',
        ogImage: 'https://switchpdf.one/images/switchpdf-logo.svg'
    },
    'switchpdf.online': {
        name: 'SwitchPDF.online',
        canonical: 'https://switchpdf.online/',
        title: 'SwitchPDF.online | Futuristic PDF Tools - Free Online PDF Converter',
        description: 'Futuristic PDF tools: convert PDF to images, merge PDFs, split PDFs, compress PDFs, and more. Advanced browser-based PDF processing with cutting-edge technology.',
        ogImage: 'https://switchpdf.online/images/switchpdf-logo.svg'
    }
};

// Get current domain configuration
function getCurrentDomainConfig() {
    const hostname = window.location.hostname.toLowerCase();

    // Check for exact match first
    if (DOMAIN_CONFIG[hostname]) {
        return DOMAIN_CONFIG[hostname];
    }

    // Check for subdomain or www variant
    const baseDomain = hostname.replace(/^www\./, '');
    if (DOMAIN_CONFIG[baseDomain]) {
        return DOMAIN_CONFIG[baseDomain];
    }

    // Default fallback
    return DOMAIN_CONFIG['switchpdf.io'];
}

// Update meta tags dynamically
function updateMetaTags() {
    const config = getCurrentDomainConfig();

    // Update title
    document.title = config.title;

    // Update meta description
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
        descriptionMeta.setAttribute('content', config.description);
    }

    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
        canonicalLink.setAttribute('href', config.canonical);
    }

    // Update Open Graph tags
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', config.canonical);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', config.title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', config.description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', config.ogImage);

    // Update Twitter tags
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute('content', config.canonical);

    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', config.title);

    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', config.description);

    const twitterImage = document.querySelector('meta[property="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', config.ogImage);
}

// Initialize domain-specific settings
document.addEventListener('DOMContentLoaded', function() {
    updateMetaTags();
});

// Export for use in other scripts
window.DomainConfig = {
    getCurrentDomainConfig,
    updateMetaTags
};