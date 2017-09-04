'use strict';

var twilio = require('twilio');
var AccessToken = twilio.jwt.AccessToken;
var ChatGrant = AccessToken.ChatGrant;

function TokenProvider(credentials) {
  Object.defineProperties(this, {
    accountSid: {
      enumerable: true,
      value: credentials.accountSid
    },
    signingKeySid: {
      enumerable: true,
      value: credentials.signingKeySid
    },
    signingKeySecret: {
      enumerable: true,
      value: credentials.signingKeySecret || credentials.authToken
    },
    serviceSid: {
      enumerable: true,
      value: credentials.serviceSid || credentials.instanceSid
    }
  });
}

TokenProvider.prototype.getToken = function(identity, endpointId) {
  var token = new AccessToken(this.accountSid, this.signingKeySid, this.signingKeySecret, {
    identity: identity,
    ttl: 40000
  });

  var grant = new ChatGrant({ pushCredentialSid: 'CRe9c5eff29e744709d7df875f8a797bf0' });

  grant.serviceSid = this.serviceSid;
  grant.endpointId = this.serviceSid + identity + endpointId;
  token.addGrant(grant);

  return token.toJwt();
};

module.exports = TokenProvider;

