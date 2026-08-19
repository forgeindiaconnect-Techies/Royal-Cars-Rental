// Vercel Serverless Function Proxy: /api/* -> https://royal-cars-rental.onrender.com/api/*
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const backendBase = 'https://royal-cars-rental.onrender.com';
    const targetUrl = `${backendBase}${req.url}`;

    const headers = {};
    if (req.headers.authorization) headers['authorization'] = req.headers.authorization;
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    if (req.headers['accept']) headers['accept'] = req.headers['accept'];

    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('[Vercel Proxy Error]', error);
    return res.status(500).json({ success: false, message: 'Proxy error connecting to Render backend' });
  }
}
