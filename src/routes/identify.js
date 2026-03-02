const express = require('express');
const { normalizeInput } = require('../utils/normalize');
const identityService = require('../services/identityService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, phoneNumber } = normalizeInput(req.body);

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Either email or phoneNumber must be provided.' });
    }

    const result = await identityService.reconcile({ email, phoneNumber });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /identify:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
