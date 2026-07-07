// Two real, independent Google integrations, both no-op/throwing safely
// when their env vars aren't set:
//  1. Google OAuth "Sign in with Google" — verifies an ID token from the
//     frontend's Google Sign-In button against Google's public keys.
//  2. Google Custom Search (Images) — gives Colline a real image-sourcing
//     backend instead of the placeholder Unsplash URLs.

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

export function isGoogleSearchConfigured() {
  return Boolean(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID);
}

/**
 * Verifies a Google Sign-In ID token (sent from the frontend after a user
 * signs in with Google) and returns the verified profile, or throws.
 * Uses Google's tokeninfo endpoint — no extra SDK dependency required.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!isGoogleAuthConfigured()) {
    throw new Error('GOOGLE_CLIENT_ID is not configured.');
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new Error('Invalid Google ID token.');

  const payload = await res.json();

  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google token was not issued for this application.');
  }
  if (!payload.email_verified || payload.email_verified === 'false') {
    throw new Error('Google account email is not verified.');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    fullName: payload.name,
    avatarUrl: payload.picture
  };
}

/**
 * Real image search for Colline's template generator. Falls back to the
 * caller's own placeholder logic when not configured (see collineBot.js).
 * @returns {Promise<string[]>} up to `count` image URLs
 */
export async function searchProductImages(query, count = 4) {
  if (!isGoogleSearchConfigured()) {
    throw new Error('GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_ENGINE_ID not configured.');
  }

  const params = new URLSearchParams({
    key: process.env.GOOGLE_SEARCH_API_KEY,
    cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
    q: query,
    searchType: 'image',
    num: String(Math.min(count, 10)),
    safe: 'active'
  });

  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Custom Search error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.items || []).map((item) => item.link);
}
