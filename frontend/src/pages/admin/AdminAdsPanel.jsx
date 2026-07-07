import { useEffect, useState } from 'react';
import client from '../../api/client';
import MediaUploader from '../../components/MediaUploader';

export default function AdminAdsPanel() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '' });

  const load = async () => { const { data } = await client.get('/ads'); setAds(data.ads || []); };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await client.post('/admin/ads', form);
    setForm({ title: '', imageUrl: '', linkUrl: '' });
    load();
  };
  const remove = async (id) => { await client.delete(`/admin/ads/${id}`); load(); };

  return (
    <div>
      <div className="card-surface" style={{ marginBottom: 20 }}>
        <h4>Publish a new ad</h4>
        <p className="product-card-meta" style={{ marginBottom: 12 }}>
          Ads rotate in a banner at the top of the Main Marketplace and in every page header. Only admins can publish or remove ads.
        </p>
        <form onSubmit={create}>
          <div className="field-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>

          <div className="field-group">
            <label>Ad image</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Paste an image URL, or upload below" />
            <div style={{ marginTop: 8 }}>
              <MediaUploader label="🖼️ Upload ad image" accept="image/*" onUploaded={(m) => setForm((f) => ({ ...f, imageUrl: m.url }))} />
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Ad preview" style={{ marginTop: 10, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
            )}
          </div>

          <div className="field-group"><label>Link URL (optional)</label><input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="Where should clicking the ad go?" /></div>
          <button className="btn-primary" disabled={!form.imageUrl}>Publish ad</button>
        </form>
      </div>

      <h4>Active ads</h4>
      {ads.length === 0 ? <div className="empty-state">No ads published yet.</div> : ads.map((a) => (
        <div key={a.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {a.image_url && <img src={a.image_url} alt={a.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />}
            <span>{a.title}</span>
          </div>
          <button className="btn-link" onClick={() => remove(a.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
