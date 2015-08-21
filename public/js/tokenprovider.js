'use strict';

function TokenProvider(uri)
{
    this._uri = 'https://aim.twilio.com/v1/channel/authtoken';
}

TokenProvider.prototype.getToken = function(username, password, endpointId)
{
    var XHR = typeof XMLHttpRequest === 'undefined'
            ? require('xmlhttprequest').XMLHttpRequest
            : XMLHttpRequest;

    function request(method, params) {
        var promise = new Promise(function(resolve, reject) {

            var xhr = new XHR();
            xhr.open(method, params.url, true);

            xhr.onreadystatechange = function onreadystatechange() {
                if (xhr.readyState !== 4) { return; }

                if (200 <= xhr.status && xhr.status < 300) {
                    if(params.expectResponseHeaders) {
                        var headers = {
                                        ETag: xhr.getResponseHeader('ETag'),
                                        Location: xhr.getResponseHeader('Location'),
                                      };

                        resolve({ headers: headers, body: xhr.responseText});
                    }
                    else {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(xhr.responseText);
                }
            };

            for(var headerName in params.headers) {
                xhr.setRequestHeader(headerName, params.headers[headerName]);
            }

            xhr.send(JSON.stringify(params.body));
        });
      
        return promise;
    }

    var Request = request;
    Request.get = function(params) {
        return request('GET', params);
    };

    var systemId = endpointId;
    var auth = "Basic " + btoa(username + ':' + password );
    var parts = this._uri.split('://');

    if(parts.length != 2)
    {
        return Promise.reject("Wrong chat service url. Unable to get token!");
    }

    var protocol = parts[0];
    var uri = parts[1];

    var urlToGet = (protocol + '://' + username + ':' + password + '@' + uri);

    var promise = new Promise(function(resolve, reject) {
        request.get({
            url: urlToGet + "?systemId=" + systemId,
            headers: {
                Authorization: auth,
            },
            xhrFields: {
                withCredentials: true
            },
        }).then(function(data) {
            resolve(data);
        }, function(error) {
            reject(error);
        });
    });

    return promise;
};


