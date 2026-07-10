import { query } from '../config/db.js';

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function uniqueSlug(base) {
  let slug = slugify(base) || 'shop';
  let attempt = 0;
  // append a short random suffix until it's unique
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = await query('SELECT id FROM shops WHERE slug = $1', [candidate]);
    if (existing.rows.length === 0) return candidate;
    attempt += 1;
  }
}

// A seller may only create a shop once their seller upgrade is approved.
export async function createShop(req, res) {
  const { name, description, primaryCategory, currency } = req.body;
  const ownerId = req.user.id;

  if (!name) return res.status(400).json({ error: 'Shop name is required.' });

  try {
    const userResult = await query('SELECT primary_role FROM users WHERE id = $1', [ownerId]);
    if (userResult.rows[0]?.primary_role !== 'seller') {
      return res.status(403).json({ error: 'Your seller upgrade must be approved before you can open a shop.' });
    }

    const existingShop = await query('SELECT id FROM shops WHERE owner_id = $1', [ownerId]);
    if (existingShop.rows.length > 0) {
      return res.status(409).json({ error: 'You already have a shop.' });
    }

    const slug = await uniqueSlug(name);
    const backendUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const shareLink = `${backendUrl}/shop/${slug}`;

    const result = await query(
      `INSERT INTO shops (owner_id, name, slug, description, primary_category, currency, share_link, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [ownerId, name, slug, description || null, primaryCategory || 'other', currency || 'USD', shareLink]
    );

    return res.status(201).json({
      message: 'Shop created. It will go live once approved by the admin.',
      shop: result.rows[0]
    });
  } catch (err) {
    console.error('Create shop error:', err);
    return res.status(500).json({ error: 'Could not create shop.' });
  }
}

export async function getMyShop(req, res) {
  try {
    const result = await query('SELECT * FROM shops WHERE owner_id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No shop found for your account yet.' });
    return res.json({ shop: result.rows[0] });
  } catch (err) {
    console.error('Get my shop error:', err);
    return res.status(500).json({ error: 'Could not load your shop.' });
  }
}

export async function updateMyShop(req, res) {
  const { name, description, logoUrl, bannerUrl, primaryCategory, currency } = req.body;
  try {
    const result = await query(
      `UPDATE shops SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         logo_url = COALESCE($3, logo_url),
         banner_url = COALESCE($4, banner_url),
         primary_category = COALESCE($5, primary_category),
         currency = COALESCE($6, currency)
       WHERE owner_id = $7 RETURNING *`,
      [name, description, logoUrl, bannerUrl, primaryCategory, currency, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No shop found for your account.' });
    return res.json({ message: 'Shop updated.', shop: result.rows[0] });
  } catch (err) {
    console.error('Update shop error:', err);
    return res.status(500).json({ error: 'Could not update shop.' });
  }
}

// Public — powers both the SPA shop page and the social-preview HTML route.
// Returns the shop "structure": profile + active product listings.
export async function getPublicShopBySlug(req, res) {
  const { slug } = req.params;
  try {
    const shopResult = await query(
      `SELECT id, name, slug, description, logo_url, banner_url, primary_category, currency, status, created_at
       FROM shops WHERE slug = $1`,
      [slug]
    );
    const shop = shopResult.rows[0];
    if (!shop) return res.status(404).json({ error: 'Shop not found.' });

    const productsResult = await query(
      `SELECT id, title, price, currency, images, category, condition, is_featured, is_trending, created_at
       FROM products WHERE shop_id = $1 AND status = 'active'
       ORDER BY is_featured DESC, created_at DESC LIMIT 60`,
      [shop.id]
    );

    return res.json({ shop, products: productsResult.rows });
  } catch (err) {
    console.error('Get public shop error:', err);
    return res.status(500).json({ error: 'Could not load shop.' });
  }
}

export async function listAllShops(req, res) {
  try {
    const result = await query(
      `SELECT id, name, slug, description, logo_url, banner_url, primary_category, created_at
       FROM shops WHERE status = 'active' ORDER BY created_at DESC LIMIT 100`
    );
    return res.json({ shops: result.rows });
  } catch (err) {
    console.error('List shops error:', err);
    return res.status(500).json({ error: 'Could not load shops.' });
  }
}
const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'whatsapp', 'x'];

// Full settings update — everything the redesigned Shop Settings panel needs,
// beyond the basic name/description/category already handled by updateMyShop.
export async function updateShopSettings(req, res) {
  const {
    slug, coverImageUrl, contactEmail, contactPhone, socialLinks, businessHours,
    themePrimaryColor, themeAccentColor, returnPolicy, shippingPolicy, termsContent
  } = req.body;

  try {
    if (slug) {
      const existing = await query('SELECT id FROM shops WHERE slug = $1 AND owner_id != $2', [slug, req.user.id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'That shop URL is already taken.' });
      }
    }

    const filteredSocial = {};
    if (socialLinks) {
      for (const key of SOCIAL_PLATFORMS) {
        if (socialLinks[key] !== undefined) filteredSocial[key] = socialLinks[key];
      }
    }

    const result = await query(
      `UPDATE shops SET
         slug = COALESCE($1, slug),
         cover_image_url = COALESCE($2, cover_image_url),
         contact_email = COALESCE($3, contact_email),
         contact_phone = COALESCE($4, contact_phone),
         social_links = COALESCE($5, social_links),
         business_hours = COALESCE($6, business_hours),
         theme_primary_color = COALESCE($7, theme_primary_color),
         theme_accent_color = COALESCE($8, theme_accent_color),
         return_policy = COALESCE($9, return_policy),
         shipping_policy = COALESCE($10, shipping_policy),
         terms_content = COALESCE($11, terms_content)
       WHERE owner_id = $12 RETURNING *`,
      [
        slug || null, coverImageUrl || null, contactEmail || null, contactPhone || null,
        Object.keys(filteredSocial).length ? filteredSocial : null, businessHours || null,
        themePrimaryColor || null, themeAccentColor || null, returnPolicy || null,
        shippingPolicy || null, termsContent || null, req.user.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No shop found for your account.' });
    return res.json({ message: 'Shop settings updated. Changes are live on your public shop page immediately.', shop: result.rows[0] });
  } catch (err) {
    console.error('Update shop settings error:', err);
    return res.status(500).json({ error: 'Could not update shop settings.' });
  }
}

export async function setFeaturedProducts(req, res) {
  const { productIds } = req.body;
  const shop = await query('SELECT id FROM shops WHERE owner_id = $1', [req.user.id]);
  if (shop.rows.length === 0) return res.status(404).json({ error: 'No shop found for your account.' });

  await query('UPDATE shops SET featured_product_ids = $1 WHERE id = $2', [productIds, shop.rows[0].id]);
  res.json({ message: 'Featured products updated.' });
}

// Enriched public shop payload — logo, banner, verification, live-computed
// rating/products-sold/followers, and full product browsing support
// (search/category/price filter/sort/pagination) for the shop's own
// product grid, per the redesign spec.
export async function getPublicShopBySlugV2(req, res) {
  const { slug } = req.params;
  const { search, category, minPrice, maxPrice, sort = 'newest', view = 'grid', page = 1, limit = 24 } = req.query;

  try {
    const shopResult = await query(
      `SELECT s.*, u.created_at AS owner_joined_at FROM shops s JOIN users u ON u.id = s.owner_id WHERE s.slug = $1`,
      [slug]
    );
    const shop = shopResult.rows[0];
    if (!shop) return res.status(404).json({ error: 'Shop not found.' });

    const [ratingResult, soldResult, followerResult] = await Promise.all([
query(
  `SELECT COALESCE(AVG(r.rating), 0) AS average, COUNT(r.id) AS count
   FROM product_reviews r JOIN products p ON p.id = r.product_id
   WHERE p.shop_id = $1`,
  [shop.id]
      ),
      query(
        `SELECT COALESCE(SUM(o.quantity), 0) AS total FROM orders o WHERE o.shop_id = $1 AND o.status = 'completed'`,
        [shop.id]
      ),
      query('SELECT COUNT(*) AS count FROM shop_follows WHERE shop_id = $1', [shop.id])
    ]);

    const conditions = ['shop_id = $1', `status = 'active'`];
    const values = [shop.id];
    let i = 2;
    if (search) { conditions.push(`title ILIKE $${i}`); values.push(`%${search}%`); i += 1; }
    if (category) { conditions.push(`category = $${i}`); values.push(category); i += 1; }
    if (minPrice) { conditions.push(`price >= $${i}`); values.push(minPrice); i += 1; }
    if (maxPrice) { conditions.push(`price <= $${i}`); values.push(maxPrice); i += 1; }

    const orderBy = {
      newest: 'created_at DESC', popular: 'orders_count DESC',
      price_low: 'price ASC', price_high: 'price DESC', best_rated: 'is_featured DESC, created_at DESC'
    }[sort] || 'created_at DESC';

    const offset = (Number(page) - 1) * Number(limit);
    values.push(Number(limit), offset);

    const productsResult = await query(
      `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy} LIMIT $${i} OFFSET $${i + 1}`,
      values
    );
    const countResult = await query(`SELECT COUNT(*) FROM products WHERE ${conditions.join(' AND ')}`, values.slice(0, i - 1));

    return res.json({
      shop: {
        ...shop,
        rating: Number(ratingResult.rows[0].average),
        reviewCount: Number(ratingResult.rows[0].count),
        productsSold: Number(soldResult.rows[0].total),
        followerCount: Number(followerResult.rows[0].count)
      },
      products: productsResult.rows,
      pagination: { page: Number(page), limit: Number(limit), total: Number(countResult.rows[0].count) },
      view
    });
  } catch (err) {
    console.error('Get public shop v2 error:', err);
    return res.status(500).json({ error: 'Could not load shop.' });
  }
}
