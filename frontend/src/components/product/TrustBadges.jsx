import Icon from '../icons/Icon';

const BADGES = [
  { key: 'checkShield', label: 'Verified Supplier', condition: (s) => s.verified_supplier },
  { key: 'factory', label: 'Verified Manufacturer', condition: (s) => s.verified_manufacturer },
  { key: 'shield', label: 'Secure Payments', condition: () => true },
  { key: 'checkShield', label: 'Escrow Protection', condition: () => true },
  { key: 'users', label: 'Buyer Protection', condition: () => true },
  { key: 'truck', label: 'Fast Delivery', condition: () => true },
  { key: 'starFilled', label: 'Quality Guaranteed', condition: () => true },
  { key: 'checkShield', label: 'Marketplace Verified', condition: () => true }
];

export default function TrustBadges({ specs = {} }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
      {BADGES.filter((b) => b.condition(specs)).map((b) => (
        <div key={b.label} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'var(--cream-dim)',
          padding: '6px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600
        }}>
          <Icon name={b.key} size={14} />
          {b.label}
        </div>
      ))}
    </div>
  );
}
