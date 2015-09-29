// Auth module por Context Adapter

'use strict';

var caLogger = require('logops');
var caConfig = require('./context_adapter_configuration');
var caErrors = require('./context_adapter_error');
var caPackage = require('../package.json');
var request = require('request');


/**
 * Extract the error message from an error, based on the attributes existing in the error object.
 *
 * @param {Object} error        Error object to extract the message from.
 * @return {String}             String message corresponding to the error.
 */
function getKeystoneError(error) {
    var message = 'Unknown';

    if (error.message) {
        message = error.message;
    } else if (error.error && error.error.message) {
        message = error.error.message;
    }

    return message;
}

function getToken(payload, callback) {
  caLogger.info(
       'Sending get token to KEYSTONE at ' + 'http://' + caConfig.KEYSTONE_HOST + ':' + caConfig.KEYSTONE_PORT +
       '/v3/tokens' + ' with payload: ' + JSON.stringify(payload)
  );
  request({
    method: 'POST',
    uri: 'http://' + caConfig.KEYSTONE_HOST + ':' + caConfig.KEYSTONE_PORT + '/v3/tokens',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    json: true,
    body: payload
  }, callback);
}

function getTokenPayloadFromAnotherToken(tokendata, service, servicePath) {
    var payload = {
        auth: {
            identity: {
                methods: [
                    'token'
                ],
                token: {
                    id:  tokendata
                }
            },
            scope: {
                project: {
                    domain: {
                        name: service
                    },
                    name: servicePath
                }
            }
        }
    };
    return payload;
}

function getNewToken(request, token, callback) {

    var body_payload =
            getTokenPayloadFromAnotherToken(request['x-auth-token'],
                                            request['fiware-service'],
                                            request['fiware-servicePath']);

    getToken(body_payload, function(error, response, body) {

            if (body) {
                caLogger.debug('Keystone response authenticating CA:\n\n %j', body);
            }

            if (error) {
                var message = getKeystoneError(error);
                caLogger.error('Error connecting Keystone for CA authentication: %s', message);
                //waitingRequests.emit('token', new errors.KeystoneAuthenticationError(message));
            } else if (response.statusCode === 201 && response.headers['x-subject-token']) {
                caLogger.debug('Authentication of the CA to keystone success: \n%j\n\n', body);
                var new_token = response.headers['x-subject-token'];

            } else if (response.statusCode === 404 || response.statusCode === 401) {
                caLogger.error('Authentication against Keystone rejected with code %s',
                    response.statusCode);
            } else {
                caLogger.error('Authentication error trying to authenticate the CA: %s',
                    error);

                caLogger.debug('Error payload: \n%j\n\n', body);
                //waitingRequests.emit('token', new caErrors.KeystoneAuthenticationError(500));
            }
       });

}

function validateTokenRequest(request, callback) {

    // work in progress
    getNewToken(request, function(error, response, body) {
        // check token result

    });


}
