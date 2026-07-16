/**
 * Tracking Service for Google Tag (Gplay/GA4) and Meta Pixel
 */

let initializedGoogleTagId = null;
let initializedMetaPixelId = null;

/**
 * Initialize Google Tag (gtag.js) dynamically
 * @param {string} tagId 
 */
export const initGoogleTag = (tagId) => {
    if (!tagId || initializedGoogleTagId === tagId) return;
    
    try {
        // Remove existing script if any
        const existingScript = document.getElementById('gtag-script');
        if (existingScript) existingScript.remove();
        
        // Add gtag script tag
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
        script.id = 'gtag-script';
        document.head.appendChild(script);

        // Add gtag initialization script
        const initScript = document.createElement('script');
        initScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${tagId}', { 'send_page_view': false });
        `;
        document.head.appendChild(initScript);
        
        initializedGoogleTagId = tagId;
        console.log(`📊 Google Tag initialized with ID: ${tagId}`);
    } catch (error) {
        console.error("Failed to initialize Google Tag:", error);
    }
};

/**
 * Initialize Meta Pixel dynamically
 * @param {string} pixelId 
 */
export const initMetaPixel = (pixelId) => {
    if (!pixelId || initializedMetaPixelId === pixelId) return;

    try {
        // Initialize Meta Pixel script snippet
        if (!window.fbq) {
            !(function (f, b, e, v, n, t, s) {
                if (f.fbq) return;
                n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = !0;
                n.version = "2.0";
                n.queue = [];
                t = b.createElement(e);
                t.async = !0;
                t.src = v;
                s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s);
            })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
        }

        window.fbq('init', pixelId);
        initializedMetaPixelId = pixelId;
        console.log(`📊 Meta Pixel initialized with ID: ${pixelId}`);
    } catch (error) {
        console.error("Failed to initialize Meta Pixel:", error);
    }
};

/**
 * Initialize both Google Tag and Meta Pixel with agency settings
 * @param {string} googleTagId 
 * @param {string} metaPixelId 
 */
export const initializeTracking = (googleTagId, metaPixelId) => {
    if (googleTagId) initGoogleTag(googleTagId);
    if (metaPixelId) initMetaPixel(metaPixelId);
};

/**
 * Track page view event
 * @param {string} path - URL path
 * @param {string} title - Page title
 */
export const trackPageView = (path, title = document.title) => {
    // Track GA4 PageView
    if (window.gtag && initializedGoogleTagId) {
        window.gtag('event', 'page_view', {
            page_path: path,
            page_title: title
        });
    }

    // Track Meta PageView
    if (window.fbq && initializedMetaPixelId) {
        window.fbq('track', 'PageView');
    }
};

/**
 * Track lead submission event
 * @param {object} details - Lead information
 */
export const trackLeadSubmission = (details = {}) => {
    // Track GA4 Lead event
    if (window.gtag && initializedGoogleTagId) {
        window.gtag('event', 'generate_lead', {
            currency: 'INR',
            value: details.value || 0,
            lead_type: details.type || 'property_enquiry',
            location: details.location || ''
        });
    }

    // Track Meta Lead event
    if (window.fbq && initializedMetaPixelId) {
        window.fbq('track', 'Lead', {
            content_name: details.title || 'Property Enquiry',
            content_category: details.category || 'Real Estate',
            value: details.value || 0,
            currency: 'INR'
        });
    }
    console.log("📊 Lead submission tracked");
};

/**
 * Track custom contact click events (WhatsApp, Call, Email)
 * @param {string} type - 'whatsapp' | 'call' | 'email'
 */
export const trackContactClick = (type) => {
    if (window.gtag && initializedGoogleTagId) {
        window.gtag('event', 'contact_click', {
            contact_type: type
        });
    }

    if (window.fbq && initializedMetaPixelId) {
        window.fbq('track', 'Contact', {
            content_type: type
        });
    }
    console.log(`📊 Contact click (${type}) tracked`);
};
