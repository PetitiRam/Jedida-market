import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import Icon from '../../components/icons/Icon';
import * as commerceApi from '../../api/commerceApi';
import client from '../../api/client';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';


export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [updating, setUpdating] = useState({});
const [method, setMethod] = useState('flutterwave');
const [checkingOut, setCheckingOut] = useState(false);
const [checkoutResult, setCheckoutResult] = useState(null);

const checkoutCart = async () => {
  setCheckingOut(true);
  try {
    const { data } = await client.post('/orders/cart-checkout', {
      method, shippingAddress: '' // add a shipping address field above if you want it collected here
    });
    setCheckoutResult(data);
  } catch (err) {
    alert(err.response?.data?.error || 'Could not check out.');
  } finally {
    setCheckingOut(false);
  }
};

const confirmPaid = async () => {
  await client.post(
    `/orders/cart-checkout/${checkoutResult.checkoutGroupId}/confirm`
  );
  navigate("/orders");
};
  const load = () => commerceApi.getCart().then(({ data }) => setCart(data));
  useEffect(() => { load(); }, []);

  const changeQuantity = async (itemId, newQty) => {
    setUpdating((u) => ({ ...u, [itemId]: true }));
    try {
      await commerceApi.updateCartItem(itemId, newQty);
      await load();
    } finally {
      setUpdating((u) => ({ ...u, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    await commerceApi.removeCartItem(itemId);
    load();
  };

  if (!cart) return <div className="empty-state">Loading cart…</div>;

  return (
    <div>
      <MarketplaceHeader />
      <div className="dash-body" style={{ maxWidth: 800 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="cart" size={22} /> Your Cart
        </h2>

        {cart.items.length === 0 ? (
          <div className="empty-state">Your cart is empty. Browse the marketplace to add products.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {cart.items.map((item) => (
                <div key={item.id} className="card-surface" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--cream-dim)', flexShrink: 0, overflow: 'hidden' }}>
                    {item.images?.[0] && <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong>{item.title}</strong>
                    <div className="product-card-meta">{item.currency} {Number(item.price).toLocaleString()} each</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="btn-secondary" style={{ padding: '4px 10px' }} disabled={updating[item.id] || item.quantity <= 1} onClick={() => 
changeQuantity(item.id, item.quantity - 1)}>−</button>
                    <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                    <button className="btn-secondary" style={{ padding: '4px 10px' }} disabled={updating[item.id] || item.quantity >= item.quantity_available} 
onClick={() => changeQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>

                  <strong style={{ minWidth: 90, textAlign: 'right' }}>{item.currency} {(item.price * item.quantity).toLocaleString()}</strong>

                  <button className="btn-link" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              ))}
            </div>

<div className="card-surface" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div className="product-card-meta">{cart.count} item(s)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--forest)' }}>
              {cart.items[0]?.currency} {cart.total.toLocaleString()}
            </div>
          </div>
        </div>

        {!checkoutResult ? (
          <>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>
              Payment method
            </label>

            <div style={{ marginBottom: 14 }}>
              <PaymentMethodSelector value={method} onChange={setMethod} />
            </div>

            <button
              className="btn-primary"
              disabled={checkingOut}
              onClick={checkoutCart}
            >
              {checkingOut ? "Processing..." : `Checkout all ${cart.count} item(s)`}
            </button>
          </>
        ) : (
          <>
            <div className="alert alert-success">
              {checkoutResult.message}
            </div>

            {checkoutResult.checkoutUrl ? (
              <a href={checkoutResult.checkoutUrl} target="_blank" rel="noreferrer">
                <button className="btn-primary" type="button">
                  Continue to {method}
                </button>
              </a>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#5B6760' }}>
                Sandbox mode — reference: {checkoutResult.providerReference}
              </p>
            )}

            <button
              className="btn-secondary"
              style={{ marginTop: 10, width: '100%' }}
              onClick={confirmPaid}
            >
              I've completed payment — move all items to escrow
            </button>
          </>
        )}
      </div>
    </>
  )}
</div>
</div>
);
}
