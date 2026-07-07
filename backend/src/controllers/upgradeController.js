import { query } from '../config/db.js';

const PAYMENT_AMOUNT = 1000;
const PAYMENT_CURRENCY = 'UGX';
const PAYMENT_NUMBER = '0755903781';

const REQUIRED_APPLICATION_FIELDS = {
  seller: ['businessName'],
  delivery: []
};

function assertValidRole(role) {
  return ['seller', 'delivery'].includes(role);
}

// ============================================================
// STEP 1 — Upgrade request. Auto-attaches full_name/email/phone_number
// from the authenticated account. Creates the request in pending_payment.
// ============================================================
export async function requestUpgrade(req, res) {
  const { requestedRole, applicationData } = req.body;
  const userId = req.user.id;

  if (!assertValidRole(requestedRole)) {
    return res.status(400).json({ error: 'Requested role must be seller or delivery.' });
  }

  const data = applicationData || {};
  const required = REQUIRED_APPLICATION_FIELDS[requestedRole];
  const missing = required.filter((f) => !data[f] || !String(data[f]).trim());
  if (missing.length > 0) {
    return res.status(400).json({ error: `Please provide: ${missing.join(', ')}.` });
  }

  try {
    const userResult = await query(
      'SELECT full_name, email, phone_number FROM users WHERE id = $1',
      [userId]
    );
    const account = userResult.rows[0];

    const existing = await query(
      `SELECT id, status FROM role_upgrades
       WHERE user_id = $1 AND requested_role = $2
       AND status NOT IN ('approved','rejected','payment_rejected','kyc_rejected')`,
      [userId, requestedRole]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have an active upgrade request in progress.', upgrade: existing.rows[0] });
    }

    const result = await query(
      `INSERT INTO role_upgrades (user_id, requested_role, status, payment_amount, application_data, applicant_snapshot)
       VALUES ($1, $2, 'pending_payment', $3, $4, $5) RETURNING *`,
      [userId, requestedRole, PAYMENT_AMOUNT, data, account]
    );

    return res.status(201).json({
      message: `Request created. Send ${PAYMENT_AMOUNT} ${PAYMENT_CURRENCY} to ${PAYMENT_NUMBER} to continue.`,
      paymentNumber: PAYMENT_NUMBER,
      paymentAmount: PAYMENT_AMOUNT,
      paymentCurrency: PAYMENT_CURRENCY,
      upgrade: result.rows[0]
    });
  } catch (err) {
    console.error('Request upgrade error:', err);
    return res.status(500).json({ error: 'Could not create upgrade request.' });
  }
}

// ============================================================
// STEP 2 — Payment submission. Requires status === pending_payment.
// Cannot be skipped or reordered.
// ============================================================
export async function submitPayment(req, res) {
  const { upgradeId, paymentReference, proofOfPaymentUrl } = req.body;
  const userId = req.user.id;

  if (!paymentReference) {
    return res.status(400).json({ error: 'Payment reference is required.' });
  }

  try {
    const result = await query(
      `UPDATE role_upgrades
       SET status = 'payment_submitted', payment_reference = $1, proof_of_payment_url = $2
       WHERE id = $3 AND user_id = $4 AND status = 'pending_payment'
       RETURNING *`,
      [paymentReference, proofOfPaymentUrl || null, upgradeId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No upgrade request awaiting payment was found for your account.' });
    }

    return res.json({
      message: 'Payment submitted. An admin will verify it shortly — you can message the admin team in the meantime.',
      upgrade: result.rows[0]
    });
  } catch (err) {
    console.error('Submit payment error:', err);
    return res.status(500).json({ error: 'Could not submit payment.' });
  }
}

// ============================================================
// STEP 3 — KYC submission. Requires status === payment_verified.
// Cannot happen before payment is verified by an admin.
// ============================================================
export async function submitKyc(req, res) {
  const { upgradeId, nationalIdFrontUrl, nationalIdBackUrl, selfieUrl } = req.body;
  const userId = req.user.id;

  if (!nationalIdFrontUrl || !nationalIdBackUrl) {
    return res.status(400).json({ error: 'Both sides of your national ID are required.' });
  }

  try {
    const upgradeResult = await query(
      `SELECT * FROM role_upgrades WHERE id = $1 AND user_id = $2`,
      [upgradeId, userId]
    );
    const upgrade = upgradeResult.rows[0];
    if (!upgrade) return res.status(404).json({ error: 'Upgrade request not found.' });
    if (upgrade.status !== 'payment_verified') {
      return res.status(400).json({ error: 'KYC can only be submitted after your payment has been verified.' });
    }

    const docResult = await query(
      `INSERT INTO kyc_documents (user_id, upgrade_id, national_id_front_url, national_id_back_url, selfie_url)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, upgradeId, nationalIdFrontUrl, nationalIdBackUrl, selfieUrl || null]
    );
    await query(`UPDATE role_upgrades SET status = 'kyc_pending' WHERE id = $1`, [upgradeId]);

    return res.status(201).json({
      message: 'KYC documents submitted. An admin will review them shortly.',
      document: docResult.rows[0]
    });
  } catch (err) {
    console.error('Submit KYC error:', err);
    return res.status(500).json({ error: 'Could not submit KYC documents.' });
  }
}

export async function myUpgradeStatus(req, res) {
  try {
    const upgrades = await query(
      `SELECT * FROM role_upgrades WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    const kycDocs = await query(
      `SELECT * FROM kyc_documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({
      upgrades: upgrades.rows,
      kycDocuments: kycDocs.rows,
      paymentInstructions: { number: PAYMENT_NUMBER, amount: PAYMENT_AMOUNT, currency: PAYMENT_CURRENCY }
    });
  } catch (err) {
    console.error('My upgrade status error:', err);
    return res.status(500).json({ error: 'Could not load upgrade status.' });
  }
}

// ============================================================
// ADMIN — single endpoint driving every stage transition. Enforces the
// state machine: each action is only valid from its required prior status.
// ============================================================
const VALID_TRANSITIONS = {
  verify_payment: { from: 'payment_submitted', to: 'payment_verified' },
  reject_payment: { from: 'payment_submitted', to: 'payment_rejected' },
  verify_kyc:     { from: 'kyc_pending', to: 'kyc_verified' },
  reject_kyc:     { from: 'kyc_pending', to: 'kyc_rejected' },
  approve:        { from: 'kyc_verified', to: 'approved' },
  reject:         { from: null, to: 'rejected' } // admin can reject from any non-terminal state
};

export async function listUpgrades(req, res) {
  const { status } = req.query;
  const where = status ? 'WHERE ru.status = $1' : '';
  const values = status ? [status] : [];
  const result = await query(
    `SELECT ru.*, u.full_name, u.email, u.username,
            kd.id AS kyc_document_id, kd.national_id_front_url, kd.national_id_back_url, kd.selfie_url, kd.status AS kyc_status
     FROM role_upgrades ru
     JOIN users u ON u.id = ru.user_id
     LEFT JOIN kyc_documents kd ON kd.upgrade_id = ru.id
     ${where}
     ORDER BY ru.created_at DESC`,
    values
  );
  res.json({ upgrades: result.rows });
}

export async function reviewUpgrade(req, res) {
  const { id } = req.params;
  const { action, notes } = req.body;

  const transition = VALID_TRANSITIONS[action];
  if (!transition) {
    return res.status(400).json({ error: 'Invalid action. Use verify_payment, reject_payment, verify_kyc, reject_kyc, approve, or reject.' });
  }

  try {
    const upgradeResult = await query('SELECT * FROM role_upgrades WHERE id = $1', [id]);
    const upgrade = upgradeResult.rows[0];
    if (!upgrade) return res.status(404).json({ error: 'Upgrade request not found.' });

    if (transition.from && upgrade.status !== transition.from) {
      return res.status(400).json({
        error: `This action requires status "${transition.from}", but the request is currently "${upgrade.status}". Steps cannot be skipped or reordered.`
      });
    }
    if (action === 'reject' && ['approved', 'rejected'].includes(upgrade.status)) {
      return res.status(400).json({ error: 'This request has already reached a final state.' });
    }

    await query(
      `UPDATE role_upgrades SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3`,
      [transition.to, req.user.id, id]
    );

    if (action === 'verify_kyc' || action === 'reject_kyc') {
      await query(
        `UPDATE kyc_documents SET status = $1, reviewed_by = $2, reviewed_at = now(), reviewer_notes = $3 WHERE upgrade_id = $4`,
        [action === 'verify_kyc' ? 'verified' : 'rejected', req.user.id, notes || null, id]
      );
    }

    // ONLY the final "approve" action grants the role — this is the single
    // point where primary_role changes, so a user cannot reach the seller/
    // delivery dashboard by any path that skips payment or KYC verification.
    if (action === 'approve') {
      await query(`UPDATE users SET primary_role = $1 WHERE id = $2`, [upgrade.requested_role, upgrade.user_id]);
    }

    const notificationCopy = {
      verify_payment: { title: 'Payment verified', body: 'Your payment was verified. Please submit your KYC documents to continue.' },
      reject_payment: { title: 'Payment rejected', body: notes || 'Your payment could not be verified. Please contact the admin team via chat.' },
      verify_kyc:     { title: 'KYC verified', body: 'Your identity documents were verified. Your application is awaiting final approval.' },
      reject_kyc:     { title: 'KYC rejected', body: notes || 'Your identity documents were rejected. Please contact the admin team via chat.' },
      approve:        { title: `You're approved as a ${upgrade.requested_role}!`, body: `Welcome aboard — you can now access your ${upgrade.requested_role} dashboard.` 
},
      reject:          { title: 'Application rejected', body: notes || 'Your upgrade application was rejected. Please contact the admin team via chat.' }
    }[action];

    await query(
      `INSERT INTO notifications (user_id, type, title, body, sent_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        upgrade.user_id,
        action === 'approve' ? 'shop_approved' : action.includes('reject') ? 'shop_rejected' : 'system_announcement',
        notificationCopy.title, notificationCopy.body, req.user.id,
        { requestedRole: upgrade.requested_role, upgradeId: id, action }
      ]
    );

    return res.json({ message: `Upgrade request updated: ${transition.to}.` });
  } catch (err) {
    console.error('Review upgrade error:', err);
    return res.status(500).json({ error: 'Could not process this request.' });
  }
}
export async function listPendingUpgrades(req, res) {
  try {
    const result = await query(
      `SELECT ru.*, u.full_name, u.email, u.username
       FROM role_upgrades ru
       JOIN users u ON u.id = ru.user_id
       WHERE ru.status IN ('pending_payment', 'payment_submitted', 'kyc_pending')
       ORDER BY ru.created_at DESC`
    );

    return res.json({ upgrades: result.rows });
  } catch (err) {
    console.error('List pending upgrades error:', err);
    return res.status(500).json({ error: 'Could not load pending upgrades' });
  }
}
