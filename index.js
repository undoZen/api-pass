"use strict";
var http = require('http');
var proxy = require('simple-http-proxy');
var extend = require('extend');
var concat = require('concat-stream');

// set maxSockets to Infinity since simple-http-proxy don't provide a way to set agent
http.globalAgent.maxSockets = Infinity;
require('https').globalAgent.maxSockets = Infinity;

exports = module.exports = function (endpoint, dopts) {
  dopts = dopts || {};
  var onresponse = dopts.onresponse;
  delete dopts.onresponse;
  var opts = extend({
    timeout: 30*1000,
    onresponse: function (response, res) {
      if ('function' == typeof onresponse && onresponse(response, res)) return true;
      if (response.statusCode >= 400) {
        res.statusCode = response.statusCode;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        var err = {
          error: 'invalid_request',
          error_description: http.STATUS_CODES[response.statusCode] || 'Unknown resource server error.'
        };
        if ((response.headers['content-type']||'').split(';')[0].trim() == 'application/json') {
          response.pipe(concat(function (data) {
            var result = {};
            try {
              result = JSON.parse(data.toString('utf-8'));
            } catch (e) {}
            extend(err, result);
            res.end(JSON.stringify(err));
          }));
        } else {
          res.end(JSON.stringify(err));
        }
        return true;
      } else if (dopts.utf8 !== false && (response.headers['content-type']||'').match(/^application\/json$/i)) {
        response.headers['content-type'] += '; charset=utf-8';
      }
    }
  }, dopts);
  return function (req, res, next) {
    req.apiPass = req.apiPass === true || req.apiPass === false ? req.apiPass : req.authPass;
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
