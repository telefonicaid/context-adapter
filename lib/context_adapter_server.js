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

(function() {
  'use strict';

  var caConfig = require('./context_adapter_configuration');
  var caLogger = require('./context_adapter_logger');
  var caHelper = require('./context_adapter_helper.js');
  var hapi = require('hapi');
  var boom = require('boom');

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

    var meta = {
      unicaCorrelator: value[caConfig.UNICA_CORRELATOR_HEADER] || caHelper.getUnicaCorrelator(),
      transactionId: caHelper.getTransactionId(),
      operationType: caHelper.getOperationType()
    };

    attendedRequests++;

    if (!value['fiware-service']) {
      message = 'error=child "fiware-service" fails because [fiware-service is required]';
      caLogger.warn(
        message,
        meta
      );
      error = boom.badRequest(message);
      error.output.payload.validation = {source: 'headers', keys: ['fiware-service']};
      next(error);
    } else if (!value['fiware-servicepath']) {
      message = 'child "fiware-servicepath" fails because [fiware-servicepath is required]';
      caLogger.warn(
        message,
        meta
      );
      error = boom.badRequest(message);
      error.output.payload.validation = {source: 'headers', keys: ['fiware-servicepath']};
      next(error);
    }
    next();
  }

  /**
   * Starts the server asynchronously
   * @param {string} host The Context Adapter server host
   * @param {string} port The Context Adapter server port
   * @param {Function} callback Callback function to notify the result
   *  of the operation
   */
  function start(host, port, callback) {
    server = new hapi.Server();

    server.on('log', function(event, tags) {
      if (tags.load) {
        caLogger.warn('event=' + JSON.stringify(event), {
          operationType: caConfig.OPERATION_TYPE.SERVER_LOG
        });
      }
    });

    server.on('request-internal', function(request, event, tags) {
      if (tags.error) {
        if (tags.auth || tags.handler || tags.state || tags.payload || tags.validation) {
          caLogger.warn(
            request.method.toUpperCase() + ' ' + request.url.path +
            ', event=' + JSON.stringify(event), {
              operationType: caConfig.OPERATION_TYPE.SERVER_LOG
            }
          );
        } else {
          caLogger.error(
            request.method.toUpperCase() + ' ' + request.url.path +
            ', event=' + JSON.stringify(event), {
              operationType: caConfig.OPERATION_TYPE.SERVER_LOG
            }
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
        handler: function(request, reply) {
          var message = caHelper.getVersion();
          return reply(message);
        }
      },
      {
        method: 'POST',
        path: caConfig.CA_PATH + '/updateContext',
        handler: function(request, reply) {
          var unicaCorrelatorPassed = request.headers[caConfig.UNICA_CORRELATOR_HEADER],
              service = request.headers['fiware-service'],
              servicePath = request.headers['fiware-servicepath'];

          var meta = {
            unicaCorrelator: unicaCorrelatorPassed || caHelper.getUnicaCorrelator(request),
            transactionId: caHelper.getTransactionId(),
            operationType: caHelper.getOperationType(request)
          };

          // Get the operation descriptor from the updateContext request received
          caHelper.getOperationDescriptor(request, function(err, operationDescriptor) {
            var ngsiResponse;

            if (err) {
              // The updateContext request is NOT well-formed
              caLogger.warn(
                'Invalid updateContext request received: ' +
                request.method.toUpperCase() + ' ' + request.url.path +
                ', error=' + err.code + ' - ' + err.message,
                meta
              );
              // Respond to the received updateContext request
              ngsiResponse = caHelper.getNGSIResponse(err, request);
              return reply(ngsiResponse);
            } else {
              // The updateContext request is well-formed
              caLogger.debug(
                'Valid updateContext request received: ' +
                request.method.toUpperCase() + ' ' + request.url.path +
                ', payload=' + JSON.stringify(request.payload),
                meta
              );
              caLogger.debug(
                'operation descriptor: ' +
                JSON.stringify(operationDescriptor),
                meta
              );
              // Respond to the received updateContext request
              ngsiResponse = caHelper.getNGSIResponse(null, request);
              reply(ngsiResponse);
              // Get the service description for the service id passed in the received request
              caHelper.getServiceDescriptor(
                service,
                servicePath,
                operationDescriptor.serviceId,
                function(err, serviceDescriptor) {
                  if (err) {
                    // Error when getting the service description
                    caLogger.warn(
                      'Error when retrieving the service descriptor: ' +
                      err.code + ' - ' + err.message,
                      meta
                    );
                    // Notify the opearation as closed
                    caHelper.notifyOperationClosed(
                      {
                        service: service,
                        servicePath: servicePath,
                        operationDescriptor: operationDescriptor,
                        result: caHelper.getResult(err)
                      },
                      function() {
                        // TODO Decide how to behave in case of a notification error
                      }
                    );
                  } else {
                    // Valid service description retrieved
                    caLogger.debug(
                      'service descriptor: ' +
                      JSON.stringify(serviceDescriptor),
                      meta
                    );
                    // Check the type of action to be accomplished
                    switch (operationDescriptor.action) {
                      case caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS:
                        // The requested operation is a synchronous action
                        // Send a synchronous request to the third party
                        caHelper.sendThirdPartyRequest(
                          {
                            service: request.headers['fiware-service'],
                            servicePath: request.headers['fiware-servicepath'],
                            serviceDescriptor: serviceDescriptor,
                            operationDescriptor: operationDescriptor
                          },
                          function(err, response) {
                            if (err) {
                              // Error when sending the synchronous request to the third party
                              caLogger.warn(
                                'Error when synchronous request from third party: ' +
                                err.code + ' - ' + err.message,
                                meta
                              );
                              // Notify the oparation as closed
                              caHelper.notifyOperationClosed(
                                {
                                  service: service,
                                  servicePath: servicePath,
                                  operationDescriptor: operationDescriptor,
                                  result: caHelper.getResult(err)
                                },
                                function() {
                                  // TODO Decide how to behave in case of a notification error
                                }
                              );
                            } else {
                              // The third party responded to the synchronous request successfully
                              caLogger.debug(
                                'Synchronous request from third party response: ' +
                                JSON.stringify(response),
                                meta
                              );
                              // Notify the operation as completed
                              caHelper.notifyOperationCompleted(
                                {
                                  service: service,
                                  servicePath: servicePath,
                                  operationDescriptor: operationDescriptor,
                                  result: caHelper.getResult(null, response)
                                },
                                function() {
                                  // TODO Decide how to behave in case of a notification error
                                }
                              );
                            }
                          }
                        );
                        break;
                      case caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE:
                        // The requested operation is an asynchronous action
                        // Send a synchronous request to the third party to get the external request id
                        caHelper.sendThirdPartyRequest(
                          {
                            service: request.headers['fiware-service'],
                            servicePath: request.headers['fiware-servicepath'],
                            serviceDescriptor: serviceDescriptor,
                            operationDescriptor: operationDescriptor
                          },
                          function(err, response) {
                            if (err) {
                              // Error when sending the synchronous request to the third party
                              caLogger.warn(
                                'Error when synchronous request from third party: ' +
                                err.code + ' - ' + err.message,
                                meta
                              );
                              // Notify the operation as closed
                              caHelper.notifyOperationClosed(
                                {
                                  service: service,
                                  servicePath: servicePath,
                                  operationDescriptor: operationDescriptor,
                                  result: caHelper.getResult(err)
                                },
                                function() {
                                  // TODO Decide how to behave in case of a notification error
                                }
                              );
                            } else {
                              // The third party responded to the synchronous request successfully
                              caLogger.debug(
                                'Synchronous request from third party response: ' +
                                JSON.stringify(response),
                                meta
                              );
                              // Notify the operation as completed
                              caHelper.notifyOperationInProgress(
                                {
                                  service: service,
                                  servicePath: servicePath,
                                  operationDescriptor: operationDescriptor,
                                  externalRequestId: caHelper.getExternalRequestId(response)
                                },
                                function() {
                                  // TODO Decide how to behave in case of a notification error
                                }
                              );
                            }
                          }
                        );
                        break;
                    }
                  }
                }
              );
            }
          });
        },
        config: {
          validate: {
            headers: validateHeaders
          }
        }
      },
      {
        method: 'POST',
        path: caConfig.CA_PATH + caConfig.UPDATE_WEB_HOOK_PATH,
        handler: function (request, reply) {
          // TODO Validate the request received from the third party

          var unicaCorrelatorPassed = request.headers[caConfig.UNICA_CORRELATOR_HEADER],
            service = request.headers['fiware-service'],
            servicePath = request.headers['fiware-servicepath'];

          var meta = {
            unicaCorrelator: unicaCorrelatorPassed || caHelper.getUnicaCorrelator(request),
            transactionId: caHelper.getTransactionId(),
            operationType: caHelper.getOperationType(request)
          };

          caLogger.debug(
            'Asynchronous update request from third party: ' +
            JSON.stringify(request.payload),
            meta
          );

          // Notify the operation as completed
          caHelper.notifyOperationCompleted(
            {
              service: service,
              servicePath: servicePath,
              operationDescriptor: request.payload.operationDescriptor,
              result: caHelper.getResult(null, request)
            },
            function() {
              // TODO Decide how to behave in case of a notification error
            }
          );
          return reply();
        },
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
    caLogger.info('Stopping the Context Adapter server...', {
      operationType: caConfig.OPERATION_TYPE.SERVER_STOP
    });
    if (server && server.info && server.info.started) {
      server.stop(function(err) {
        // Server successfully stopped
        caLogger.info('hapi server successfully stopped', {
          operationType: caConfig.OPERATION_TYPE.SERVER_STOP
        });
        return callback(err);
      });
    } else {
      caLogger.info('No hapi server running', {
        operationType: caConfig.OPERATION_TYPE.SERVER_STOP
      });
      return process.nextTick(callback);
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

  module.exports = {
    get hapiServer() {
      return server;
    },
    start: start,
    stop: stop,
    getKPIs: getKPIs,
    resetKPIs: resetKPIs
  };
})();
