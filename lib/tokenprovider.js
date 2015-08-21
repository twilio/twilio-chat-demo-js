'use strict';

var twilio = require('twilio');

function TokenProvider(credentials) {
  Object.defineProperties(this, {
    accountSid: {
      enumerable: true,
      value: credentials.accountSid
    },
    appSid: {
      enumerable: true,
      value: credentials.appSid
    },
    authToken: {
      enumerable: true,
      value: credentials.authToken
    },
    instanceSid: {
      enumerable: true,
      value: credentials.instanceSid
    }
  });
}

TokenProvider.prototype.getToken = function(identity, endpointId) {
  return twilio.Capability(this.accountSid, this.authToken)
    .allowClientOutgoing(this.appSid, {
      'endpoint_id': this.appSid + identity + endpointId,
      'identity': identity,
      'service_sid': this.instanceSid
    }).generate(3600);
};

module.exports = TokenProvider;

