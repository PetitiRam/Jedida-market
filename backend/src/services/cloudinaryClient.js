// Real media upload via Cloudinary's unsigned/signed upload API (no SDK
// dependency — plain HTTPS multipart request keeps this consistent with
// the other service clients in this folder). Configure CLOUDINARY_CLOUD_NAME
// + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET to enable; without them the
// upload route returns a clear 501 instead of silently failing.

import crypto from 'crypto';

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function signParams(params) {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(sorted + process.env.CLOUDINARY_API_SECRET).digest('hex');
}

/**
 * @param {Buffer} fileBuffer
 * @param {string} filename
 * @param {'image'|'video'} resourceType
 */
export async function uploadToCloudinary(fileBuffer, filename, resourceType = 'image') {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured on this server.');
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'jedida-marketplace';
  const signature = signParams({ folder, timestamp });

  const form = new FormData();
  form.append('file', new Blob([fileBuffer]), filename);
  form.append('api_key', process.env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    thumbnailUrl: resourceType === 'video' ? data.secure_url.replace(/\.\w+$/, '.jpg') : data.secure_url,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
    durationSeconds: data.duration ? Math.round(data.duration) : null
  };
}
