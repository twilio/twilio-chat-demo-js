var credentials = require('./credentials.json');
var express = require('express');
var TokenProvider = require('./lib/tokenprovider');

var app = new express();
var tokenProvider = new TokenProvider(credentials);

if (credentials.authToken) {
  console.warn('WARNING: The "authToken" field is deprecated. Please use "signingKeySecret".');
}

if (credentials.instanceSid) {
  console.warn('WARNING: The "instanceSid" field is deprecated. Please use "serviceSid".');
}

app.get('/getToken', function(req, res) {
  var identity = req.query && req.query.identity;
  if (!identity) {
    res.status(400).send('getToken requires an Identity to be provided');
  }

  var token = tokenProvider.getToken(identity);
  res.send(token);
});

app.use(express.static(__dirname + '/public'));

app.listen(8080);
