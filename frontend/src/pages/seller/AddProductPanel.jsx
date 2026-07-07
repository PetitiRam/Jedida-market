import { useEffect, useState } from 'react';
import client from '../../api/client';
import { CATEGORIES, CONDITIONS } from '../../constants/categories';
import MediaUploader from '../../components/MediaUploader';
import { compressImage } from '../../utils/compressImage';

const emptyForm = {
  title: '',
  description: '',
  category: 'other',
  condition: 'new',
  price: '',
  currency: 'USD',
  quantityAvailable: 1,
  sku: '',
  media: [],
  images: '',
  locationCity: '',
  locationCountry: ''
};

export default function AddProductPanel() {
  const [form, setForm] = useState(emptyForm);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadTemplates = async () => {
    const { data } = await client.get('/templates/mine');
    setTemplates(data.templates || []);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const update = (key) => (e) =>
    setForm({ ...form, [key]: e.target.value });

  const removeMedia = (index) => {
    setForm((f) => ({
      ...f,
      media: f.media.filter((_, i) => i !== index)
    }));
  };

  const applyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const t = templates.find((tpl) => tpl.id === templateId);
    if (!t) return;

    setForm((f) => ({
      ...f,
      category: t.category,
      description:
        t.description_template
          ?.replace('{product_name}', f.title || '')
          .replace('{short_pitch}', '') || f.description,
      images: (t.suggested_image_urls || []).join(', ')
    }));
  };

  const generateTemplate = async () => {
    setGenerating(true);
    setError('');
    try {
      await client.post('/templates/generate', {
        category: form.category,
        productHint: form.title
      });
      await loadTemplates();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate a template right now.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantityAvailable: Number(form.quantityAvailable),
        images: form.images
          ? form.images.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        templateId: selectedTemplateId || null
      };

      const { data } = await client.post('/products', payload);
      setResult(data);
      setForm(emptyForm);
      setSelectedTemplateId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your listing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-surface">
      <h3>List a new product</h3>

      <p style={{ color: '#5B6760' }}>
        Reuse a template, or let <strong>Colline</strong> generate one.
        Every listing is polished by <strong>Nsubuga Joseph</strong>.
      </p>

      {templates.length > 0 && (
        <div className="field-group">
          <label>Reuse a template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">— Start from scratch —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        className="btn-secondary"
        onClick={generateTemplate}
        disabled={generating}
        style={{ marginBottom: 20 }}
      >
        {generating ? 'Colline is generating…' : '✨ Generate a template'}
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className="alert alert-success">
          {result.message}
          {result.product?.ai_polish_notes && (
            <div style={{ marginTop: 6 }}>
              <em>Nsubuga Joseph's note:</em> {result.product.ai_polish_notes}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="field-group">
          <label>Title</label>
          <input
            value={form.title}
            onChange={update('title')}
            required
          />
        </div>

        {/* Description */}
        <div className="field-group">
          <label>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={update('description')}
          />
        </div>

        {/* Category + Condition */}
        <div className="field-row">
          <div className="field-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={update('category')}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Condition</label>
            <select
              value={form.condition}
              onChange={update('condition')}
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div className="field-row">
          <div className="field-group">
            <label>Price</label>
            <input
              type="number"
              value={form.price}
              onChange={update('price')}
              required
            />
          </div>

          <div className="field-group">
            <label>Currency</label>
            <select
              value={form.currency}
              onChange={update('currency')}
            >
              <option value="USD">USD</option>
              <option value="UGX">UGX</option>
              <option value="KES">KES</option>
              <option value="NGN">NGN</option>
            </select>
          </div>

          <div className="field-group">
            <label>Quantity</label>
            <input
              type="number"
              value={form.quantityAvailable}
              onChange={update('quantityAvailable')}
              required
            />
          </div>
        </div>

        {/* Media Upload */}
        <div className="field-group">
          <label>Image URLs</label>
          <input
            value={form.images}
            onChange={update('images')}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <MediaUploader
              label="Upload Image"
              accept="image/*"
              onUploaded={(media) =>
                setForm((f) => ({
                  ...f,
                  media: [...f.media, { type: 'image', url: media.url }]
                }))
              }
            />

            <MediaUploader
              label="Upload Video"
              accept="video/*"
              onUploaded={(media) =>
                setForm((f) => ({
                  ...f,
                  media: [...f.media, { type: 'video', url: media.url }]
                }))
              }
            />
          </div>

          {/* Preview */}
          <div style={{ marginTop: 12 }}>
            <label>Product Media</label>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 10
              }}
            >
              {form.media.map((item, index) => (
                <div
                  key={index}
                  style={{
                    width: 140,
                    border: index === 0 ? '2px solid green' : '1px solid #ddd',
                    borderRadius: 8,
                    padding: 6
                  }}
                >
                  {index === 0 && (
                    <div style={{ fontSize: 10, color: 'green' }}>
                      ⭐ COVER
                    </div>
                  )}

                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      style={{
                        width: '100%',
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 6
                      }}
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      style={{ width: '100%', borderRadius: 6 }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    style={{
                      marginTop: 6,
                      width: '100%',
                      padding: 6,
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="field-row">
          <div className="field-group">
            <label>City</label>
            <input
              value={form.locationCity}
              onChange={update('locationCity')}
            />
          </div>

          <div className="field-group">
            <label>Country</label>
            <input
              value={form.locationCountry}
              onChange={update('locationCountry')}
            />
          </div>
        </div>

        <button className="btn-primary" disabled={busy}>
          {busy ? 'Submitting…' : 'List product'}
        </button>
      </form>
    </div>
  );
}
