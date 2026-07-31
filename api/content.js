'use strict';

const lib = require('./_lib.js');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!lib.storeReady()) {
        return lib.json(res, 200, { value: null, storage: false });
      }
      const value = await lib.readContent();
      return lib.json(res, 200, { value: value, storage: true });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      if (!lib.isEditor(req)) {
        return lib.json(res, 401, { error: 'You are not signed in as an editor.' });
      }
      if (!lib.storeReady()) {
        return lib.json(res, 503, {
          error: 'No content store is connected. Add a KV store in the Vercel dashboard.'
        });
      }
      const body = await lib.readJsonBody(req);
      if (typeof body.value !== 'string' || !body.value) {
        return lib.json(res, 400, { error: 'A content payload is required.' });
      }
      if (body.value.length > 4 * 1024 * 1024) {
        return lib.json(res, 413, { error: 'That content is too large to store.' });
      }
      try {
        JSON.parse(body.value);
      } catch (e) {
        return lib.json(res, 400, { error: 'The content payload was not valid JSON.' });
      }
      await lib.writeContent(body.value);
      return lib.json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return lib.json(res, 405, { error: 'Method not allowed.' });
  } catch (err) {
    return lib.json(res, 500, { error: 'Server error: ' + err.message });
  }
};
