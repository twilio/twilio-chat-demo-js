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
  var endpointId = req.query && req.query.endpointId;

  if (!identity || !endpointId) {
    res.status(400).send('getToken requires both an Identity and an Endpoint ID');
  }

  var token = tokenProvider.getToken(identity, endpointId);
  res.send(token);
});

app.use(express.static(__dirname + '/public'));

app.listen(8080);
