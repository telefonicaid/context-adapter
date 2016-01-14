/*
 * Copyright 2015 Telefónica Investigación y Desarrollo, S.A.U
 *
 * This file is part of context-adapter
 *
 * context-adapter is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * context-adapter is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with context-adapter.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[german.torodelvalle@telefonica.com]
 */

'use strict';

var caLogger = require('logops'),
    caConfig = require('./context_adapter_configuration'),
    caComm = require('./context_adapter_communication'),
    caErrors = require('./context_adapter_error'),
    caHelper = require('./context_adapter_helper.js'),
    hapi = require('hapi'),
    boom = require('boom'),
    async = require('async');

var server;

var attendedRequests = 0;

/**
 * Checks that every request sent to the Context Adapter includes the required headers
 * @param {object} value Headers object
 * @param {object} options Hapi server header validation configuration object
 * @param {function} next Hapi server header validation continuation function
 */
function validateHeaders(value, options, next) {
  var error, message;

  var context = {
    corr: value[caConfig.UNICA_CORRELATOR_HEADER] || caHelper.getUnicaCorrelator(),
    trans: caHelper.getTransactionId(),
    op: caHelper.getOperationType()
  };

  attendedRequests++;

  if (!value['fiware-service']) {
    message = 'error=child "fiware-service" fails because [fiware-service is required]';
    caLogger.warn(
      context,
      message
    );
    error = boom.badRequest(message);
    error.output.payload.validation = {source: 'headers', keys: ['fiware-service']};
    next(error);
  } else if (!value['fiware-servicepath']) {
    message = 'child "fiware-servicepath" fails because [fiware-servicepath is required]';
    caLogger.warn(
      context,
      message
    );
    error = boom.badRequest(message);
    error.output.payload.validation = {source: 'headers', keys: ['fiware-servicepath']};
    next(error);
  }
  next();
}

/**
 * Handler to manage the requests for the version of the component
 * @param {Object} request The received request
 * @param {Function} reply The reply function to respond to the requester
 * @return {*} Returns the version of the Context Adapter component
 */
function getVersionHandler(request, reply) {
  var message = caHelper.getVersion();
  return reply(message);
}

/**
 * Responds to a valid request
 * @param {Object} request The request
 * @param {Function} reply The reply() function to respond to the client
 * @param {Object} operationDescriptor The operation descriptor associated to the received request, if any (it could be
 *  a polling updateContext request)
 * @param {Function} callback Callback function
 */
function respond2Request(request, reply, callback) {
  // Respond to the received request
  var ngsiResponse = caComm.getNGSIResponse(null, request);
  caLogger.debug(
    request.contextAdapter.context,
    'Responding to the Context Broker with payload: ' +
    JSON.stringify(ngsiResponse)
  );
  reply(ngsiResponse);
  if (callback) {
    callback(null);
  }
}

/**
 * Error handler if an error occurs during a new request reception
 * @param {Object} request The received request
 * @param {Function} reply The reply() function to respond to the client
 * @param {Object} err The error which caused the processing of the request to be cancelled
 */
function requestErrorHandler(request, reply, err) {
  if (err instanceof caErrors.BadOperationStatus) {
    caLogger.debug(
      request.contextAdapter.context,
      'Ignoring the received request. Reason: ' + err.message
    );
    // The request payload includes an operation status which is not "P", the notification
    //  should be ignored
    // Respond to the received request
    // Since notifications with op_status to any value distinct to "P" should be ignored, we remove the err from the
    //  generated NGSI response
    var ngsiResponse = caComm.getNGSIResponse(null, request);
    caLogger.debug(
      request.contextAdapter.context,
      'Responding to the Context Broker with payload: ' +
      JSON.stringify(ngsiResponse)
    );
    reply(ngsiResponse);
  } else {
    caLogger.warn(
      request.contextAdapter.context,
      'Some error occurred when processing the request: ' +
      (err.code || err.name) + ' - ' + err.message
    );

    if (err instanceof caErrors.BadPayload) {
      // The request payload is invalid (the operation description could not be successfully retrieved)
      // Respond to the received request
      var ngsiResponse = caComm.getNGSIResponse(err, request);
      caLogger.debug(
        request.contextAdapter.context,
        'Responding to the Context Broker with payload: ' +
        JSON.stringify(ngsiResponse)
      );
      reply(ngsiResponse);
    }

    // Notify the operation as closed
    caComm.notifyOperationClosed(
      err,
      request,
      function onNotifyOperationClosed() {
        // TODO Decide how to behave in case of a notification error
      }
    );
  }
}

/**
 * Handler of third party responses
 * @param {Object} request The received request
 * @param {Object} err Error, if any, when sending the request to the third party
 * @param {Object} response The response, if any, received from the third party
 */
function onThirdPartyResponse(request, err, response) {
  if (err) {
    // Error response from the Third Party
    caLogger.warn(
      request.contextAdapter.context,
      'Error response from the Third Party: ' +
        err.code + ' - ' + err.message
    );
    // Notify the operation as closed
    caComm.notifyOperationClosed(
      err,
      request,
      function onNotifyOperationClosed() {
        // TODO Decide how to behave in case of a notification error
      }
    );
  } else {
    // The third party responded to the request successfully
    caLogger.debug(
      request.contextAdapter.context,
      'Successful response from the Third Party: ' +
        JSON.stringify(response)
    );

    if (request.contextAdapter.serviceDescriptor.interactionType ===
      caConfig.SERVICE_ENTITY.INTERACTION_TYPES.SYNCHRONOUS) {
      // Notify the operation as completed
      caComm.notifyOperationCompletedSync(
        request,
        response,
        function onNotifyOperationCompleted(err, response, body) {
          // TODO Decide how to behave in case of a notification error
          caLogger.debug(
            request.contextAdapter.context,
            'Context Broker response: ' +
            'err: ' + err + ', body: ' + JSON.stringify(body)
          );
        }
      );
    } else {
      // Do nothing, just wait for the update from the Third Party
      caLogger.debug(
        request.contextAdapter.context,
        'Waiting from the update from the Third Party for the asynchronous request...'
      );
    }
  }
}

/**
 * Processes a valid operation request
 * @param {Object} request The request received
 * @param {Object} serviceDescriptor The service descriptor associated to the received request
 */
function processOperationRequest(request) {
  // Send a request to the Third Party
  caComm.sendThirdPartyRequest(request, onThirdPartyResponse.bind(null, request));
}

/**
 * Handler of geolocation service responses
 * @param {Object} request The received request
 * @param {Object} cellIdDescriptor The cell id descriptor whose geolocation has been retrieved
 * @param {Object} err Error, if any, when sending the request to the third party
 * @param {Object} response The response, if any, received from the third party
 */
function onGeolocationResponse(request, cellIdDescriptor, err, response) {
  if (err || response.body.error) {
    // Error response from the geolocation service
    caLogger.warn(
      request.contextAdapter.context,
      'Error response from the geolocation service: ' +
      (err ? err.code + ' - ' + err.message : JSON.stringify(response.body.error)) + ', consequently ' +
      'the geolocation of the entity with id \'' + cellIdDescriptor.id + '\' will not be updated in the Context Broker'
    );
  } else {
    // The geolocation service responded to the request successfully
    caLogger.debug(
      request.contextAdapter.context,
      'Successful response from the geolocation service: ' +
      JSON.stringify(response)
    );

    // Update the entity geolocation in the Context Broker
    caComm.updateGeolocation(
      request,
      cellIdDescriptor,
      response,
      function onGeolocationUpdated(err, response, body) {
        // TODO Decide how to behave in case of an update error
        caLogger.debug(
          request.contextAdapter.context,
          'Context Broker response: ' +
          'err: ' + err + ', body: ' + JSON.stringify(body)
        );
      }
    );
  }
}

/**
 * Processes a valid cell id request
 * @param {Object} request The request received
 */
function processCellIdRequest(request) {
  request.contextAdapter.cellIdDescriptors.forEach(function(cellIdDescriptor) {
    caLogger.debug(
      request.contextAdapter.context,
      'cell id descriptor: ' +
      JSON.stringify(cellIdDescriptor)
    );

    // Send a request to the geolocation service
    caComm.getGeolocation(request, cellIdDescriptor, onGeolocationResponse.bind(null, request, cellIdDescriptor));
  });
}

/**
 * Returns the logging context associated to a request
 * @param {Object} request The request received
 * @return {Object} The context to be used for logging
 */
function getContext(request) {
  return {
    corr: request.headers[caConfig.UNICA_CORRELATOR_HEADER] ||
            caHelper.getUnicaCorrelator(request),
    trans: caHelper.getTransactionId(),
    op: caHelper.getOperationType(request)
  };
}

/**
 * Handler to manage generic button requests
 * @param {Object} request The received request
 * @param {Function} reply The reply function to respond to the requester
 */
function genericButtonRequestHandler(request, reply) {
  request.contextAdapter = request.contextAdapter || {};
  request.contextAdapter.context = getContext(request);

  caLogger.debug(
    request.contextAdapter.context,
    'Generic button request received: ' +
      JSON.stringify(request.payload)
  );

  if (caComm.isPollingUpdateContext(request)) {
    respond2Request(request, reply);
  } else {
    async.waterfall([
      caComm.getOperationDescriptor.bind(null, request),
      respond2Request.bind(null, request, reply),
      caComm.getServiceDescriptor.bind(null, request),
      processOperationRequest.bind(null, request)
    ], requestErrorHandler.bind(null, request, reply));
  }
}

/**
 * Handler to manage geolocation udpate requests
 * @param {Object} request The received request
 * @param {Function} reply The reply function to respond to the requester
 */
function geolocationUpdateRequestHandler(request, reply) {
  request.contextAdapter = request.contextAdapter || {};
  request.contextAdapter.context = getContext(request);

  caLogger.debug(
    request.contextAdapter.context,
    'Geolocation update request received: ' +
    JSON.stringify(request.payload)
  );

  respond2Request(request, reply);
  if (caComm.getCellIdDescriptors(request).length) {
    processCellIdRequest(request);
  } else {
    caLogger.debug(
      request.contextAdapter.context,
      'Ignoring the received request. Reason: the geolocation update notification is not well-formed'
    );
  }
}

/**
 * Handler to manage queryContext requests
 * @param {Object} request The received request
 * @param {Function} reply The reply function to respond to the requester
 */
function queryContextHandler(request, reply) {
  request.contextAdapter = request.contextAdapter || {};
  request.contextAdapter.context = getContext(request);

  caLogger.debug(
    request.contextAdapter.context,
    'queryContext request received: ' +
    JSON.stringify(request.payload)
  );

  reply(caComm.getQueryContextNGSIResponse(request));
}

/**
 * Handler to manage update requests received from Third Party's services
 * @param {Object} request The received request
 * @param {Function} reply The reply function to respond to the requester
 */
function thirdPartyUpdateHandler(request, reply) {
  // TODO Validate the request received from the third party

  request.contextAdapter = request.contextAdapter || {};
  request.contextAdapter.context = getContext(request);

  caLogger.debug(
    request.contextAdapter.context,
    'Asynchronous update request from third party: ' +
      JSON.stringify(request.payload)
  );

  // Notify the operation as completed
  caComm.notifyOperationCompletedAsync(
    request,
    function onNotifyOperationCompleted(err, response, body) {
      // TODO Decide how to behave in case of a notification error
      caLogger.debug(
        request.contextAdapter.context,
        'Context Broker response: ' +
        'err: ' + JSON.stringify(err) + ', body: ' + JSON.stringify(body)
      );
    }
  );
  reply();
}

/**
 * Starts the server asynchronously
 * @param {string} host The Context Adapter server host
 * @param {string} port The Context Adapter server port
 * @param {Function} callback Callback function to notify the result
 *  of the operation
 */
function start(host, port, callback) {
  var context = {
    op: caConfig.OPERATION_TYPE.SERVER_LOG
  };

  server = new hapi.Server();

  server.on('log', function(event, tags) {
    if (tags.load) {
      caLogger.warn(context, 'event=' + JSON.stringify(event));
    }
  });

  server.on('request-internal', function(request, event, tags) {
    if (tags.error) {
      if (tags.auth || tags.handler || tags.state || tags.payload || tags.validation) {
        caLogger.warn(context, request.method.toUpperCase() + ' ' + request.url.path +
          ', event=' + JSON.stringify(event)
        );
      } else {
        caLogger.error(context, request.method.toUpperCase() + ' ' + request.url.path +
          ', event=' + JSON.stringify(event)
        );
      }
    }
  });

  server.connection({
    host: host,
    port: port
  });

  server.route([
    {
      method: 'GET',
      path: '/version',
      handler: getVersionHandler
    },
    {
      method: 'POST',
      path: caConfig.CA_PATH + caConfig.CA_ROUTE_SUFFIXES.UPDATE_CONTEXT,
      handler: genericButtonRequestHandler,
      config: {
        validate: {
          headers: validateHeaders
        }
      }
    },
    {
      method: 'POST',
      path: caConfig.CA_PATH + caConfig.CA_ROUTE_SUFFIXES.NOTIFY,
      handler: genericButtonRequestHandler,
      config: {
        validate: {
          headers: validateHeaders
        }
      }
    },
    {
      method: 'POST',
      path: caConfig.CA_PATH + caConfig.CA_ROUTE_SUFFIXES.NOTIFY_GEOLOCATION,
      handler: geolocationUpdateRequestHandler,
      config: {
        validate: {
          headers: validateHeaders
        }
      }
    },
    {
      method: 'POST',
      path: caConfig.CA_PATH + caConfig.CA_ROUTE_SUFFIXES.QUERY_CONTEXT,
      handler: queryContextHandler,
      config: {
        validate: {
          headers: validateHeaders
        }
      }
    },
    {
      method: 'POST',
      path: caConfig.CA_PATH + caConfig.CA_CALLBACK_PATH,
      handler: thirdPartyUpdateHandler,
      config: {
        validate: {
          headers: validateHeaders
        }
      }
    }
  ]);

  // Start the server
  server.start(function(err) {
    return callback(err, server);
  });
}

/**
 * Stops the server asynchronously
 * @param {Function} callback Callback function to notify the result
 *  of the operation
 */
function stop(callback) {
  var context = {
    operationType: caConfig.OPERATION_TYPE.SERVER_STOP
  };

  caLogger.info(
    context,
    'Stopping the Context Adapter server...'
  );

  if (server && server.info && server.info.started) {
    server.stop(function(err) {
      // Server successfully stopped
      caLogger.info(
        context,
        'HTTP server (hapi) successfully stopped'
      );

      if (callback) {
        process.nextTick(callback.bind(null, err));
      }
    });
  } else {
    caLogger.info(
      context,
      'No HTTP server (hapi) running'
    );

    if (callback) {
      process.nextTick(callback);
    }
  }
}

/**
 * Returns the server KPIs
 * @return {{attendedRequests: number}}
 */
function getKPIs() {
  return {
    attendedRequests: attendedRequests
  };
}

/**
 * Resets the server KPIs
 */
function resetKPIs() {
  attendedRequests = 0;
}

/**
 * Properties and functions exported by the module
 * @type {{server, startup: startup, exitGracefully: exitGracefully}}
 */
module.exports = {
  get hapiServer() {
    return server;
  },
  start: start,
  stop: stop,
  getKPIs: getKPIs,
  resetKPIs: resetKPIs
};
