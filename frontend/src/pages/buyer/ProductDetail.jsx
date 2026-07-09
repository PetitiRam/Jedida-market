import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import * as commerceApi from '../../api/commerceApi';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import ProductGallery from '../../components/product/ProductGallery';
import OrbitingActionCards from '../../components/product/OrbitingActionCards';
import SupplierCard from '../../components/product/SupplierCard';
import TrustBadges from '../../components/product/TrustBadges';
import ProductTabs from '../../components/product/ProductTabs';
import RelatedProductsCarousel from '../../components/product/RelatedProductsCarousel';
import QuoteRequestModal from '../../components/product/QuoteRequestModal';
import Icon from '../../components/icons/Icon';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [notice, setNotice] = useState('');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

useEffect(() => {
  const loadProduct = async () => {
    try {
      const [{ data: productData }, { data: wishlistData }] =
        await Promise.all([
          client.get(`/products/${id}`),
          commerceApi.getWishlistStatus(id).catch(() => ({
            data: { wishlisted: false }
          }))
        ]);

      setProduct(productData.product);
      setWishlisted(wishlistData.wishlisted);
    } catch (err) {
      console.error(err);
    }
  };

  loadProduct();
}, [id]);

  const showNotice = (text) => { setNotice(text); setTimeout(() => setNotice(''), 3000); };

  const toggleWishlist = async () => {
    try {
      const { data } = await commerceApi.toggleWishlist(product.id);
      setWishlisted(data.wishlisted);
      showNotice(data.wishlisted ? 'Added to your wishlist.' : 'Removed from wishlist.');
    } catch (err) {
      if (err.response?.status === 401) navigate('/signin');
    }
  };

  const addToCart = async () => {
    setAddingToCart(true);
    try {
      await commerceApi.addToCart(product.id, qty);
      showNotice(`Added ${qty} × ${product.title} to your cart.`);
    } catch (err) {
      showNotice(err.response?.data?.error || 'Could not add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleOrbitAction = (key) => {
    switch (key) {
      case 'contact': contactMarketplace(); break;
      case 'quote': setQuoteModalOpen(true); break;
      case 'wishlist': toggleWishlist(); break;
      case 'share':
        navigator.clipboard.writeText(window.location.href);
        showNotice('Link copied to clipboard.');
        break;
      case 'specs': case 'package': case 'warranty': case 'manufacturer': case 'shipping': case 'reviews':
        document.getElementById('product-tabs-anchor')?.scrollIntoView({ behavior: 'smooth' });
        break;
      default: break;
    }
  };

  if (!product) return <div className="empty-state">Loading…</div>;

  const specs = product.specs || {};
  const hasDiscount = specs.original_price && Number(specs.original_price) > Number(product.price);
  const discountPercent = hasDiscount ? Math.round((1 - product.price / specs.original_price) * 100) : null;

  return (
    <div>
      <MarketplaceHeader />
      <div className="dash-body" style={{ maxWidth: 1240 }}>
        {notice && <div className="alert alert-success">{notice}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.9fr', gap: 28 }}>
          <div style={{ position: 'relative' }}>
            <ProductGallery images={product.images} videoUrl={product.video_url} view360Url={specs.view_360_url} title={product.title} />
            <OrbitingActionCards onAction={handleOrbitAction} radius={190} wishlisted={wishlisted} />
          </div>

          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>{product.title}</h1>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, fontSize: '0.8rem', color: '#5B6760' }}>
              {specs.brand && <span>Brand: <strong>{specs.brand}</strong></span>}
              {specs.manufacturer && <span>Manufacturer: <strong>{specs.manufacturer}</strong></span>}
              {specs.model_number && <span>Model: <strong>{specs.model_number}</strong></span>}
              {product.sku && <span>SKU: <strong>{product.sku}</strong></span>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {specs.verified_supplier && (
                <span className="product-card-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="checkShield" size={13} /> Verified Supplier
                </span>
              )}
              {specs.supplier_level && <span className="product-card-badge">{specs.supplier_level}</span>}
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: '0.82rem', color: '#8A9189', marginBottom: 16 }}>
              {specs.rating && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="starFilled" size={14} color="var(--amber)" filled /> {specs.rating} ({specs.review_count || 0} reviews)
                </span>
              )}
              <span>{product.orders_count} orders</span>
              <span>{product.views_count} views</span>
            </div>

            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--forest)' }}>
                {product.currency} {Number(product.price).toLocaleString()}
              </span>
              {hasDiscount && (
                <>
                  <span style={{ marginLeft: 10, textDecoration: 'line-through', color: '#8A9189' }}>
                    {product.currency} {Number(specs.original_price).toLocaleString()}
                  </span>
                  <span style={{ marginLeft: 8, color: 'var(--terracotta)', fontWeight: 700 }}>-{discountPercent}%</span>
                </>
              )}
            </div>

            {specs.wholesale_tiers?.length > 0 && (
              <div style={{ marginBottom: 14, fontSize: '0.8rem' }}>
                {specs.wholesale_tiers.map((tier, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#5B6760' }}>
                    <span>{tier.minQty}+ units</span><strong>{product.currency} {tier.price}/unit</strong>
                  </div>
                ))}
              </div>
            )}

            {specs.minimum_order_quantity && (
              <p style={{ fontSize: '0.8rem', color: '#8A9189', marginBottom: 10 }}>MOQ: {specs.minimum_order_quantity} units</p>
            )}

            <div className="field-group" style={{ maxWidth: 140, marginBottom: 14 }}>
              <label>Quantity</label>
              <input type="number" min="1" max={product.quantity_available} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>

            <p style={{ fontSize: '0.82rem', color: product.quantity_available > 0 ? 'var(--forest)' : '#8A2E10', marginBottom: 16 }}>
              {product.quantity_available > 0 ? `${product.quantity_available} available` : 'Out of stock'} · {product.condition?.replace('_', ' ')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" disabled={product.quantity_available === 0} onClick={() => navigate(`/checkout/${product.id}?qty=${qty}`)}>
                Buy Now
              </button>
              <button className="btn-secondary" disabled={product.quantity_available === 0 || addingToCart} onClick={addToCart}>
                {addingToCart ? 'Adding…' : 'Add to Cart'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => 
setQuoteModalOpen(true)}>
                  <Icon name="document" size={16} /> Request Quote
                </button>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <button className="btn-link" onClick={toggleWishlist} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="heart" size={16} filled={wishlisted} color={wishlisted ? 'var(--terracotta)' : 'currentColor'} />
                  {wishlisted ? 'Saved' : 'Save Product'}
                </button>
                <button className="btn-link" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="scale" size={16} /> Compare
                </button>
              </div>
            </div>

            <TrustBadges specs={specs} />
          </div>

<SupplierCard
  product={product}
  onReport={() => showNotice('Listing reported to the admin team.')}
/>
        </div>

        <div id="product-tabs-anchor" style={{ marginTop: 40 }}>
        <ProductTabs product={product} />
        </div>

        <RelatedProductsCarousel category={product.category} currentProductId={product.id} />
      </div>

      {quoteModalOpen && (
        <QuoteRequestModal
          product={product}
          onClose={() => setQuoteModalOpen(false)}
          onSubmitted={() => { setQuoteModalOpen(false); showNotice('Quote request sent to the admin team.'); }}
        />
      )}
    </div>
  );
}
