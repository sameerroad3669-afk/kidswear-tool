// api/analytics.js - Analytics event tracking
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { event, data, sessionId, timestamp } = req.body || {};

    // Log for Vercel function logs (view in Vercel dashboard)
    console.log(JSON.stringify({
      type: 'analytics',
      event,
      data,
      sessionId,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer']
    }));

    return res.status(200).json({ success: true });
  }

  return res.status(200).json({ status: 'analytics endpoint active' });
};
