import { useEffect, useState } from 'react';
import client from '../../api/client';
import { CATEGORIES } from '../../constants/categories';

const STATUS_TABS = [
  { key: 'pending_review', label: 'Pending review' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'paused', label: 'Paused' },
  { key: '', label: 'All' }
];

function ProductRow({ product, onApprove, onReject, onToggleFeature, onDelete }) {
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(product.id); } finally { setBusy(false); }
  };

  return (
    <div className="card-surface" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
      <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--cream-dim)', flexShrink: 0, overflow: 'hidden' }}>
        {product.images?.[0] && <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>{product.title}</strong>
          {product.is_featured && <span className="product-card-badge">Featured</span>}
        </div>
        <div className="product-card-meta">
          {product.shop_name} · {product.currency} {Number(product.price).toLocaleString()} · {product.category?.replace('_', ' ')}
        </div>
        <div className="product-card-meta">{product.views_count} views · {product.orders_count} orders</div>
      </div>

      <span className={`status-chip status-${product.status}`}>{product.status.replace('_', ' ')}</span>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {product.status === 'pending_review' && (
          <>
            <button className="btn-primary" style={{ width: 'auto', padding: '7px 14px' }} disabled={busy} onClick={() => run(onApprove)}>Approve</button>
            <button className="btn-secondary" disabled={busy} onClick={() => run(onReject)}>Reject</button>
          </>
        )}
        {product.status === 'active' && (
          <button className="btn-secondary" disabled={busy} onClick={() => run(onToggleFeature)}>
            {product.is_featured ? 'Unfeature' : 'Feature'}
          </button>
        )}
        <button className="btn-link" disabled={busy} onClick={() => { if (confirm('Remove this listing permanently?')) run(onDelete); }}>Remove</button>
      </div>
    </div>
  );
}

export default function AdminProductsPanel() {
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState(null);

  const load = () => {
    const endpoint = statusFilter === 'pending_review' ? '/admin/products/pending' : '/admin/products';
    const params = statusFilter === 'pending_review'
      ? {}
      : { status: statusFilter || undefined, category: category || undefined };
    client.get(endpoint, { params }).then(({ data }) => setProducts(data.products));
  };
  useEffect(() => { load(); }, [statusFilter, category]);

  const approve = (id) => client.post(`/admin/products/${id}/review`, { decision: 'approve' }).then(load);
  const reject = (id) => client.post(`/admin/products/${id}/review`, { decision: 'reject' }).then(load);
  const toggleFeature = (id) => client.patch(`/admin/products/${id}/feature`).then(load);
  const remove = (id) => client.delete(`/admin/products/${id}`).then(load);

  return (
    <div>
      <div className="tab-scroll" style={{ marginBottom: 12 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-pill ${statusFilter === t.key ? 'tab-pill-active' : ''}`}
            onClick={() => setStatusFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {statusFilter !== 'pending_review' && (
        <div className="field-group" style={{ maxWidth: 220, marginBottom: 16 }}>
          <label>Filter by category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      {products === null ? (
        <div className="empty-state">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="empty-state">No products in this view.</div>
      ) : (
        products.map((p) => (
          <ProductRow
            key={p.id} product={p}
            onApprove={approve} onReject={reject}
            onToggleFeature={toggleFeature} onDelete={remove}
          />
        ))
      )}
    </div>
  );
}
