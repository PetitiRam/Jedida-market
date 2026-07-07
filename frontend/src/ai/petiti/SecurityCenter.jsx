import { useEffect, useState } from 'react';
import * as petitiApi from './petitiApi';

function AuthPolicyPanel() {
  const [policy, setPolicy] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => petitiApi.getAuthPolicy().then(({ data }) => setPolicy(data.policy));
  useEffect(() => { load(); }, []);

  // Translates a plain-language admin prompt into a bounded policy patch.
  // Deterministic keyword matching today — same pattern as Nsubuga Joseph/
  // Colline — swap for a real LLM call later without changing the endpoint.
  const interpretPrompt = (text) => {
    const t = text.toLowerCase();
    const patch = {};
    if (t.includes('stricter') || t.includes('tighter') || t.includes('secure')) {
      patch.maxFailedLogins = 3;
      patch.lockoutMinutes = 30;
      patch.minPasswordLength = 10;
    }
    if (t.includes('relax') || t.includes('looser') || t.includes('easier')) {
      patch.maxFailedLogins = 8;
      patch.lockoutMinutes = 5;
    }
    if (t.includes('otp') && t.includes('longer')) patch.otpExpiryMinutes = 20;
    if (t.includes('otp') && t.includes('shorter')) patch.otpExpiryMinutes = 5;
    return patch;
  };

  const submitPrompt = async () => {
    const patch = interpretPrompt(prompt);
    if (Object.keys(patch).length === 0) {
      setMessage('PETITI could not map that prompt to a policy change. Try "make sign-in stricter" or "relax lockouts".');
      return;
    }
    setBusy(true);
    try {
      const { data } = await petitiApi.upgradeAuthPolicy(patch, prompt);
      setPolicy(data.policy);
      setMessage(data.message);
      setPrompt('');
    } finally {
      setBusy(false);
    }
  };

  if (!policy) return <div className="empty-state">Loading policy…</div>;

  return (
    <div className="card-surface" style={{ marginBottom: 24 }}>
      <h4>Auth security policy — prompt PETITI to adjust it</h4>
      <p className="product-card-meta" style={{ marginBottom: 12 }}>
        Current: lockout after {policy.max_failed_logins} failed attempts for {policy.lockout_minutes} min ·
        OTP expires in {policy.otp_expiry_minutes} min · min password length {policy.min_password_length}
      </p>
      {message && <div className="alert alert-success">{message}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g. "Make sign-in stricter" or "Relax the lockout policy"'
        />
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={submitPrompt} disabled={busy || !prompt}>
          {busy ? 'Applying…' : 'Prompt PETITI'}
        </button>
      </div>
    </div>
  );
}

export default function SecurityCenter() {
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const load = () => {
    petitiApi.getSecurity().then(({ data }) => setReports(data.reports || []));
    petitiApi.getAlerts({ status: 'open' }).then(({ data }) => setAlerts(data.alerts || []));
  };
  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const { data } = await petitiApi.runSecurityScan();
      setScanResult(data.summary);
      load();
    } finally { setScanning(false); }
  };

  const resolve = async (id) => { await petitiApi.resolveAlert(id); load(); };

  return (
    <div>
      <AuthPolicyPanel />

      <button className="btn-primary" style={{ width: 'auto', padding: '12px 24px', marginBottom: 20 }} onClick={runScan} disabled={scanning}>
        {scanning ? 'PETITI is scanning…' : '🔍 Run full fraud scan'}
      </button>

      {scanResult && (
        <div className="alert alert-success">
          Scan complete: {Object.entries(scanResult).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </div>
      )}

      <h4>Open security alerts</h4>
      {alerts.length === 0 ? <div className="empty-state">No open alerts.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {alerts.map((a) => (
            <div key={a.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span className={`status-chip ${a.severity === 'critical' || a.severity === 'high' ? 'status-rejected' : 'status-pending_review'}`}>{a.severity}</span>
                <strong style={{ marginLeft: 8 }}>{a.title}</strong>
                <p className="product-card-meta">{a.description}</p>
              </div>
              <button className="btn-secondary" onClick={() => resolve(a.id)}>Resolve</button>
            </div>
          ))}
        </div>
      )}

      <h4>Fraud reports</h4>
      {reports.length === 0 ? <div className="empty-state">No fraud reports on file.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r) => (
            <div key={r.id} className="card-surface">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{r.category.replace(/_/g, ' ')}</strong>
                <span className="product-card-badge">Risk {r.risk_score}</span>
              </div>
              <p className="product-card-meta">{r.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
