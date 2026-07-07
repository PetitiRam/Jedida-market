import { useEffect, useState } from 'react';
import client from '../api/client';
import MediaUploader from './MediaUploader';
import PaymentMethodSelector from './PaymentMethodSelector';

function KycGate({ kycStatus, onSubmitted }) {
  const [idDocumentUrl, setIdDocumentUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!idDocumentUrl) { setError('Please upload your ID document first.'); return; }
    setBusy(true); setError('');
    try {
      await client.post('/kyc/submit', { idDocumentUrl, selfieUrl, documentType: 'national_id' });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit KYC.');
    } finally {
      setBusy(false);
    }
  };

  if (kycStatus === 'pending') {
    return <div className="alert alert-success">Your KYC documents are under review. You'll be notified once approved.</div>;
  }

  return (
    <div className="card-surface" style={{ marginBottom: 20 }}>
      <h4>Verify your identity to unlock withdrawals</h4>
      <p className="product-card-meta" style={{ marginBottom: 12 }}>
        You can keep selling without this — but withdrawing your earnings requires a quick one-time ID check.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {kycStatus === 'rejected' && <div className="alert alert-error">Your last submission was rejected. Please resubmit.</div>}

      <div style={{ marginBottom: 10 }}>
        <MediaUploader label="📄 Upload ID document" accept="image/*" onUploaded={(m) => setIdDocumentUrl(m.url)} />
        {idDocumentUrl && <p className="product-card-meta" style={{ marginTop: 4 }}>✔ ID document attached</p>}
      </div>
      <div style={{ marginBottom: 14 }}>
        <MediaUploader label="🤳 Upload selfie (optional)" accept="image/*" onUploaded={(m) => setSelfieUrl(m.url)} />
        {selfieUrl && <p className="product-card-meta" style={{ marginTop: 4 }}>✔ Selfie attached</p>}
      </div>
      <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit for verification'}</button>
    </div>
  );
}

function WithdrawForm({ wallet, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('flutterwave');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await client.post('/wallets/withdraw', { amount: Number(amount), method, destination });
      setAmount(''); setDestination('');
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit withdrawal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card-surface" style={{ marginTop: 20 }}>
      <h4>Withdraw funds</h4>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field-group">
        <label>Amount ({wallet.currency})</label>
        <input type="number" min="1" max={wallet.balance} value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="field-group">
        <label>Payout destination (phone / account number)</label>
        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. +256 7XX XXX XXX" required />
      </div>
      <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>Payout method</label>
      <div style={{ marginBottom: 14 }}>
        <PaymentMethodSelector value={method} onChange={setMethod} />
      </div>
      <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Request withdrawal'}</button>
    </form>
  );
}

export default function WalletKycPanel() {
  const [wallet, setWallet] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);

  const load = async () => {
    const [walletRes, kycRes, withdrawalsRes] = await Promise.all([
      client.get('/wallets/mine'),
      client.get('/kyc/status'),
      client.get('/wallets/withdrawals/mine')
    ]);
    setWallet(walletRes.data.wallet);
    setKycStatus(kycRes.data.kycStatus);
    setWithdrawals(withdrawalsRes.data.withdrawals || []);
  };
  useEffect(() => { load(); }, []);

  if (!wallet) return <div className="empty-state">Loading wallet…</div>;

  const canWithdraw = kycStatus === 'approved';

  return (
    <div>
      <div className="card-surface" style={{ textAlign: 'center', padding: 40, marginBottom: 20 }}>
        <p style={{ color: '#5B6760' }}>Available balance</p>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--forest)', fontFamily: 'var(--font-display)' }}>
          {wallet.currency} {Number(wallet.balance).toLocaleString()}
        </div>
        <p className="product-card-meta" style={{ marginTop: 8 }}>
          Funds appear here once the admin releases escrow after delivery is confirmed by all parties.
        </p>
      </div>

      {!canWithdraw && <KycGate kycStatus={kycStatus} onSubmitted={load} />}
      {canWithdraw && <WithdrawForm wallet={wallet} onDone={load} />}

      {withdrawals.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4>Withdrawal history</h4>
          {withdrawals.map((w) => (
            <div key={w.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{w.currency} {Number(w.amount).toLocaleString()} via {w.method}</span>
              <span className={`status-chip status-${w.status === 'paid' ? 'active' : w.status === 'rejected' ? 'rejected' : 'pending_review'}`}>{w.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
