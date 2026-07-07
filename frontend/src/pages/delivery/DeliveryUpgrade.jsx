import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import Logo from '../../components/Logo';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';

const emptyApplication = { vehicleType: '', licensePlate: '', serviceArea: '' };

export default function DeliveryUpgrade() {
  const navigate = useNavigate();
  const [upgrades, setUpgrades] = useState([]);
  const [application, setApplication] = useState(emptyApplication);
  const [method, setMethod] = useState('flutterwave');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/upgrade/status');
      setUpgrades(data.upgrades || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your upgrade status.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const latest = upgrades.find((u) => u.requested_role === 'delivery');

  const submitApplication = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await client.post('/upgrade/request', { requestedRole: 'delivery', applicationData: application });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit your application.');
    } finally {
      setBusy(false);
    }
  };

  const payFee = async () => {
    setBusy(true); setError('');
    try {
      await client.post('/upgrade/pay-fee', { upgradeId: latest.id, paymentReference: `${method.toUpperCase()}-MOCK-${Date.now()}` });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record your payment.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ padding: 48 }}>Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card-surface" style={{ maxWidth: 520, width: '100%' }}>
        <Logo size={32} />
        <h2 style={{ marginTop: 24 }}>Become a delivery partner</h2>
        <p style={{ color: '#5B6760' }}>
          Two quick steps: tell us about your vehicle and coverage area, then pay the
          one-time 1,000 verification fee. Identity (KYC) verification happens later,
          once you're in your delivery dashboard — you can start receiving assigned
          deliveries right away.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {!latest && (
          <form onSubmit={submitApplication}>
            <div className="eyebrow">Step 1 of 2 — Vehicle & coverage details</div>
            <div className="field-group">
              <label>Vehicle type</label>
              <select value={application.vehicleType} onChange={(e) => setApplication({ ...application, vehicleType: e.target.value })} required>
                <option value="">Select one</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
                <option value="van">Van / truck</option>
                <option value="on_foot">On foot</option>
              </select>
            </div>
            <div className="field-group">
              <label>License plate (if applicable)</label>
              <input value={application.licensePlate} onChange={(e) => setApplication({ ...application, licensePlate: e.target.value })} placeholder="e.g. UBA 123X, or 'N/A'" required />
            </div>
            <div className="field-group">
              <label>Service area</label>
              <input value={application.serviceArea} onChange={(e) => setApplication({ ...application, serviceArea: e.target.value })} placeholder="e.g. Kampala Central & Nakawa" required />
            </div>
            <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Continue to payment'}</button>
          </form>
        )}

        {latest?.status === 'pending_payment' && (
          <>
            <div className="eyebrow" style={{ marginTop: 20 }}>Step 2 of 2 — Verification fee</div>
            <div className="alert alert-success">Application received. Select how you'd like to pay the {latest.verification_fee_amount} verification fee.</div>
            <div style={{ marginBottom: 16 }}>
              <PaymentMethodSelector value={method} onChange={setMethod} />
            </div>
            <button className="btn-primary" onClick={payFee} disabled={busy}>
              {busy ? 'Processing…' : `Pay ${latest.verification_fee_amount} and submit for approval`}
            </button>
          </>
        )}

        {latest?.status === 'pending_approval' && (
          <div className="alert alert-success">
            Payment received. Your application is awaiting admin approval — you'll get a notification once it's reviewed.
          </div>
        )}

        {latest?.status === 'approved' && (
          <>
            <div className="alert alert-success">You're approved! Go to your delivery dashboard.</div>
            <button className="btn-primary" onClick={() => navigate('/delivery')}>Go to delivery dashboard →</button>
          </>
        )}

        {latest?.status === 'rejected' && (
          <div className="alert alert-error">Your application was declined. Contact support for details.</div>
        )}
      </div>
    </div>
  );
}
