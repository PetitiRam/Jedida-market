import { useEffect, useState } from 'react';
import * as api from '../settingsCenterApi';
import { SectionCard, SaveFeedback, useSaveState } from '../settingsCenterUI';

const DOC_TABS = [
  { key: 'terms', label: 'Terms & Conditions' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'refund', label: 'Refund Policy' },
  { key: 'seller_agreement', label: 'Seller Agreement' },
  { key: 'delivery_agreement', label: 'Delivery Agreement' },
  { key: 'community_guidelines', label: 'Community Guidelines' }
];

export default function LegalSettingsTab() {
  const [activeDoc, setActiveDoc] = useState('terms');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const { saving, message, run } = useSaveState();

  const load = async (docType) => {
    setLoading(true);
    const { data } = await api.getLegalDocument(docType);
    setContent(data.document.content_md || '');
    setVersion(data.document.version || 0);
    setLoading(false);
  };
  useEffect(() => { load(activeDoc); }, [activeDoc]);

  const save = async (e) => {
    e.preventDefault();
    const result = await run(() => api.updateLegalDocument(activeDoc, content));
    if (result) setVersion(result.data.document.version);
  };

  return (
    <div>
      <SaveFeedback message={message} />
      <SectionCard title="Legal Documents" description="Every save creates a new version — full history is preserved.">
        <div className="tab-scroll" style={{ marginBottom: 16 }}>
          {DOC_TABS.map((t) => (
            <button key={t.key} className={`tab-pill ${activeDoc === t.key ? 'tab-pill-active' : ''}`} onClick={() => setActiveDoc(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">Loading document…</div>
        ) : (
          <form onSubmit={save}>
            <p className="product-card-meta" style={{ marginBottom: 8 }}>Current version: v{version}</p>
            <textarea
              rows={16} value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Write in Markdown — headings, lists, and paragraphs are all supported."
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <button className="btn-primary" disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Publishing…' : `Publish as v${version + 1}`}
            </button>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
