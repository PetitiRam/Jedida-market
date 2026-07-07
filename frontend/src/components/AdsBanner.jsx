import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdsBanner() {
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    client.get('/ads').then(({ data }) => setAds(data.ads || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 6000);
    return () => clearInterval(t);
  }, [ads]);

  if (ads.length === 0) return null;
  const ad = ads[index];

  return (
    <div style={{ marginBottom: 24 }}>
      <a href={ad.link_url || '#'} target={ad.link_url ? '_blank' : undefined} rel="noreferrer">
        <div style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden', height: 180,
          background: `linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05)), url(${ad.image_url}) center/cover`,
          display: 'flex', alignItems: 'flex-end', padding: 20
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            {ad.title}
          </span>
        </div>
      </a>
      {ads.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 8, height: 8, borderRadius: 999, border: 'none', padding: 0,
                background: i === index ? 'var(--forest)' : 'var(--line)', cursor: 'pointer'
              }}
              aria-label={`Show ad ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
