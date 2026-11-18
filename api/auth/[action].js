"use strict";

// Vercel file-based route for /api/auth/:action.
// Keep the shared handler used by the local Express server.
module.exports = async function(req, res) {
  req.params = req.params || {};
  req.params.action = String(req.query?.action || req.params.action || "");
  return require("../auth")(req, res);
};
