"use strict";
var http = require('http');
var proxy = require('simple-http-proxy');
var extend = require('extend');

exports = module.exports = function (endpoint, dopts) {
  var opts = extend({
    timeout: 30*1000,
    onresponse: function (response, res) {
      if (response.statusCode >= 400) {
        res.statusCode = response.statusCode;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          error: 'invalid_request',
          error_description: http.STATUS_CODES[response.statusCode] || 'Unknown resource server error.'
        }));
        return true;
      }
    }}, dopts || {});
  return function (req, res, next) {
    if (req.apiPass === true) {
      proxy(endpoint, opts)(req, res, next);
    } else if (req.apiPass === false) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        error: 'invalid_request',
        error_description: http.STATUS_CODES[403] || 'Unknown resource server error.'
      }));
    } else {
      next();
    }
  };
};
