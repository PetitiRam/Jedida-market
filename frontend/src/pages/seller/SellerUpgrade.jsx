import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import Logo from '../../components/Logo';
import MediaUploader from '../../components/MediaUploader';
import ChatPanel from '../../components/ChatPanel';

const STEP_ORDER = ['pending_payment', 'payment_submitted', 'payment_verified', 'kyc_pending', 'kyc_verified', 'approved'];

function ProgressBar({ status }) {
  const labels = ['Request', 'Payment', 'Verified', 'KYC', 'Reviewed', 'Approved'];
  const currentIndex = Math.max(0, STEP_ORDER.indexOf(status));
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {labels.map((label, i) => (
        <div key={label} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            height: 6, borderRadius: 999, marginBottom: 4,
            background: i <= currentIndex ? 'var(--forest)' : 'var(--line)'
          }} />
          <span style={{ fontSize: '0.7rem', color: i <= currentIndex ? 'var(--forest)' : '#8A9189' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SellerUpgrade() {
  const navigate = useNavigate();
  const [upgrades, setUpgrades] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [motivation, setMotivation] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [idFront, setIdFront] = useState('');
  const [idBack, setIdBack] = useState('');
  const [selfie, setSelfie] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/upgrade/status');
      setUpgrades(data.upgrades || []);
      setPaymentInfo(data.paymentInstructions);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your upgrade status.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const latest = upgrades.find((u) => u.requested_role === 'seller');

  const submitRequest = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await client.post('/upgrade/request', {
        requestedRole: 'seller',
        applicationData: { businessName, motivation }
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit your request.');
    } finally {
      setBusy(false);
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await client.post('/upgrade/payment', { upgradeId: latest.id, paymentReference, proofOfPaymentUrl: proofUrl });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit payment.');
    } finally {
      setBusy(false);
    }
  };

  const submitKyc = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await client.post('/upgrade/kyc', {
        upgradeId: latest.id, nationalIdFrontUrl: idFront, nationalIdBackUrl: idBack, selfieUrl: selfie
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit KYC documents.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ padding: 48 }}>Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <div className="card-surface">
          <Logo size={32} />
          <h2 style={{ marginTop: 20 }}>Become a seller</h2>
          {latest && <ProgressBar status={latest.status} />}
          {error && <div className="alert alert-error">{error}</div>}

          {/* STEP 1 — no request yet */}
          {!latest && (
            <form onSubmit={submitRequest}>
              <div className="eyebrow">Step 1 — Application</div>
              <div className="field-group">
                <label>Business / shop name</label>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>
              <div className="field-group">
                <label>Why do you want to sell on JEDIDA? (optional)</label>
                <textarea rows={3} value={motivation} onChange={(e) => setMotivation(e.target.value)} />
              </div>
              <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
            </form>
          )}

          {/* STEP 2 — payment required, mandatory, no skipping */}
          {latest?.status === 'pending_payment' && (
            <form onSubmit={submitPayment}>
              <div className="eyebrow">Step 2 — Payment (mandatory)</div>
              <div className="alert alert-success">
                Send <strong>{paymentInfo?.amount} {paymentInfo?.currency}</strong> to <strong>{paymentInfo?.number}</strong>, then enter your payment reference below.
              </div>
              <div className="field-group">
                <label>Payment reference</label>
                <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction ID / reference code" required />
              </div>
              <div className="field-group">
                <label>Proof of payment (optional but recommended)</label>
                <MediaUploader label="📎 Upload proof of payment" accept="image/*" onUploaded={(m) => setProofUrl(m.url)} />
                {proofUrl && <p className="product-card-meta" style={{ marginTop: 4 }}>✔ Proof attached</p>}
              </div>
              <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit payment'}</button>
            </form>
          )}

          {latest?.status === 'payment_submitted' && (
            <div className="alert alert-success">Payment submitted. An admin is verifying it — you can message them below in the meantime.</div>
          )}
          {latest?.status === 'payment_rejected' && (
            <div className="alert alert-error">Your payment could not be verified. Please message the admin team below for help.</div>
          )}

          {/* STEP 3 — KYC, only unlocked after payment_verified */}
          {latest?.status === 'payment_verified' && (
            <form onSubmit={submitKyc}>
              <div className="eyebrow">Step 3 — Identity verification (mandatory)</div>
              <div className="field-group">
                <label>National ID — front</label>
                <MediaUploader label="🪪 Upload ID front" accept="image/*" onUploaded={(m) => setIdFront(m.url)} />
                {idFront && <p className="product-card-meta">✔ Attached</p>}
              </div>
              <div className="field-group">
                <label>National ID — back</label>
                <MediaUploader label="🪪 Upload ID back" accept="image/*" onUploaded={(m) => setIdBack(m.url)} />
                {idBack && <p className="product-card-meta">✔ Attached</p>}
              </div>
              <div className="field-group">
                <label>Selfie holding your ID (optional but recommended)</label>
                <MediaUploader label="🤳 Upload selfie" accept="image/*" onUploaded={(m) => setSelfie(m.url)} />
                {selfie && <p className="product-card-meta">✔ Attached</p>}
              </div>
              <button className="btn-primary" disabled={busy || !idFront || !idBack}>{busy ? 'Submitting…' : 'Submit KYC documents'}</button>
            </form>
          )}

          {latest?.status === 'kyc_pending' && (
            <div className="alert alert-success">KYC submitted. An admin is reviewing your documents.</div>
          )}
          {latest?.status === 'kyc_rejected' && (
            <div className="alert alert-error">Your KYC documents were rejected. Please message the admin team below.</div>
          )}
          {latest?.status === 'kyc_verified' && (
            <div className="alert alert-success">Your identity is verified. Final approval is pending — you'll get a notification once approved.</div>
          )}

          {latest?.status === 'approved' && (
            <>
              <div className="alert alert-success">You're approved! You can now access your seller dashboard.</div>
              <button className="btn-primary" onClick={() => navigate('/seller')}>Go to seller dashboard →</button>
            </>
          )}

          {latest?.status === 'rejected' && (
            <div className="alert alert-error">Your application was rejected. Please message the admin team below for details.</div>
          )}
        </div>

        {/* Communicate with admin at any point before approval */}
        {latest && latest.status !== 'approved' && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Message the admin team</h4>
            <ChatPanel />
          </div>
        )}
      </div>
    </div>
  );
}
