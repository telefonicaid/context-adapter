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
  caHelper = require('./context_adapter_helper'),
  caErrors = require('./context_adapter_error'),
  request = require('request'),
  revalidator = require('revalidator');

/**
 * Sends a queryContext request to the configured Context Broker
 * @param {string} service Service header to be used in the request
 * @param {string} servicePath Service Path header to be used in the request
 * @param {object} payload Payload to be included in the request
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the obtained response
 */
function sendQueryContext(service, servicePath, payload, callback) {
  var requestOptions = {
    method: 'POST',
    uri: 'http://' + caConfig.CB_HOST + ':' + caConfig.CB_PORT + caConfig.CB_PATH + '/queryContext',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Fiware-Service': service || caConfig.SERVICE,
      'Fiware-ServicePath': servicePath || caConfig.SERVICE_PATH
    },
    json: true,
    body: payload
  };
  request(requestOptions, callback);
}

/**
 * Sends a updateContext request to the configured Context Broker
 * @param {string} service Service header to be used in the request
 * @param {string} servicePath Service Path header to be used in the request
 * @param {object} payload Payload to be included in the request
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the obtained response
 */
function sendUpdateContext(service, servicePath, payload, callback) {
  var context = {
    corr: caHelper.getUnicaCorrelator(),
    trans: caHelper.getTransactionId(),
    op: caHelper.getOperationType()
  };

  caLogger.debug(
    context,
    'Sending updateContext to CB at ' + 'http://' + caConfig.CB_HOST + ':' + caConfig.CB_PORT + caConfig.CB_PATH +
    '/updateContext' + ' with payload: ' + JSON.stringify(payload)
  );

  var requestOptions = {
    method: 'POST',
    uri: 'http://' + caConfig.CB_HOST + ':' + caConfig.CB_PORT + caConfig.CB_PATH + '/updateContext',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Fiware-Service': service || caConfig.SERVICE,
      'Fiware-ServicePath': servicePath || caConfig.SERVICE_PATH
    },
    json: true,
    body: payload
  };
  request(requestOptions, callback);
}

/**
 * Checks that an updateContext request sent to the Context Adapter is well-formed
 * @param {object} request The request sent to the Context Adapter
 * @param {function} callback Callback to be called with the result of the check
 * @return {*} boolean True if the updateContext request is valid. False otherwise
 */
function checkUpdateContextRequest(request, callback) {
  function attributesConform(attributes) {
    return caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME) &&
      caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME) &&
      caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME) &&
      caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.CA_OPERATION_EXTRA_ATTR_NAME) &&
      (caHelper.getAttributeValue(attributes, caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME) ===
      caConfig.BUTTON_ENTITY.INTERACTION_TYPES.SYNCHRONOUS ||
      caHelper.isAttributeIncluded(attributes, caConfig.BUTTON_ENTITY.CA_OPERATION_STATUS_ATTR_NAME)) &&
      caHelper.isValidAttributeValues(
        request.contextAdapter.context, caConfig.BUTTON_ENTITY.TYPE, attributes);
  }

  var updateContextJSONSchema = {
    properties: {
      payload: {
        id: 'payload',
        type: 'object',
        required: true,
        properties: {
          contextElements: {
            id: 'contextElements',
            type: 'array',
            required: true,
            minItems: 0,
            maxItems: 2,
            items: {
              id: '0',
              type: 'object',
              required: true,
              properties: {
                id: {
                  id: 'id',
                  type: 'string',
                  required: true
                },
                type: {
                  id: 'type',
                  type: 'string',
                  required: true
                },
                isPattern: {
                  id: 'isPattern',
                  type: 'string',
                  required: true,
                  pattern: 'false'
                },
                attributes: {
                  id: 'attributes',
                  type: 'array',
                  required: true,
                  minItems: 4,
                  maxItems: 6,
                  conform: attributesConform,
                  message: 'lacks some mandatory attributes or invalid values are included'
                }
              }
            }
          },
          updateAction: {
            id: 'updateAction',
            type: 'string',
            required: true,
            pattern: 'UPDATE'
          }
        }
      }
    }
  };

  var validation = revalidator.validate(request, updateContextJSONSchema);
  if (validation.valid) {
    return process.nextTick(callback);
  } else {
    var err = new caErrors.BadPayload(
      request.payload
    );
    err.message += ' (errors: ' + caHelper.stringifyRevalidatorErrors(validation.errors) + ')';
    return process.nextTick(callback.bind(null, err));
  }
}

/**
 * Returns true if the updateContext request corresponds to a polling request from the button
 * @param {object} request The received request
 * @return {boolean} true if the updateContext request corresponds to a polling request from the button,
 *  false otherwise
 */
function isPollingUpdateContext(request) {
  if (request && request.payload && request.payload.contextElements && request.payload.contextElements[0]) {
    if (caHelper.getAttributeValue(
        request.payload.contextElements[0].attributes, caConfig.BUTTON_ENTITY.CA_LAST_OPERATION) === 'P') {
      return true;
    }
  }
  return false;
}

/**
 * Processes and returns the requested operation information
 * @param {object} request The updateContext request received
 * @param {function} callback Callback to be called with the result of the operation
 */
function getOperationDescriptor(request, callback) {
  checkUpdateContextRequest(request, function (err) {
    if (err) {
      return process.nextTick(callback.bind(null, err));
    } else {
      var operationDescriptor = {
        buttonId: request.payload.contextElements[0].id
      };
      request.payload.contextElements[0].attributes.forEach(function (attribute) {
        switch (attribute.name) {
          case caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME:
            operationDescriptor.interactionType = attribute.value;
            break;
          case caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME:
            operationDescriptor.serviceId = attribute.value;
            break;
          case caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME:
            operationDescriptor.action = attribute.value;
            break;
          case caConfig.BUTTON_ENTITY.CA_OPERATION_EXTRA_ATTR_NAME:
            operationDescriptor.extra = attribute.value;
            break;
        }
      });
      request.contextAdapter.operationDescriptor = operationDescriptor;
      return process.nextTick(callback.bind(null, null, operationDescriptor));
    }
  });
}

/**
 * Checks that an queryContext response returned by the Context Adapter to get
 *  service information is well-formed
 * @param {object} context The context for logging
 * @param {object} response The response received from the Context Adapter
 * @param {string} serviceId The identifier of the service whose information was retrieved
 * @param {function} callback Callback to be called with the result of the check
 * @return {*} True if the queryContextResponse is valid. False otherwise.
 */
function checkQueryContextResponse(context, response, serviceId, callback) {
  function attributesConform(attributes) {
    return caHelper.isAttributeIncluded(
        attributes,
        caConfig.SERVICE_ENTITY.PROVIDER_ATTR_NAME) &&
      caHelper.isAttributeIncluded(
        attributes,
        caConfig.SERVICE_ENTITY.INTERACTION_TYPE_ATTR_NAME) &&
      caHelper.isAttributeIncluded(
        attributes,
        caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME) &&
      caHelper.isAttributeIncluded(
        attributes,
        caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME) &&
      caHelper.isAttributeIncluded(
        attributes,
        caConfig.SERVICE_ENTITY.AUTHENTICATION_ATTR_NAME) &&
      caHelper.isAttributeIncluded(
        attributes,
        caConfig.SERVICE_ENTITY.MAPPING_ATTR_NAME) &&
      caHelper.isAttributeIncluded(
        attributes,
        caConfig.SERVICE_ENTITY.TIMEOUT_ATTR_NAME) &&
      caHelper.isValidAttributeValues(context, caConfig.SERVICE_ENTITY.TYPE, attributes);
  }

  var queryContextJSONSchema = {
    properties: {
      body: {
        id: 'body',
        type: 'object',
        required: true,
        properties: {
          contextResponses: {
            id: 'contextResponses',
            type: 'array',
            required: true,
            minItems: 0,
            maxItems: 2,
            items: {
              id: '0',
              type: 'object',
              required: true,
              properties: {
                contextElement: {
                  id: 'contextElement',
                  type: 'object',
                  required: true,
                  properties: {
                    id: {
                      id: 'id',
                      type: 'string',
                      required: true
                    },
                    type: {
                      id: 'type',
                      type: 'string',
                      required: true
                    },
                    isPattern: {
                      id: 'isPattern',
                      type: 'string',
                      required: true,
                      pattern: 'false'
                    },
                    attributes: {
                      id: 'attributes',
                      type: 'array',
                      required: true,
                      minItems: 6,
                      maxItems: 8,
                      conform: attributesConform,
                      message: 'lacks some mandatory attributes or invalid values are included'
                    }
                  }
                },
                statusCode: {
                  id: 'statusCode',
                  type: 'object',
                  required: true,
                  properties: {
                    code: {
                      id: 'code',
                      type: 'string',
                      required: true,
                      pattern: '200'
                    },
                    reasonPhrase: {
                      id: 'code',
                      type: 'string',
                      required: true,
                      pattern: 'OK'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  var validation = revalidator.validate(response, queryContextJSONSchema);
  if (validation.valid) {
    return process.nextTick(callback);
  } else {
    var err = new caErrors.BadService(serviceId);
    err.message += ' (errors: ' + caHelper.stringifyRevalidatorErrors(validation.errors) + ')';
    return process.nextTick(callback.bind(null, err));
  }
}

/**
 * Returns the interaction type of a button from its id
 * @param {object} thirdPartyUpdateRequest The request received from the Third Party as an update to an
 *  asynchronous request
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the required button interaction type
 */
function getButtonInteractionType(thirdPartyUpdateRequest, callback) {
  var interactionType,
      payload = {
        entities: [
          {
            id: thirdPartyUpdateRequest.payload.buttonId,
            type: caConfig.BUTTON_ENTITY.TYPE,
            isPattern: false
          }
        ],
        attributes: [
          caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME
        ]
      };

  caLogger.debug(
    thirdPartyUpdateRequest.contextAdapter.context,
    'Sending queryContext to the Context Broker to get the interaction_type attribute of the button with id \'' +
    thirdPartyUpdateRequest.payload.buttonId + '\' with headers: ' +
    'Fiware-Service: ' + thirdPartyUpdateRequest.headers['fiware-service'] + ' and ' +
    'Fiware-ServicePath: ' + thirdPartyUpdateRequest.headers['fiware-servicepath'] +
    ' and using payload: ' +
    JSON.stringify(payload)
  );

  sendQueryContext(
    thirdPartyUpdateRequest.headers['fiware-service'],
    thirdPartyUpdateRequest.headers['fiware-servicepath'],
    payload,
    function(err, response, body) {
      caLogger.debug(
        thirdPartyUpdateRequest.contextAdapter.context,
        'Response received from the Context Broker when querying for the interaction type of the button with id \'' +
        thirdPartyUpdateRequest.payload.buttonId + '\': ' +
        'err: ' + err + ', payload: ' + JSON.stringify(body)
      );

      if (err) {
        return process.nextTick(callback.bind(null, err));
      }

      if (body.errorCode) {
        var badInteractionType = new caErrors.BadInteractionType(
          thirdPartyUpdateRequest.payload.buttonId,
          'unknown' + ' (' + body.errorCode.code + ': ' + body.errorCode.reasonPhrase + ')'
        );
        return process.nextTick(callback.bind(null, badInteractionType));
      }

      interactionType = caHelper.getAttributeValue(
        body.contextResponses[0].contextElement.attributes,
        caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME);

      return process.nextTick(callback.bind(null, null, interactionType));
    }
  );
}

/**
 * Returns a service descriptor based on a service unique identifier
 * @param {object} request The received updateContext request
 * @param {object} operationDescriptor The operation descriptor associated to the request
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the required service descriptor
 */
function getServiceDescriptor(request, operationDescriptor, callback) {
  var payload = {
    entities: [
      {
        id: operationDescriptor.serviceId,
        type: caConfig.SERVICE_ENTITY.TYPE,
        isPattern: false
      }
    ],
    attributes: [
      caConfig.SERVICE_ENTITY.PROVIDER_ATTR_NAME,
      caConfig.SERVICE_ENTITY.INTERACTION_TYPE_ATTR_NAME,
      caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
      caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
      caConfig.SERVICE_ENTITY.AUTHENTICATION_ATTR_NAME,
      caConfig.SERVICE_ENTITY.MAPPING_ATTR_NAME,
      caConfig.SERVICE_ENTITY.TIMEOUT_ATTR_NAME
    ]
  };

  caLogger.debug(
    request.contextAdapter.context,
    'Sending queryContext to the Context Broker to get the service entity with headers: ' +
    'Fiware-Service: ' + request.headers['fiware-service'] + ' and ' +
    'Fiware-ServicePath: ' + request.headers['fiware-servicepath'] +
    ' and using payload: ' +
    ' with payload: ' +
    JSON.stringify(payload)
  );

  sendQueryContext(
    request.headers['fiware-service'],
    request.headers['fiware-servicepath'],
    payload,
    function(err, response, body) {
      caLogger.debug(
        request.contextAdapter.context,
        'Response received from the Context Broker when querying for the service entity: ' +
        'err: ' + err + ', payload: ' + JSON.stringify(body)
      );

      if (err) {
        return process.nextTick(callback.bind(null, err));
      }

      checkQueryContextResponse(request.contextAdapter.context, response, operationDescriptor.serviceId, function(err) {
        if (err) {
          return process.nextTick(callback.bind(null, err));
        } else {
          var serviceDescription = {
            id: operationDescriptor.serviceId
          };
          body.contextResponses[0].contextElement.attributes.forEach(function(attribute) {
            switch (attribute.name) {
              case caConfig.SERVICE_ENTITY.PROVIDER_ATTR_NAME:
                serviceDescription.provider = attribute.value;
                break;
              case caConfig.SERVICE_ENTITY.INTERACTION_TYPE_ATTR_NAME:
                serviceDescription.interactionType = attribute.value;
                break;
              case caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME:
                serviceDescription.endpoint = attribute.value;
                break;
              case caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME:
                serviceDescription.method = attribute.value;
                break;
              case caConfig.SERVICE_ENTITY.AUTHENTICATION_ATTR_NAME:
                serviceDescription.authentication = attribute.value;
                break;
              case caConfig.SERVICE_ENTITY.MAPPING_ATTR_NAME:
                serviceDescription.mapping = attribute.value;
                break;
              case caConfig.SERVICE_ENTITY.TIMEOUT_ATTR_NAME:
                serviceDescription.timeout = attribute.value;
                break;
            }
          });
          request.contextAdapter.serviceDescriptor = serviceDescription;
          return process.nextTick(callback.bind(null, null, serviceDescription));
        }
      });
    }
  );
}

/**
 * Processes and returns the payload to be sent in the request to a Third Party
 *  based on certain service and operation descriptors
 * @param {object} serviceDescriptor The service descriptor
 * @param {object} operationDescriptor The operation descriptor
 * @return {object} The payload to be sent in the request to a Third Party
 */
function getThirdPartyPayload(serviceDescriptor, operationDescriptor) {
  var payload = {
    button: operationDescriptor.buttonId,
    action: operationDescriptor.action,
    extra: operationDescriptor.extra
  };
  if (serviceDescriptor.interactionType ===
    caConfig.SERVICE_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) {
    payload.callback = 'http://' + caConfig.CA_PUBLIC_HOST + ':' + caConfig.CA_PORT +
      caConfig.CA_PATH + caConfig.CA_CALLBACK_PATH;
  }
  return payload;
}

/**
 * Generates the result in case of error or from the response obtained from the third party
 * @param {object} err The error, if any
 * @param {object} data The data returned by the Third Party as the operation request result
 * @return {object} The generated operation result
 */
function getResult(err, data) {
  if (err) {
    // TODO For the time being we return '0,<error code>,<details>'
    return '0,' + err.code + ',' + err.message;
  }

  var detailsObj;
  var result = '';
  if (data) {
    if (data.body) {
      detailsObj = data.body.details;
    } else if (data.payload) {
      detailsObj = data.payload.details;
    } else {
      return '0,' + 'XXX' + ',' + 'Unknown data received from the Third Party as the request result';
    }
    for (var key in detailsObj) {
      if (detailsObj.hasOwnProperty(key)) {
        result += encodeURIComponent(key + '-' + detailsObj[key] + ';');
      }
    }
    return '1,' + result;
  } else {
    return '0,XXX,Unknown data received from the Third Party as the request result';
  }
}

/**
 * Sends a synchronous request to the third party
 * @param {object} updateContextRequest The updateContext request received
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the obtained response
 */
function sendThirdPartyRequest(updateContextRequest, callback) {
  var payload = getThirdPartyPayload(updateContextRequest.contextAdapter.serviceDescriptor,
    updateContextRequest.contextAdapter.operationDescriptor);

  caLogger.debug(
    updateContextRequest.contextAdapter.context,
    'Sending ' + updateContextRequest.contextAdapter.serviceDescriptor.method + ' request to third party at: ' +
    updateContextRequest.contextAdapter.serviceDescriptor.endpoint + ' with headers: ' +
    'Fiware-Service: ' + updateContextRequest.headers['fiware-service'] + ' and ' +
    'Fiware-ServicePath: ' + updateContextRequest.headers['fiware-servicepath'] +
    ' and payload: ' + JSON.stringify(payload)
  );

  var requestOptions = {
    method: updateContextRequest.contextAdapter.serviceDescriptor.method,
    uri: updateContextRequest.contextAdapter.serviceDescriptor.endpoint,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Fiware-Service': updateContextRequest.headers['fiware-service'],
      'Fiware-ServicePath': updateContextRequest.headers['fiware-servicepath']
    },
    json: true,
    body: payload
  };
  request(requestOptions, callback);
}

/**
 * Sends the prepared updateContext request to the Context Broker
 * @param {object} request The original request
 * @param {array} contextElements The contextElements array
 * @param {function} callback The callback
 */
function doSendUpdateContext(request, contextElements, callback) {
  var payload = {
    contextElements: contextElements,
    updateAction: 'UPDATE'
  };

  caLogger.debug(
    request.contextAdapter.context,
    'Notifying the Context Broker that the request has been completed with headers ' +
    'Fiware-Service: ' + request.headers['fiware-service'] + ' and ' +
    'Fiware-ServicePath: ' + request.headers['fiware-servicepath'] +
    ' and payload: ' + JSON.stringify(payload)
  );

  sendUpdateContext(
    request.headers['fiware-service'],
    request.headers['fiware-servicepath'],
    payload,
    callback
  );
}

/**
 * Removes the op_status and includes the aux_op_result attributes to the array of attributes to send to the
 *  Context Broker in the updateContext request for the synchronous button case
 * @param {array} contextElements The contextElements array
 * @param {object} response The response received or notified by the Third Party
 */
function setSynchronousButtonAttributes(contextElements, response) {
  contextElements[0].attributes.push(
    {
      name: caConfig.BUTTON_ENTITY.IOTA_OPERATION_RESULT_ATTR_NAME,
      type: caConfig.ATTRIBUTE_TYPE.STRING,
      value: getResult(null, response)
    }
  );
  caHelper.removeAttribute(contextElements[0].attributes, caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME);
}

/**
 * Sends an updateContext request to the Context Broker updating the button attributes and setting the request state
 *  to completed for the case of a synchronous Third Party
 * @param request The original (redirected) update context request received from the Context Broker
 * @param response The response received from the Third Party
 * @param callback The callback
 * @return {*} Returns nothing
 */
function notifyOperationCompletedSync(request, response, callback) {
  var contextElements = [
    {
      id: request.contextAdapter.operationDescriptor.buttonId,
      type: caConfig.BUTTON_ENTITY.TYPE,
      isPattern: false,
      attributes: [
        {
          name: caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME,
          type: caConfig.ATTRIBUTE_TYPE.STRING,
          value: caConfig.BUTTON_ENTITY.OPERATION_STATUS.COMPLETED
        },
        {
          name: caConfig.BUTTON_ENTITY.OPERATION_RESULT_ATTR_NAME,
          type: caConfig.ATTRIBUTE_TYPE.STRING,
          value: getResult(null, response)
        }
      ]
    }
  ];

  if (request.contextAdapter.operationDescriptor.interactionType ===
    caConfig.BUTTON_ENTITY.INTERACTION_TYPES.SYNCHRONOUS) {
    // Synchronous button request
    setSynchronousButtonAttributes(contextElements, response);
    doSendUpdateContext(request, contextElements, callback);
  } else if (request.contextAdapter.operationDescriptor.interactionType ===
    caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) {
    // Asynchronous button request
    doSendUpdateContext(request, contextElements, callback);
    // Unknown type button request
  } else {
    var badInteractionType = new caErrors.BadInteractionType(
      request.contextAdapter.operationDescriptor.buttonId,
      request.contextAdapter.operationDescriptor.interactionType
    );
    return process.nextTick(callback.bind(null, badInteractionType));
  }
}

/**
 * Sends an updateContext request to the Context Broker updating the button attributes and setting the request state
 *  to completed for the case of an asynchronous Third Party
 * @param {object} thirdPartyUpdateRequest The request received from the Third Party as the operation request result
 *  an updateContext request, null if the request is an update request sent by a third party.
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the result of the notification
 */
function notifyOperationCompletedAsync(thirdPartyUpdateRequest, callback) {
  var contextElements = [
    {
      id: thirdPartyUpdateRequest.payload.buttonId,
      type: caConfig.BUTTON_ENTITY.TYPE,
      isPattern: false,
      attributes: [
        {
          name: caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME,
          type: caConfig.ATTRIBUTE_TYPE.STRING,
          value: caConfig.BUTTON_ENTITY.OPERATION_STATUS.COMPLETED
        },
        {
          name: caConfig.BUTTON_ENTITY.OPERATION_RESULT_ATTR_NAME,
          type: caConfig.ATTRIBUTE_TYPE.STRING,
          value: getResult(null, thirdPartyUpdateRequest)
        }
      ]
    }
  ];

  getButtonInteractionType(thirdPartyUpdateRequest, function(err, interactionType) {
    if (err && callback) {
      return process.nextTick(callback.bind(null, err));
    }
    if (interactionType === caConfig.BUTTON_ENTITY.INTERACTION_TYPES.SYNCHRONOUS) {
      // Synchronous button request
      setSynchronousButtonAttributes(contextElements, thirdPartyUpdateRequest);
      doSendUpdateContext(thirdPartyUpdateRequest, contextElements, callback);
    } else if (interactionType === caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) {
      // Synchronous button request
      doSendUpdateContext(thirdPartyUpdateRequest, contextElements, callback);
    } else {
      // Unknown type button request
      var badInteractionType = new caErrors.BadInteractionType(
        thirdPartyUpdateRequest.payload.buttonId, interactionType);
      return process.nextTick(callback.bind(null, badInteractionType));
    }
  });
}

/**
 * Sends a operation closed notification to the Context Broker
 * @param {object} err The error which caused the request to be cancelled and closed
 * @param {request} request The received updateContext request
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the result of the notification
 */
function notifyOperationClosed(err, request, callback) {
  var payload = {
    contextElements: [
      {
        id: request.contextAdapter.operationDescriptor.buttonId,
        type: caConfig.BUTTON_ENTITY.TYPE,
        isPattern: false,
        attributes: [
          {
            name: caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME,
            type: caConfig.ATTRIBUTE_TYPE.STRING,
            value: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED
          },
          {
            name: caConfig.BUTTON_ENTITY.IOTA_OPERATION_STATUS_ATTR_NAME,
            type: caConfig.ATTRIBUTE_TYPE.STRING,
            value: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED
          },
          {
            name: caConfig.BUTTON_ENTITY.OPERATION_RESULT_ATTR_NAME,
            type: caConfig.ATTRIBUTE_TYPE.STRING,
            value: getResult(err)
          },
          {
            name: caConfig.BUTTON_ENTITY.IOTA_OPERATION_RESULT_ATTR_NAME,
            type: caConfig.ATTRIBUTE_TYPE.STRING,
            value: getResult(err)
          }
        ]
      }
    ],
    updateAction: 'UPDATE'
  };

  caLogger.debug(
    request.contextAdapter.context,
    'Notifying the Context Broker that the request has been closed with headers : ' +
    'Fiware-Service: ' + request.headers['fiware-service'] + ' and ' +
    'Fiware-ServicePath: ' + request.headers['fiware-servicepath'] +
    ' and payload: ' + JSON.stringify(payload)
  );

  sendUpdateContext(
    request.headers['fiware-service'],
    request.headers['fiware-servicepath'],
    payload,
    callback
  );
}

/**
 * Returns the NGSI response for an updateContext request based on the
 *  request itself and on the existence of any error during its processing
 * @param {object} err The error when processing the request, if any
 * @param {object} request The updateContext request
 * @return {object} The composed response
 */
function getUpdateContextNGSIResponse(err, request) {
  var response = {
    contextResponses: []
  };
  var statusCode;
  if (err) {
    statusCode = {
      code: '400',
      reasonPhrase: encodeURIComponent(err.code + ' - ' + err.message)
    };
  } else {
    statusCode = {
      code: '200',
      reasonPhrase: 'OK'
    };
  }
  if (request.payload && request.payload.contextElements) {
    request.payload.contextElements.forEach(function(contextElement) {
      var entry = {
        contextElement: contextElement,
        statusCode: statusCode
      };
      response.contextResponses.push(entry);
    });
  } else {
    response.contextResponses.push({
      statusCode: statusCode
    });
  }
  return response;
}

/**
 * Returns the NGSI response for an queryContext request based on the
 *  request itself and on the existence of any error during its processing
 * @param {object} request The updateContext request
 * @return {object} The composed response
 */
function getQueryContextNGSIResponse(request) {
  var contextElement;
  var response = {
    contextResponses: []
  };
  var statusCode = {
    code: '200',
    reasonPhrase: 'OK'
  };

  if (request.payload && request.payload.entities) {
    request.payload.entities.forEach(function(entity) {
      if (entity.type === caConfig.BUTTON_ENTITY.TYPE) {
        contextElement = entity;
        contextElement.attributes = [];
      }
      var entry = {
        contextElement: contextElement,
        statusCode: statusCode
      };
      response.contextResponses.push(entry);
    });
  } else {
    response.contextResponses.push({
      code: '400',
      reasonPhrase: 'Bad Request'
    });
  }
  return response;
}

module.exports = {
  isPollingUpdateContext: isPollingUpdateContext,
  getOperationDescriptor: getOperationDescriptor,
  getServiceDescriptor: getServiceDescriptor,
  sendThirdPartyRequest: sendThirdPartyRequest,
  notifyOperationCompletedAsync: notifyOperationCompletedAsync,
  notifyOperationCompletedSync: notifyOperationCompletedSync,
  notifyOperationClosed: notifyOperationClosed,
  getUpdateContextNGSIResponse: getUpdateContextNGSIResponse,
  getQueryContextNGSIResponse: getQueryContextNGSIResponse
};
