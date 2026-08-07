// Dynamic sitemap.xml — lists the homepage, every active shop, and every
// active product, generated live from the database instead of the static
// frontend/public/sitemap.xml (which only ever lists the homepage).
//
// Mounted BEFORE the frontend's catch-all routing has any say (this is the
// backend, api.jedida-market.com), so it needs its own public route that
// the main site can either link to directly or that a Cloudflare/Pages
// redirect can point /sitemap.xml at. See note at the bottom of this file
// for the two ways to wire it to the root domain.
import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

// Root site domain — used to build absolute <loc> URLs. Falls back to
// PUBLIC_API_URL's origin logic isn't right here since product pages live
// on the frontend domain, not the API subdomain, so this reads FRONTEND_URL
// (first entry if it's a comma-separated list) with a hard-coded fallback.
function siteOrigin() {
  const raw = (process.env.FRONTEND_URL || '').split(',')[0].trim();
  return raw || 'https://jedida-market.com';
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>\n` +
    `    <loc>${xmlEscape(loc)}</loc>\n` +
    (lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n` : '') +
    (changefreq ? `    <changefreq>${changefreq}</changefreq>\n` : '') +
    (priority ? `    <priority>${priority}</priority>\n` : '') +
    `  </url>`;
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    const origin = siteOrigin();
    const entries = [
      urlEntry(`${origin}/`, null, 'daily', '1.0')
    ];

    // Active shops — /s/:slug (see frontend/src/App.jsx)
    const shops = await query(
      `SELECT slug, updated_at FROM shops WHERE status = 'active'`
    );
    for (const shop of shops.rows) {
      entries.push(urlEntry(`${origin}/s/${shop.slug}`, shop.updated_at, 'weekly', '0.7'));
    }

    // Active products — /product/:id (see frontend/src/App.jsx)
    const products = await query(
      `SELECT id, updated_at FROM products WHERE status = 'active'`
    );
    for (const product of products.rows) {
      entries.push(urlEntry(`${origin}/product/${product.id}`, product.updated_at, 'weekly', '0.6'));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      entries.join('\n') + '\n' +
      `</urlset>\n`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).type('text/plain').send('Could not generate sitemap.');
  }
});

export default router;

// ---- Wiring this to https://jedida-market.com/sitemap.xml ----
// This route lives on the backend (api.jedida-market.com/sitemap.xml),
// but Google needs it at the root domain. Two options:
//
// Option A (recommended, no extra backend hop): in Cloudflare, add a
// Bulk Redirect / Transform Rule so a request to
// https://jedida-market.com/sitemap.xml serves
// https://api.jedida-market.com/sitemap.xml's content instead of the
// static frontend/public/sitemap.xml file — remove that static file once
// this is live so there's no conflict.
//
// Option B: keep the static frontend/public/sitemap.xml, and instead
// reference this one separately (e.g. submit both to Search Console, or
// have the static file's purpose be just the homepage while a second
// sitemap index references this dynamic one at its api.jedida-market.com
// URL — Search Console accepts sitemaps hosted on a different subdomain
// once that subdomain is also verified as a property).
