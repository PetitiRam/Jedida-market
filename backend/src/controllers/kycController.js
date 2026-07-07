import { query } from '../config/db.js';

// Called from the Seller/Delivery dashboard, not during upgrade registration.
// A seller/delivery user can sell/receive orders immediately after approval,
// but must submit + get KYC approved before they're allowed to withdraw.
export async function submitKyc(req, res) {
  const { idDocumentUrl, selfieUrl, documentType } = req.body;
  if (!idDocumentUrl) {
    return res.status(400).json({ error: 'An ID document is required.' });
  }

  try {
    const existing = await query(
      `SELECT id FROM kyc_submissions WHERE user_id = $1 AND status = 'pending'`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have a KYC submission awaiting review.' });
    }

    const result = await query(
      `INSERT INTO kyc_submissions (user_id, id_document_url, selfie_url, document_type)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, idDocumentUrl, selfieUrl || null, documentType || null]
    );
    await query(`UPDATE users SET kyc_status = 'pending' WHERE id = $1`, [req.user.id]);

    return res.status(201).json({ message: 'KYC submitted. An admin will review it shortly.', submission: result.rows[0] });
  } catch (err) {
    console.error('Submit KYC error:', err);
    return res.status(500).json({ error: 'Could not submit KYC. Please try again.' });
  }
}

export async function myKycStatus(req, res) {
  try {
    const userResult = await query('SELECT kyc_status FROM users WHERE id = $1', [req.user.id]);
    const submissions = await query(
      'SELECT * FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );
    return res.json({ kycStatus: userResult.rows[0]?.kyc_status, submissions: submissions.rows });
  } catch (err) {
    console.error('My KYC status error:', err);
    return res.status(500).json({ error: 'Could not load KYC status.' });
  }
}
