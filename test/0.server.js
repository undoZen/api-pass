'strict mode';
var http = require('http');
var express = require('express');
var apiPass = require('../');
var assert = require('assert');
var supertest = require('supertest');

describe('apiPass middleware', function () {
  var server, app, passport;
  before(function () {
    app = express();
    server = http.createServer(app);
    app.get('/test/hello', function (req, res, next) {
      res.end('hello');
    });
    app.get('/test/html', function (req, res, next) {
      res.statusCode = 404
      res.end('<p>Hello, World!</p>');
    });
    server.listen(4123);
  });
  after(function () {
    server.close();
  });

  it('should return a middleware', function () {
    assert.equal(3, apiPass('http://localhost:4123/test').length);
  });
  it('resource server should be working', function (done) {
    supertest(app).get('/test/hello')
      .expect(200)
      .end(function (err, r) {
        assert(!err);
        assert.equal('hello', r.text);
        testHtml()
      });
    function testHtml() {
    supertest(app).get('/test/html')
      .expect(404)
      .end(function (err, r) {
        assert(!err);
        assert(r.text.match(/<p>hello/i));
        done()
      });
    }
  });
  it('should proxy to resource server', function (done) {
    var app = express();
    app.get('/api/hello', function (req, res, next) {
      req.apiPass = true;
      next();
    });
    app.use('/api', apiPass('http://localhost:4123/test'));
    supertest(app).get('/api/hello')
      .expect(200)
      .end(function (err, r) {
        assert(!err);
        assert.equal('hello', r.text);
        done();
      });
  });
  it('should proxy to resource server with req.auth === true', function (done) {
    var app = express();
    app.get('/api/hello', function (req, res, next) {
      req.authPass = true;
      next();
    });
    app.use('/api', apiPass('http://localhost:4123/test'));
    supertest(app).get('/api/hello')
      .expect(200)
      .end(function (err, r) {
        assert(!err);
        assert.equal('hello', r.text);
        done();
      });
  });
  it('should return 403 if req.apiPass === false', function (done) {
    var app = express();
    app.get('/api/hello', function (req, res, next) {
      req.apiPass = false;
      next();
    });
    app.use('/api', apiPass('http://localhost:4123/test'));
    supertest(app).get('/api/hello')
      .expect(403)
      .end(function (err, r) {
        assert(!err);
        assert(r.error);
        assert.equal(403, r.error.status);
        assert.equal('Forbidden', r.body.error_description);
        done();
      });
  });
  it('should return 403 if req.authPass === false', function (done) {
    var app = express();
    app.get('/api/hello', function (req, res, next) {
      req.authPass = false;
      next();
    });
    app.use('/api', apiPass('http://localhost:4123/test'));
    supertest(app).get('/api/hello')
      .expect(403)
      .end(function (err, r) {
        assert(!err);
        assert(r.error);
        assert.equal(403, r.error.status);
        assert.equal('Forbidden', r.body.error_description);
        done();
      });
  });
  it('should return json object whenever resource server return status >= 400', function (done) {
    var app = express();
    app.get('/api/html', function (req, res, next) {
      req.apiPass = true;
      next();
    });
    app.use('/api', apiPass('http://localhost:4123/test'));
    supertest(app).get('/api/html')
      .expect(404)
      .end(function (err, r) {
        if (err) console.error(err.stack);
        assert(!err);
        assert(r.error);
        assert.equal(404, r.error.status);
        assert.equal('Not Found', r.body.error_description);
        done();
      });
  });

});
