'use strict';

const lib = require('./_lib.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return lib.json(res, 405, { error: 'Method not allowed.' });
  }
  const expected = process.env.EDITOR_PASSWORD;
  if (!expected) {
    return lib.json(res, 503, {
      error: 'No editor password is configured. Set EDITOR_PASSWORD in the Vercel dashboard.'
    });
  }
  const body = await lib.readJsonBody(req);
  const supplied = typeof body.password === 'string' ? body.password.trim() : '';
  if (!supplied || supplied !== expected) {
    return lib.json(res, 401, { error: 'That password was not recognised.' });
  }
  lib.setSessionCookie(res, lib.signSession());
  return lib.json(res, 200, { ok: true, editor: true });
};
