'use strict';

const lib = require('./_lib.js');

module.exports = async function handler(req, res) {
  return lib.json(res, 200, {
    editor: lib.isEditor(req),
    storage: lib.storeReady(),
    passwordConfigured: Boolean(process.env.EDITOR_PASSWORD)
  });
};
