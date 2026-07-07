const METHODS = [
  { value: 'stripe', label: 'Card (Visa/Mastercard)', provider: 'Stripe', icon: '💳', note: 'Instant · 2.9% + $0.30 fee' },
  { value: 'flutterwave', label: 'Mobile Money', provider: 'Flutterwave', icon: '📱', note: 'M-Pesa, MTN, Airtel · 1.4% fee' },
  { value: 'dpo', label: 'Bank Transfer / Card', provider: 'DPO Pay', icon: '🏦', note: 'Pan-African bank rails · 3% fee' },
  { value: 'coinbase', label: 'Cryptocurrency', provider: 'Coinbase Commerce', icon: '🪙', note: 'BTC, ETH, USDC · network fee applies' }
];

export default function PaymentMethodSelector({ value, onChange, methods = METHODS }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {methods.map((m) => (
        <label
          key={m.value}
          className="card-surface"
          style={{
            padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            border: value === m.value ? '2px solid var(--forest)' : '1px solid var(--line)'
          }}
        >
          <input type="radio" name="payment-method" value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} />
          <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{m.label}</div>
            <div className="product-card-meta">{m.provider} · {m.note}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

export { METHODS as PAYMENT_METHODS };
