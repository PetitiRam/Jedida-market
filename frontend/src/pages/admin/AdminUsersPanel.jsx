import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await client.get('/admin/users', {
      params: { role: roleFilter || undefined }
    });
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [roleFilter]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const clearSelection = () => setSelected([]);

  const makeAdmin = async () => {
    if (!confirm(`Make ${selected.length} user(s) admin?`)) return;
    setBusy(true);
    try {
      await Promise.all(
        selected.map((id) =>
          client.post(`/admin/users/${id}/make-admin`)
        )
      );
      clearSelection();
      load();
    } finally {
      setBusy(false);
    }
  };

  const makeSeller = async () => {
    if (!confirm(`Convert ${selected.length} user(s) to sellers?`)) return;
    setBusy(true);
    try {
      await Promise.all(
        selected.map((id) =>
          client.patch(`/admin/users/${id}/status`, {
            role: 'seller'
          })
        )
      );
      clearSelection();
      load();
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (userId, status) => {
    await client.patch(`/admin/users/${userId}/status`, { status });
    load();
  };

  return (
    <div>

      {/* FILTER */}
      <div className="field-group" style={{ maxWidth: 220, marginBottom: 16 }}>
        <label>Filter by role</label>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* BULK ACTION BAR */}
      {selected.length > 0 && (
        <div className="card-surface" style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <strong>{selected.length} selected</strong>

          <button className="btn-primary" disabled={busy} onClick={makeAdmin}>
            Make Admin
          </button>

          <button className="btn-secondary" disabled={busy} onClick={makeSeller}>
            Convert to Seller
          </button>

          <button className="btn-link" onClick={clearSelection}>
            Clear
          </button>
        </div>
      )}

      {/* USERS LIST */}
      {loading ? (
        <div className="empty-state">Loading users…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map((u) => (
            <div
              className="card-surface"
              key={u.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}
            >

              {/* SELECT CHECKBOX */}
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggleSelect(u.id)}
              />

              <div style={{ flex: 1 }}>
                <strong>{u.full_name}</strong>

                {u.is_admin && (
                  <span className="product-card-badge" style={{ marginLeft: 8 }}>
                    Admin
                  </span>
                )}

                <div className="product-card-meta">
                  {u.email} · {u.role} · KYC: {u.kyc_status}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`status-chip status-${u.status}`}>
                  {u.status}
                </span>

                {u.status !== 'suspended' ? (
                  <button
                    className="btn-secondary"
                    onClick={() => setStatus(u.id, 'suspended')}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    className="btn-secondary"
                    onClick={() => setStatus(u.id, 'active')}
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
