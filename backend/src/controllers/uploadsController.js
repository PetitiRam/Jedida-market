import { query } from '../config/db.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinaryClient.js';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;   // 8MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50MB
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/quicktime', 'video/webm'];

export async function uploadMedia(req, res) {
  if (!isCloudinaryConfigured()) {
    return res.status(501).json({
      error: 'Media upload is not configured on this server yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or continue pasting image/video URLs directly.'
    });
  }

  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file was uploaded.' });

  const isVideo = ALLOWED_VIDEO_MIME.includes(file.mimetype);
  const isImage = ALLOWED_IMAGE_MIME.includes(file.mimetype);

  if (!isVideo && !isImage) {
    return res.status(400).json({ error: 'Unsupported file type. Upload a JPEG/PNG/WEBP/GIF image or an MP4/MOV/WEBM video.' });
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return res.status(400).json({ error: `File too large. Max size is ${Math.round(maxBytes / (1024 * 1024))}MB.` });
  }

  try {
    const resourceType = isVideo ? 'video' : 'image';
    const result = await uploadToCloudinary(file.buffer, file.originalname, resourceType);

    const dbResult = await query(
      `INSERT INTO media_uploads (uploaded_by, media_type, url, thumbnail_url, provider, bytes, width, height, duration_seconds)
       VALUES ($1,$2,$3,$4,'cloudinary',$5,$6,$7,$8) RETURNING *`,
      [req.user.id, isVideo ? 'video' : 'image', result.url, result.thumbnailUrl, result.bytes, result.width, result.height, result.durationSeconds]
    );

    return res.status(201).json({ message: 'Upload successful.', media: dbResult.rows[0] });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(502).json({ error: 'Could not upload file. Please try again.' });
  }
}

export async function myUploads(req, res) {
  const result = await query('SELECT * FROM media_uploads WHERE uploaded_by = $1 ORDER BY created_at DESC LIMIT 100', [req.user.id]);
  res.json({ uploads: result.rows });
}
