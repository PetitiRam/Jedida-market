import { query } from '../config/db.js';

export async function myWallet(req, res) {
  try {
    const result = await query(`SELECT * FROM wallets WHERE owner_id = $1 AND type = 'user'`, [req.user.id]);
    return res.json({ wallet: result.rows[0] || null });
  } catch (err) {
    console.error('My wallet error:', err);
    return res.status(500).json({ error: 'Could not load wallet.' });
  }
}

export async function platformWallets(req, res) {
  try {
    const result = await query(`SELECT * FROM wallets WHERE type IN ('platform','escrow')`);
    return res.json({ wallets: result.rows });
  } catch (err) {
    console.error('Platform wallets error:', err);
    return res.status(500).json({ error: 'Could not load platform wallets.' });
  }
}

// Sellers/delivery partners can sell/deliver immediately after their role is
// approved, but withdrawing their earnings requires an approved KYC —
// enforced here, not just hinted at in the UI.
export async function requestWithdrawal(req, res) {
  const { amount, method, destination } = req.body;
  if (!amount || !method) {
    return res.status(400).json({ error: 'Amount and payout method are required.' });
  }
  if (!['stripe', 'flutterwave', 'dpo', 'coinbase', 'wallet'].includes(method)) {
    return res.status(400).json({ error: 'Unsupported payout method.' });
  }

  try {
    const userResult = await query('SELECT kyc_status, primary_role FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    if (user.primary_role === 'buyer') {
      return res.status(403).json({ error: 'Only sellers and delivery partners can withdraw funds.' });
    }
    if (user.kyc_status !== 'approved') {
      return res.status(403).json({
        error: 'Complete KYC verification before withdrawing funds.',
        kycStatus: user.kyc_status
      });
    }

    const walletResult = await query(`SELECT * FROM wallets WHERE owner_id = $1 AND type = 'user'`, [req.user.id]);
    const wallet = walletResult.rows[0];
    if (!wallet || Number(wallet.balance) < Number(amount)) {
      return res.status(400).json({ error: 'Insufficient wallet balance for this withdrawal.' });
    }

    const result = await query(
      `INSERT INTO withdrawal_requests (user_id, amount, currency, method, destination)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, amount, wallet.currency, method, destination || null]
    );

    // hold the funds immediately so they can't be double-withdrawn while pending
    await query(`UPDATE wallets SET balance = balance - $1 WHERE owner_id = $2 AND type = 'user'`, [amount, req.user.id]);

    return res.status(201).json({ message: 'Withdrawal request submitted for admin review.', withdrawal: result.rows[0] });
  } catch (err) {
    console.error('Request withdrawal error:', err);
    return res.status(500).json({ error: 'Could not submit withdrawal request.' });
  }
}

export async function myWithdrawals(req, res) {
  const result = await query('SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ withdrawals: result.rows });
}

// ===== Admin =====
export async function listWithdrawals(req, res) {
  const { status } = req.query;
  const where = status ? 'WHERE w.status = $1' : '';
  const values = status ? [status] : [];
  const result = await query(
    `SELECT w.*, u.full_name, u.email FROM withdrawal_requests w JOIN users u ON u.id = w.user_id
     ${where} ORDER BY w.created_at DESC LIMIT 200`,
    values
  );
  res.json({ withdrawals: result.rows });
}

export async function reviewWithdrawal(req, res) {
  const { id } = req.params;
  const { decision } = req.body; // 'approve' | 'reject'

  try {
    const wResult = await query('SELECT * FROM withdrawal_requests WHERE id = $1', [id]);
    const withdrawal = wResult.rows[0];
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found.' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'This request has already been reviewed.' });

    if (decision === 'approve') {
      await query(`UPDATE withdrawal_requests SET status = 'paid', reviewed_by = $1, reviewed_at = now() WHERE id = $2`, [req.user.id, id]);
      await query(
        `INSERT INTO notifications (user_id, type, title, body, sent_by) VALUES ($1,'payout_released','Withdrawal paid out',$2,$3)`,
        [withdrawal.user_id, `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been paid out.`, req.user.id]
      );
    } else {
      // refund the held balance back to the wallet
      await query(`UPDATE wallets SET balance = balance + $1 WHERE owner_id = $2 AND type = 'user'`, [withdrawal.amount, withdrawal.user_id]);
      await query(`UPDATE withdrawal_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = now() WHERE id = $2`, [req.user.id, id]);
      await query(
        `INSERT INTO notifications (user_id, type, title, body, sent_by) VALUES ($1,'system_announcement','Withdrawal declined',$2,$3)`,
        [withdrawal.user_id, `Your withdrawal request was declined and the funds were returned to your wallet.`, req.user.id]
      );
    }

    return res.json({ message: `Withdrawal ${decision === 'approve' ? 'paid out' : 'rejected'}.` });
  } catch (err) {
    console.error('Review withdrawal error:', err);
    return res.status(500).json({ error: 'Could not process withdrawal review.' });
  }
}
