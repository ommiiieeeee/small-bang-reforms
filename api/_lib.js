'use strict';

const crypto = require('node:crypto');

const CONTENT_KEY = 'sbr:content';
const COOKIE_NAME = 'sbr_session';

function storeConfig() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_REST_TOKEN;
  return { url: url ? url.replace(/\/+$/, '') : null, token: token || null };
}

function storeReady() {
  const { url, token } = storeConfig();
  return Boolean(url && token);
}

async function readContent() {
  const { url, token } = storeConfig();
  if (!url || !token) return null;
  const res = await fetch(url + '/get/' + encodeURIComponent(CONTENT_KEY), {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Storage read failed with status ' + res.status);
  const body = await res.json();
  return body && typeof body.result === 'string' ? body.result : null;
}

async function writeContent(value) {
  const { url, token } = storeConfig();
  if (!url || !token) throw new Error('Storage is not configured');
  const res = await fetch(url + '/set/' + encodeURIComponent(CONTENT_KEY), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'text/plain'
    },
    body: value
  });
  if (!res.ok) throw new Error('Storage write failed with status ' + res.status);
  return true;
}

function sessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.EDITOR_PASSWORD ||
    'small-bang-reforms-fallback-secret'
  );
}

function signSession() {
  const issued = String(Date.now());
  const mac = crypto
    .createHmac('sha256', sessionSecret())
    .update('editor.' + issued)
    .digest('hex');
  return issued + '.' + mac;
}

function verifySession(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [issued, mac] = parts;
  if (!/^\d+$/.test(issued)) return false;
  const maxAgeMs = 1000 * 60 * 60 * 12;
  if (Date.now() - Number(issued) > maxAgeMs) return false;
  const expected = crypto
    .createHmac('sha256', sessionSecret())
    .update('editor.' + issued)
    .digest('hex');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function readCookie(req, name) {
  const raw = req.headers && req.headers.cookie;
  if (!raw) return null;
  const found = raw
    .split(';')
    .map(part => part.trim())
    .find(part => part.indexOf(name + '=') === 0);
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}

function isEditor(req) {
  return verifySession(readCookie(req, COOKIE_NAME));
}

function setSessionCookie(res, token) {
  const attrs = [
    COOKIE_NAME + '=' + encodeURIComponent(token),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + 60 * 60 * 12,
    'Secure'
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearSessionCookie(res) {
  const attrs = [
    COOKIE_NAME + '=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Secure'
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (e) {
    return {};
  }
}

module.exports = {
  CONTENT_KEY,
  COOKIE_NAME,
  storeReady,
  readContent,
  writeContent,
  signSession,
  isEditor,
  setSessionCookie,
  clearSessionCookie,
  json,
  readJsonBody
};
