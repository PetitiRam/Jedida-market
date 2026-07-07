import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminWithdrawalsPanel() {
  const [withdrawals, setWithdrawals] = useState(null);

  const load = () => client.get('/admin/withdrawals', { params: { status: 'pending' } })
    .then(({ data }) => setWithdrawals(data.withdrawals));
  useEffect(() => { load(); }, []);

  const review = async (id, decision) => {
    await client.post(`/admin/withdrawals/${id}/review`, { decision });
    load();
  };

  if (withdrawals === null) return <div className="empty-state">Loading withdrawal requests…</div>;
  if (withdrawals.length === 0) return <div className="empty-state">No withdrawal requests awaiting review.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {withdrawals.map((w) => (
        <div key={w.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>{w.full_name}</strong>
            <div className="product-card-meta">{w.email} · {w.currency} {Number(w.amount).toLocaleString()} via {w.method} → {w.destination}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => review(w.id, 'approve')}>Pay out</button>
            <button className="btn-secondary" onClick={() => review(w.id, 'reject')}>Reject & refund</button>
          </div>
        </div>
      ))}
    </div>
  );
}
