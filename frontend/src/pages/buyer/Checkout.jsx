import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';

export default function Checkout() {
  const { productId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qty = Number(params.get('qty') || 1);

  const [product, setProduct] = useState(null);
  const [method, setMethod] = useState('stripe');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    client.get(`/products/${productId}`).then(({ data }) => setProduct(data.product));
  }, [productId]);

  const placeOrder = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await client.post('/orders', {
        productId, quantity: qty, shippingAddress: address, method
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not place order.');
    } finally {
      setBusy(false);
    }
  };

  const confirmPaid = async () => {
    setBusy(true);
    try {
      await client.post(`/orders/${result.order.id}/confirm-payment`);
      navigate('/orders');
    } finally {
      setBusy(false);
    }
  };

  if (!product) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <MarketplaceHeader />
      <div className="dash-body" style={{ maxWidth: 560 }}>
        <h2>Checkout</h2>
        <div className="card-surface">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span>{product.title} × {qty}</span>
            <strong>{product.currency} {(product.price * qty).toLocaleString()}</strong>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {!result ? (
            <>
              <div className="field-group">
                <label>Shipping address</label>
                <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Where should this be delivered?" />
              </div>

              <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>Payment method</label>
              <div style={{ marginBottom: 16 }}>
                <PaymentMethodSelector value={method} onChange={setMethod} />
              </div>

              <button className="btn-primary" onClick={placeOrder} disabled={busy}>
                {busy ? 'Placing order…' : 'Place order'}
              </button>
              <p className="auth-footer-note">Your payment is held in escrow until delivery is confirmed by you, the seller, and delivery partner.</p>
            </>
          ) : (
            <>
              <div className="alert alert-success">{result.message}</div>
              {result.checkoutUrl ? (
                <a href={result.checkoutUrl} target="_blank" rel="noreferrer">
                  <button className="btn-primary" type="button">Continue to {method} →</button>
                </a>
              ) : (
                <p style={{ color: '#5B6760', fontSize: '0.85rem' }}>
                  Sandbox mode: no live {method} key configured yet. Reference: {result.providerReference}
                </p>
              )}
              <button className="btn-secondary" style={{ marginTop: 12, width: '100%' }} onClick={confirmPaid} disabled={busy}>
                {busy ? 'Confirming…' : "I've completed payment — move funds to escrow"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
