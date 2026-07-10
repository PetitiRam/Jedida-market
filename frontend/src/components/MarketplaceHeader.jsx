import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Logo from './Logo';
import * as commerceApi from '../api/commerceApi';
import Icon from './icons/icon';
export default function MarketplaceHeader() {
  const [ads, setAds] = useState([]);
  const [adIndex, setAdIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [logoOverride, setLogoOverride] = useState(null);
  const [cartCount, setCartCount] = useState(0);
 

useEffect(() => {
  commerceApi.getCart().then(({ data }) => setCartCount(data.count)).catch(() => {});
}, []);
  

  useEffect(() => {
    client.get('/ads').then(({ data }) => setAds(data.ads || [])).catch(() => {});
    client.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => {});
    client.get('/site/theme').then(({ data }) => setLogoOverride(data?.theme?.logo_url || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setAdIndex((i) => (i + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads]);

  const ad = ads[adIndex];

  const roleLink = () => {
    if (!user) return null;
    if (user.is_admin) return <Link to="/admin"><button className="btn-primary" style={{ width: 'auto', padding: '8px 18px' }}>⚙️ Admin Panel</button></Link>;
    if (user.primary_role === 'seller') return <Link to="/seller"><button className="btn-primary" style={{ width: 'auto', padding: '8px 18px' }}>🏪 Seller Dashboard</button></Link>;
    if (user.primary_role === 'delivery') return (
      <>
        <Link to="/driver"><button className="btn-primary" style={{ width: 'auto', padding: '8px 18px' }}>🚴 Driver Dashboard</button></Link>
        <Link to="/delivery" className="btn-link">Chat</Link>
      </>
    );
    return <Link to="/seller/upgrade" className="btn-link">Become a seller</Link>;
  };

  return (
    <>
      {ad && (
        <a href={ad.link_url || '#'} target="_blank" rel="noreferrer" style={{
          display: 'block', background: 'var(--amber)', color: '#16201B', textAlign: 'center',
          padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600
        }}>
          {ad.title}
        </a>
      )}
      <header className="dash-header">
        <Logo size={32} overrideUrl={logoOverride} />
        <div className="dash-header-right">
          <Link to="/marketplace" className="btn-link">Marketplace</Link>
          <Link to="/orders" className="btn-link">My Orders</Link>
          {roleLink()}
          <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
  <Icon name="cart" size={20} />
  {cartCount > 0 && (
    <span style={{
      position: 'absolute', top: -6, right: -8, background: 'var(--terracotta)', color: '#fff',
      fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px'
    }}>
      {cartCount}
    </span>
  )}
</Link>
           <span className="icon-btn">🔔</span>
        </div>
      </header>
    </>
  );
}
