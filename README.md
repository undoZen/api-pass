api-pass
========

##Installation

    npm install api-pass

##Usage

    apiPass = require('api-pass');

    app.get('/api/pass', function (req, res, next) {
      req.apiPass = true;
      next();
    });

    app.get('/api/deny', function (req, res, next) {
      req.apiPass = false;
      next();
    });

    app.get('/api/404', function (req, res, next) {
      next();
    });

    app.use('/api', apiPass('http://you-resource-server/and-path-prefix'));

Now visit `/api/pass`, it will be reverse proxy to `http://you-resource-server/and-path-prefix/pass`, `/api/deny` will response a 403, and `/api/404` will pass the `apiPass()` middleware since req.apiPass is ommited.
