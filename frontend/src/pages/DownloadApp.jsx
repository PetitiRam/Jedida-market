import Logo from '../components/Logo';

// Point this at wherever you host the built APK (e.g. an S3/Cloudinary URL,
// or a file committed to /public and deployed alongside the frontend — see
// README for the exact `eas build` -> download-link workflow). Using a
// direct web download instead of the Play Store while the app is pre-launch
// avoids Play Console review turnaround during active development.
const APK_DOWNLOAD_URL = import.meta.env.VITE_APK_DOWNLOAD_URL || '/downloads/jedida-marketplace.apk';
const APK_VERSION = import.meta.env.VITE_APK_VERSION || '1.0.0';

export default function DownloadApp() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <header style={{ display: 'flex', justifyContent: 'center', padding: '24px 48px' }}>
        <Logo size={36} />
      </header>

      <section style={{ textAlign: 'center', padding: '40px 24px 80px', maxWidth: 560, margin: '0 auto' }}>
        <div className="eyebrow" style={{ display: 'flex', justifyContent: 'center' }}>Mobile app</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Get JEDIDA on your phone</h1>
        <p style={{ color: '#5B6760', margin: '16px 0 32px' }}>
          Download the Android app directly — no Play Store needed yet. iOS support
          is coming via TestFlight; join the waitlist below.
        </p>

        <a href={APK_DOWNLOAD_URL} download>
          <button className="btn-primary" style={{ width: 'auto', padding: '16px 36px', fontSize: '1.05rem' }}>
            ⬇ Download for Android (v{APK_VERSION})
          </button>
        </a>

        <div className="weave-divider" style={{ maxWidth: 200, margin: '32px auto' }} />

        <div style={{ textAlign: 'left', background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Installing on Android</h3>
          <ol style={{ paddingLeft: 20, color: '#5B6760', lineHeight: 1.8, fontSize: '0.92rem' }}>
            <li>Tap the download button above — the APK saves to your Downloads folder</li>
            <li>Open the downloaded file</li>
            <li>If prompted "Install blocked", tap Settings → allow installs from this source</li>
            <li>Tap Install, then open JEDIDA Marketplace</li>
          </ol>
          <p style={{ marginTop: 14, fontSize: '0.8rem', color: '#8A9189' }}>
            This is a direct install outside the Play Store, so Android shows a warning by
            default — this is expected for apps not yet published there, and safe to proceed
            with since you're downloading directly from jedidamarketplace's own site.
          </p>
        </div>

        <p style={{ marginTop: 24, fontSize: '0.85rem', color: '#8A9189' }}>
          iPhone user? <a href="mailto:hello@jedidamarketplace.com" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Email us</a> to join the TestFlight beta.
        </p>
      </section>
    </div>
  );
}
