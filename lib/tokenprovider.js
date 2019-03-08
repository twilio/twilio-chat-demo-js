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
    },
    pushCredentialSid: {
      enumerable: true,
      value: credentials.pushCredentialSid
    }
  });
}

TokenProvider.prototype.getToken = function(identity) {
  var token = new AccessToken(this.accountSid, this.signingKeySid, this.signingKeySecret, {
    identity: identity,
    ttl: 40000
  });

  var grant = new ChatGrant({ pushCredentialSid: this.pushCredentialSid });

  grant.serviceSid = this.serviceSid;
  token.addGrant(grant);

  return token.toJwt();
};

module.exports = TokenProvider;

