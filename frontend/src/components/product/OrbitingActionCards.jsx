import { useState } from 'react';
import Icon from '../icons/Icon';

const ACTIONS = [
  { key: 'contact', icon: 'message', label: 'Contact Marketplace' },
  { key: 'manufacturer', icon: 'factory', label: 'Manufacturer' },
  { key: 'verified', icon: 'checkShield', label: 'Verified Supplier' },
  { key: 'location', icon: 'mapPin', label: 'Seller Location' },
  { key: 'shipping', icon: 'truck', label: 'Shipping' },
  { key: 'warranty', icon: 'shield', label: 'Warranty' },
  { key: 'reviews', icon: 'star', label: 'Reviews' },
  { key: 'wishlist', icon: 'heart', label: 'Wishlist' },
  { key: 'share', icon: 'share', label: 'Share' },
  { key: 'quote', icon: 'document', label: 'Request Quote' },
  { key: 'package', icon: 'box', label: 'Package Contents' },
  { key: 'specs', icon: 'chart', label: 'Specifications' }
];

export default function OrbitingActionCards({ onAction, radius = 200, wishlisted = false }) {
  const [hovered, setHovered] = useState(null);
  const [paused, setPaused] = useState(false);
  const angleStep = 360 / ACTIONS.length;

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHovered(null); }}
    >
      <div style={{ position: 'absolute', inset: 0, animation: paused ? 'none' : 'orbit-spin 40s linear infinite', pointerEvents: 'none' }}>
        {ACTIONS.map((action, i) => {
          const angle = angleStep * i;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const isHovered = hovered === action.key;
          const isWishlist = action.key === 'wishlist';

          return (
            <div
              key={action.key}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                animation: paused ? 'none' : 'orbit-counter-spin 40s linear infinite',
                pointerEvents: 'auto', zIndex: isHovered ? 10 : 1
              }}
            >
              <button
                onMouseEnter={() => setHovered(action.key)}
                onClick={() => onAction(action.key)}
                title={action.label}
                style={{
                  width: isHovered ? 'auto' : 44, height: 44, minWidth: 44, borderRadius: isHovered ? 22 : '50%',
                  border: '1px solid var(--line)', background: '#fff', boxShadow: '0 4px 12px rgba(22,32,27,0.15)',
                  display: 'flex', alignItems: 'center', gap: 6, padding: isHovered ? '0 14px' : 0,
                  cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                }}
              >
                <Icon
                  name={isWishlist && wishlisted ? 'heartFilled' : action.icon}
                  size={18}
                  filled={isWishlist && wishlisted}
                  color={isWishlist && wishlisted ? 'var(--terracotta)' : 'var(--ink)'}
                />
                {isHovered && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{action.label}</span>}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes orbit-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit-counter-spin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
}
