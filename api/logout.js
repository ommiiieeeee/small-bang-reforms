'use strict';

const lib = require('./_lib.js');

module.exports = async function handler(req, res) {
  lib.clearSessionCookie(res);
  return lib.json(res, 200, { ok: true, editor: false });
};
