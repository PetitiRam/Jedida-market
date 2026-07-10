import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import * as shopApi from '../api/shopApi';
import * as commerceApi from '../api/commerceApi';
import Logo from '../components/Logo';
import Icon from '../components/icons/Icon';
import { CATEGORIES } from '../constants/categories';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'best_rated', label: 'Best Rated' }
];

function ProductCardShop({ product, view, onNavigate }) {
  const specs = product.specs || {};
  const hasDiscount = specs.original_price && Number(specs.original_price) > Number(product.price);
  const discountPercent = hasDiscount ? Math.round((1 - product.price / specs.original_price) * 100) : null;

  if (view === 'list') {
    return (
      <div onClick={onNavigate} className="card-surface" style={{ display: 'flex', gap: 14, cursor: 'pointer', marginBottom: 10 }}>
        <div style={{ width: 90, height: 90, borderRadius: 10, background: 'var(--cream-dim)', flexShrink: 0, overflow: 'hidden' }}>
          {product.images?.[0] && <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <strong>{product.title}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontWeight: 800, color: 'var(--forest)' }}>{product.currency} {Number(product.price).toLocaleString()}</span>
            {hasDiscount && <span style={{ textDecoration: 'line-through', color: '#8A9189', fontSize: '0.8rem' }}>{product.currency} {specs.original_price}</span>}
            {discountPercent && <span className="product-card-badge">-{discountPercent}%</span>}
          </div>
          <div className="product-card-meta">{product.quantity_available > 0 ? `${product.quantity_available} in stock` : 'Out of stock'}</div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onNavigate} className="product-card" style={{ cursor: 'pointer' }}>
      <div className="product-card-image">
        {product.images?.[0] ? <img src={product.images[0]} alt={product.title} /> : 'No image'}
      </div>
      <div className="product-card-body">
        {discountPercent && <span className="product-card-badge">-{discountPercent}%</span>}
        <div className="product-card-title">{product.title}</div>
        <div className="product-card-price">{product.currency} {Number(product.price).toLocaleString()}</div>
        {hasDiscount && <span style={{ textDecoration: 'line-through', color: '#8A9189', fontSize: '0.75rem' }}>{product.currency} {specs.original_price}</span>}
        <div className="product-card-meta">{product.quantity_available > 0 ? 'In stock' : 'Out of stock'}</div>
      </div>
    </div>
  );
}

export default function PublicShop() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    shopApi.getPublicShopV2(slug, { search, category, sort, view, page, limit: 24 })
      .then(({ data }) => { setShop(data.shop); setProducts(data.products); setPagination(data.pagination); })
      .catch((err) => setError(err.response?.data?.error || 'Shop not found.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [slug, search, category, sort, page]);

  useEffect(() => {
    if (!shop) return;
    client.get(`/shops/${shop.id}/follow/info`).then(({ data }) => setFollowing(data.following)).catch(() => {});
  }, [shop?.id]);

  const toggleFollow = async () => {
    const { data } = await commerceApi.toggleFollow(shop.id);
    setFollowing(data.following);
    setShop((s) => ({ ...s, followerCount: s.followerCount + (data.following ? 1 : -1) }));
  };

  const shareShop = () => {
    if (navigator.share) {
      navigator.share({ title: shop.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shop.share_link || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (loading && !shop) return <div className="empty-state">Loading shop…</div>;
  if (error) return <div className="empty-state">{error}</div>;

  return (
    <div>
      <header className="dash-header">
        <Logo size={32} />
        <Link to="/marketplace" className="btn-link">Main Marketplace →</Link>
      </header>

      {/* Cover banner */}
      <div style={{
        height: 200, background: shop.cover_image_url ? `url(${shop.cover_image_url}) center/cover` : 'linear-gradient(160deg, var(--forest), var(--forest-dark))',
        position: 'relative'
      }} />

      {/* Shop identity bar */}
      <div className="dash-body" style={{ maxWidth: 1100, paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: -48, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 96, height: 96, borderRadius: 16, background: '#fff', border: '4px solid #fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', flexShrink: 0
          }}>
            {shop.logo_url ? <img src={shop.logo_url} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <div style={{ width: '100%', height: '100%', background: 'var(--cream-dim)' }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.4rem' }}>{shop.name}</h1>
              {shop.is_verified && <Icon name="checkShield" size={18} color="var(--forest)" />}
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem', color: '#5B6760', flexWrap: 'wrap' }}>
              {(shop.location_city || shop.location_country) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="mapPin" size={13} /> {[shop.location_city, shop.location_country].filter(Boolean).join(', ')}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="starFilled" size={13} color="var(--amber)" filled /> {shop.rating.toFixed(1)} ({shop.reviewCount} reviews)
              </span>
              <span>{shop.followerCount} followers</span>
              <span>{shop.productsSold} sold</span>
              <span>Joined {new Date(shop.owner_joined_at).getFullYear()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={toggleFollow} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="users" size={15} filled={following} color={following ? 'var(--forest)' : 'currentColor'} />
              {following ? 'Following' : 'Follow'}
            </button>
            <button className="btn-secondary" onClick={shareShop} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="share" size={15} /> Share
            </button>
            <button className="btn-secondary" onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {shop.description && <p style={{ color: '#5B6760', maxWidth: 640, marginBottom: 24 }}>{shop.description}</p>}

        <div className="weave-divider" style={{ marginBottom: 24 }} />

        {/* Filters/search/sort/view toggle */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
          <div className="field-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
            <label>Search in this shop</label>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products…" />
          </div>
          <div className="field-group" style={{ minWidth: 160, marginBottom: 0 }}>
            <label>Category</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="field-group" style={{ minWidth: 160, marginBottom: 0 }}>
            <label>Sort by</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`btn-secondary ${view === 'grid' ? 'tab-pill-active' : ''}`} onClick={() => setView('grid')}>Grid</button>
            <button className={`btn-secondary ${view === 'list' ? 'tab-pill-active' : ''}`} onClick={() => setView('list')}>List</button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">No products match your search.</div>
        ) : view === 'grid' ? (
          <div className="product-grid">
            {products.map((p) => <ProductCardShop key={p.id} product={p} view="grid" onNavigate={() => navigate(`/product/${p.id}`)} />)}
          </div>
        ) : (
          <div>
            {products.map((p) => <ProductCardShop key={p.id} product={p} view="list" onNavigate={() => navigate(`/product/${p.id}`)} />)}
          </div>
        )}

        {pagination && pagination.total > pagination.limit && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span style={{ padding: '8px 0' }}>Page {page} of {Math.ceil(pagination.total / pagination.limit)}</span>
            <button className="btn-secondary" disabled={page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
