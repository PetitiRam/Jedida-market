import express from 'express';
import { getMaintenanceMode } from '../services/LegalAndSystemService.js';
import { query } from '../config/db.js';

const router = express.Router();

router.get('/maintenance', async (req, res) => {
  const maintenance = await getMaintenanceMode();
  res.json({ maintenance });
});

router.get('/announcement', async (req, res) => {
  const result = await query('SELECT notification_settings FROM platform_settings WHERE id = 1');
  const settings = result.rows[0]?.notification_settings || {};
  res.json({
    announcementBanner: settings.announcementBanner || '',
    maintenanceNotice: settings.maintenanceNotice || ''
  });
});

router.get('/legal/:docType', async (req, res) => {
  const { getLegalDocument } = await import('../services/LegalAndSystemService.js');
  try {
    const doc = await getLegalDocument(req.params.docType);
    res.json({ document: doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
