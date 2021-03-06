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
  requestSender = require('request'),
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
  requestSender(requestOptions, callback);
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
  caLogger.debug(
    context,
    'Sending updateContext to CB at ' + requestOptions.uri +
    ' with headers: ' + JSON.stringify(requestOptions.headers) +
    ' and payload: ' + JSON.stringify(requestOptions.body)
);
  requestSender(requestOptions, callback);
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

  var updateContextJSONSchema = require('./schema/updateContext-schema.json');
  updateContextJSONSchema.properties.payload.properties.contextElements.items.properties.attributes.conform =
    attributesConform;

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
 * Checks that a notification request sent to the Context Adapter is well-formed
 * @param {object} request The request sent to the Context Adapter
 * @param {function} callback Callback to be called with the result of the check
 * @return {*} boolean True if the updateContext request is valid. False otherwise
 */
function checkNotificationRequest(request, callback) {
  function attributesConform(attributes) {
    return caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME) &&
      caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME) &&
      caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.SERVICE_ID_ATTR_NAME) &&
      caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.OPERATION_ACTION_ATTR_NAME) &&
      caHelper.isAttributeIncluded(attributes,
        caConfig.BUTTON_ENTITY.OPERATION_EXTRA_ATTR_NAME) &&
      caHelper.isValidAttributeValues(
        request.contextAdapter.context, caConfig.BUTTON_ENTITY.TYPE, attributes);
  }

  var notificationJSONSchema = require('./schema/notification-schema.json');
  notificationJSONSchema.properties.payload.properties.contextResponses.items.properties.contextElement.properties.
    attributes.conform = attributesConform;

  var validation = revalidator.validate(request, notificationJSONSchema);
  var operationStatus;
  if (validation.valid) {
    operationStatus = caHelper.getAttributeValue(request.payload.contextResponses[0].contextElement.attributes,
      caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME);
    if (operationStatus === caConfig.BUTTON_ENTITY.OPERATION_STATUS.PENDING) {
      return process.nextTick(callback);
    } else {
      var badOperationStatusErr = new caErrors.BadOperationStatus(
        request.payload.contextResponses[0].contextElement.id,
        operationStatus
      );
      return process.nextTick(callback.bind(null, badOperationStatusErr));
    }
  } else {
    var badPayloadErr = new caErrors.BadPayload(
      request.payload
    );
    badPayloadErr.message += ' (errors: ' + caHelper.stringifyRevalidatorErrors(validation.errors) + ')';
    return process.nextTick(callback.bind(null, badPayloadErr));
  }
}

/**
 * Returns true if the updateContext request corresponds to a polling request from the button
 * @param {object} request The received request
 * @return {boolean} true if the updateContext request corresponds to a polling request from the button,
 *  false otherwise
 */
function isPollingUpdateContext(request) {
  if (request && request.payload && request.payload.contextElements && request.payload.contextElements[0] &&
    caHelper.getAttributeValue(
      request.payload.contextElements[0].attributes, caConfig.BUTTON_ENTITY.CA_LAST_OPERATION) === 'P') {
      return true;
  }
  return false;
}

/**
 * Processes and returns the requested operation information
 * @param {object} request The request received
 * @param {function} callback Callback to be called with the result of the operation
 */
function getOperationDescriptor(request, callback) {
  var operationDescriptor;
  if (caConfig.CA_MODE === caConfig.MODES.CONTEXT_PROVIDER) {
    checkUpdateContextRequest(request, function(err) {
      if (err) {
        return process.nextTick(callback.bind(null, err));
      }
      operationDescriptor = {
        buttonId: request.payload.contextElements[0].id
      };
      request.payload.contextElements[0].attributes.forEach(function(attribute) {
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
      caLogger.debug(
        request.contextAdapter.context,
        'operation descriptor: ' +
        JSON.stringify(request.contextAdapter.operationDescriptor)
      );
      return process.nextTick(callback);
    });
  } else {
    checkNotificationRequest(request, function(err) {
      if (err) {
        return process.nextTick(callback.bind(null, err));
      }
      operationDescriptor = {
        buttonId: request.payload.contextResponses[0].contextElement.id
      };
      request.payload.contextResponses[0].contextElement.attributes.forEach(function(attribute) {
        switch (attribute.name) {
          case caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME:
            operationDescriptor.interactionType = attribute.value;
            break;
          case caConfig.BUTTON_ENTITY.SERVICE_ID_ATTR_NAME:
            operationDescriptor.serviceId = attribute.value;
            break;
          case caConfig.BUTTON_ENTITY.OPERATION_ACTION_ATTR_NAME:
            operationDescriptor.action = attribute.value;
            break;
          case caConfig.BUTTON_ENTITY.OPERATION_EXTRA_ATTR_NAME:
            operationDescriptor.extra = attribute.value;
            break;
        }
      });
      request.contextAdapter.operationDescriptor = operationDescriptor;
      caLogger.debug(
        request.contextAdapter.context,
        'operation descriptor: ' +
        JSON.stringify(request.contextAdapter.operationDescriptor)
      );
      return process.nextTick(callback);
    });
  }
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

  var queryContextJSONSchema = require('./schema/queryContext-schema.json');
  queryContextJSONSchema.properties.body.properties.contextResponses.items.properties.contextElement.
    properties.attributes.conform = attributesConform;

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
 * @param {object} request The received request
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the required service descriptor
 */
function getServiceDescriptor(request, callback) {
  var payload = {
    entities: [
      {
        id: request.contextAdapter.operationDescriptor.serviceId,
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

      checkQueryContextResponse(request.contextAdapter.context, response,
        request.contextAdapter.operationDescriptor.serviceId, function(err) {
        if (err) {
          return process.nextTick(callback.bind(null, err));
        } else {
          var serviceDescription = {
            id: request.contextAdapter.operationDescriptor.serviceId
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
          caLogger.debug(
            request.contextAdapter.context,
            'service descriptor: ' +
            JSON.stringify(request.contextAdapter.serviceDescriptor)
          );
          return process.nextTick(callback);
        }
      });
    }
  );
}

/**
 * Processes and returns the payload to be sent in the request to a Third Party
 *  based on certain service and operation descriptors
 * @param {object} operationDescriptor The operation descriptor
 * @param {object} serviceDescriptor The service descriptor
 * @return {object} The payload to be sent in the request to a Third Party
 */
function getThirdPartyPayload(operationDescriptor, serviceDescriptor) {
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
    return {
      code: caConfig.RESULT_CODES.ERROR,
      extra: (err.code || err.name) + ' - ' + err.message
    };
  }

  var detailsObj;
  var result = '';
  if (data) {
    if (data.body) {
      detailsObj = data.body.details;
    } else if (data.payload) {
      detailsObj = data.payload.details;
    } else {
      return {
        code: caConfig.RESULT_CODES.ERROR,
        extra: 'Unknown data received from the Third Party as the request result'
      };
    }
    for (var key in detailsObj) {
      if (detailsObj.hasOwnProperty(key)) {
        result += key + '-' + detailsObj[key] + ';';
      }
    }
    return {
      code: caConfig.RESULT_CODES.SUCCESS,
      extra: result
    };
  } else {
    return {
      code: caConfig.RESULT_CODES.SUCCESS,
      extra: 'Unknown data received from the Third Party as the request result'
    };
  }
}

/**
 * Sends a synchronous request to the third party
 * @param {object} request The request received
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the obtained response
 */
function sendThirdPartyRequest(request, callback) {
  var payload = getThirdPartyPayload(request.contextAdapter.operationDescriptor,
    request.contextAdapter.serviceDescriptor);

  caLogger.debug(
    request.contextAdapter.context,
    'Sending ' + request.contextAdapter.serviceDescriptor.method + ' request to third party at: ' +
    request.contextAdapter.serviceDescriptor.endpoint + ' with headers: ' +
    'Fiware-Service: ' + request.headers['fiware-service'] + ' and ' +
    'Fiware-ServicePath: ' + request.headers['fiware-servicepath'] +
    ' and payload: ' + JSON.stringify(payload)
  );

  var requestOptions = {
    method: request.contextAdapter.serviceDescriptor.method,
    uri: request.contextAdapter.serviceDescriptor.endpoint,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Fiware-Service': request.headers['fiware-service'],
      'Fiware-ServicePath': request.headers['fiware-servicepath']
    },
    json: true,
    body: payload
  };
  requestSender(requestOptions, callback);
}

/**
 * Sends the prepared updateContext request to the Context Broker
 * @param {object} request The original request
 * @param {array} contextElements The contextElements array
 * @param {string} updateAction The updateAction to use in the updateContext request
 * @param {function} callback The callback
 */
function doSendUpdateContext(request, contextElements, updateAction, callback) {
  var payload = {
    contextElements: contextElements,
    updateAction: updateAction
  };

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
  if (caConfig.CA_MODE === caConfig.MODES.CONTEXT_PROVIDER) {
    contextElements[0].attributes.push(
      {
        name: caConfig.BUTTON_ENTITY.IOTA_OPERATION_RESULT_ATTR_NAME,
        type: caConfig.ATTRIBUTE_TYPE.STRING,
        value: caHelper.encodeResponse(JSON.stringify(getResult(null, response)))
      }
    );
  }
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
          value: caHelper.encodeResponse(JSON.stringify(getResult(null, response)))
        }
      ]
    }
  ];

  if (request.contextAdapter.operationDescriptor.interactionType ===
    caConfig.BUTTON_ENTITY.INTERACTION_TYPES.SYNCHRONOUS) {
    // Synchronous button request
    setSynchronousButtonAttributes(contextElements, response);
    caLogger.debug(
      request.contextAdapter.context,
      'Notifying the Context Broker that the request has been completed...');
    doSendUpdateContext(request, contextElements, caConfig.UPDATE_ACTIONS.UPDATE, callback);
  } else if (request.contextAdapter.operationDescriptor.interactionType ===
    caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) {
    // Asynchronous button request
    caLogger.debug(
      request.contextAdapter.context,
      'Notifying the Context Broker that the request has been completed...');
    doSendUpdateContext(request, contextElements, caConfig.UPDATE_ACTIONS.UPDATE, callback);
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
          value: caHelper.encodeResponse(JSON.stringify(getResult(null, thirdPartyUpdateRequest)))
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
      caLogger.debug(
        thirdPartyUpdateRequest.contextAdapter.context,
        'Notifying the Context Broker that the request has been completed...');
      doSendUpdateContext(thirdPartyUpdateRequest, contextElements, caConfig.UPDATE_ACTIONS.UPDATE, callback);
    } else if (interactionType === caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) {
      // Synchronous button request
      caLogger.debug(
        thirdPartyUpdateRequest.contextAdapter.context,
        'Notifying the Context Broker that the request has been completed...');
      doSendUpdateContext(thirdPartyUpdateRequest, contextElements, caConfig.UPDATE_ACTIONS.UPDATE, callback);
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
 * @param {request} request The received request
 * @param {function} callback Callback to be called informing of any errors or returning
 *  the result of the notification
 */
function notifyOperationClosed(err, request, callback) {
  if (request && request.contextAdapter && request.contextAdapter.operationDescriptor) {
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
              name: caConfig.BUTTON_ENTITY.OPERATION_RESULT_ATTR_NAME,
              type: caConfig.ATTRIBUTE_TYPE.STRING,
              value: caHelper.encodeResponse(JSON.stringify(getResult(err)))
            }
          ]
        }
      ],
      updateAction: 'UPDATE'
    };

    if (caConfig.CA_MODE === caConfig.MODES.CONTEXT_PROVIDER) {
      payload.contextElements[0].attributes.push(
        {
          name: caConfig.BUTTON_ENTITY.IOTA_OPERATION_STATUS_ATTR_NAME,
          type: caConfig.ATTRIBUTE_TYPE.STRING,
          value: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED
        },
        {
          name: caConfig.BUTTON_ENTITY.IOTA_OPERATION_RESULT_ATTR_NAME,
          type: caConfig.ATTRIBUTE_TYPE.STRING,
          value: caHelper.encodeResponse(JSON.stringify(getResult(err)))
        }
      );
    }

    caLogger.debug(
      request.contextAdapter.context,
      'Notifying the Context Broker that the request has been completed...');

    sendUpdateContext(
      request.headers['fiware-service'],
      request.headers['fiware-servicepath'],
      payload,
      callback
    );
  }
}

/**
 * Returns the NGSI response for a request based on the
 *  request itself and on the existence of any error during its processing
 * @param {object} err The error when processing the request, if any
 * @param {object} request The updateContext request
 * @return {object} The composed response
 */
function getNGSIResponse(err, request) {
  var response = {
    contextResponses: []
  };
  var statusCode;

  if (err) {
    statusCode = {
      code: '400',
      reasonPhrase: caHelper.encodeResponse((err.code || err.name) + ' - ' + err.message)
    };
  } else {
    statusCode = {
      code: '200',
      reasonPhrase: 'OK'
    };
  }

  if (request.payload && request.payload.contextElements) {
    // The request is an updateContext request including contextElements
    request.payload.contextElements.forEach(function(contextElement) {
      var entry = {
        contextElement: contextElement,
        statusCode: statusCode
      };
      response.contextResponses.push(entry);
    });
  } else if (request.payload && request.payload.contextResponses) {
    // The request is an notification request including contextResponses
    request.payload.contextResponses.forEach(function(contextResponse) {
      var entry = {
        contextElement: contextResponse.contextElement,
        statusCode: statusCode
      };
      response.contextResponses.push(entry);
    });
  } else {
    response.statusCode = statusCode;
  }
  return response;
}

/**
 * Returns the NGSI response for an queryContext request based on the request itself
 * @param {object} request The queryContext request
 * @return {object} The composed response
 */
function getQueryContextNGSIResponse(request) {
  var contextElement;
  var response = {
    contextResponses: []
  };

  if (request.payload && request.payload.entities) {
    request.payload.entities.forEach(function(entity) {
      if (entity.type === caConfig.BUTTON_ENTITY.TYPE) {
        contextElement = entity;
        contextElement.attributes = [];
      }
      response.contextResponses.push({
        contextElement: contextElement,
        statusCode: {
          code: '200',
          reasonPhrase: 'OK'
        }
      });
    });
  } else {
    response.contextResponses.push({
      code: '400',
      reasonPhrase: 'Bad Request'
    });
  }
  return response;
}

/**
 * Returns an array of cell id descriptors from a request
 * @param request The geolocation update request
 * @return {array} The cell id descriptors array
 */
function getCellIdDescriptors(request) {
  request.contextAdapter.cellIdDescriptors = [];
  if (request && request.payload && request.payload.contextResponses &&
    Array.isArray(request.payload.contextResponses)) {
    request.payload.contextResponses.forEach(function(contextResponse) {
      if (contextResponse.contextElement) {
        var p1Attr = caHelper.getAttribute(contextResponse.contextElement.attributes,
          caConfig.DEVICE_ENTITY.P1_ATTR_NAME);
        if (p1Attr) {
          var p1Value = p1Attr.value;
          var cellIdDescriptor = {};
          if (p1Value) {
            cellIdDescriptor.id = contextResponse.contextElement.id;
            cellIdDescriptor.type = contextResponse.contextElement.type;
            cellIdDescriptor.isPattern = contextResponse.contextElement.isPattern;
            cellIdDescriptor.cellId = caHelper.getAttributeValue(p1Value, caConfig.DEVICE_ENTITY.P1_VALUES.CELL_ID);
            cellIdDescriptor.lac = caHelper.getAttributeValue(p1Value, caConfig.DEVICE_ENTITY.P1_VALUES.LAC);
            cellIdDescriptor.mcc = caHelper.getAttributeValue(p1Value, caConfig.DEVICE_ENTITY.P1_VALUES.MCC);
            cellIdDescriptor.mnc = caHelper.getAttributeValue(p1Value, caConfig.DEVICE_ENTITY.P1_VALUES.MNC);
            cellIdDescriptor.timestamp = caHelper.getAttributeTimestamp(p1Attr, new Date()).toISOString();
            request.contextAdapter.cellIdDescriptors.push(cellIdDescriptor);
          }
        }
      }
    });
  }
  return request.contextAdapter.cellIdDescriptors;
}

/**
 * Gets the geolocation from the geolocation service
 * @param request The original received request
 * @param cellIdDescriptor The cell id descriptor
 * @param callback The callback to notify when a response is received from the geolocation service
 */
function getGeolocation(request, cellIdDescriptor, callback) {
  var requestOptions = {
    method: 'POST',
    uri: 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + caConfig.GOOGLE_MAPS_GEOLOCATION_API_KEY,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    json: true,
    body: {
      cellTowers: [
        {
          cellId: parseInt(cellIdDescriptor.cellId, 16),
          locationAreaCode: parseInt(cellIdDescriptor.lac, 16),
          mobileCountryCode: parseInt(cellIdDescriptor.mcc, 16),
          mobileNetworkCode: parseInt(cellIdDescriptor.mnc, 16)
        }
      ]
    }
  };
  caLogger.debug(
    request.contextAdapter.context,
    'Sending POST request to the geolocation service at: ' +
    requestOptions.uri + ' with headers: ' +
    JSON.stringify(requestOptions.headers) +
    ' and payload: ' + JSON.stringify(requestOptions.body)
  );
  requestSender(requestOptions, callback);
}

/**
 * Sends an updateContext request to the Context Broker updating the device geolocation
 * @param request The original request
 * @param cellIdDescriptor The cell id descriptor whose geolocation has been retrieved
 * @param response The response received from the geolocation service
 * @param callback The callback
 * @return {*} Returns nothing
 */
function updateGeolocation(request, cellIdDescriptor, response, callback) {
  var contextElements = [
    {
      id: cellIdDescriptor.id,
      type: cellIdDescriptor.type,
      isPattern: cellIdDescriptor.isPattern,
      attributes: [
        {
          name: caConfig.DEVICE_ENTITY.POSITION_ATTR_NAME,
          type: caConfig.DEVICE_ENTITY.POSITION_ATTR_TYPE,
          value: response.body.location.lat + ', ' + response.body.location.lng,
          metadatas: [
            {
              name: caConfig.DEVICE_ENTITY.LOCATION_METADATA_NAME,
              type: caConfig.DEVICE_ENTITY.LOCATION_METADATA_TYPE,
              value: caConfig.DEVICE_ENTITY.LOCATION_METADATA_VALUE
            },
            {
              name: caConfig.DEVICE_ENTITY.TIMEINSTANT_METADATA_NAME,
              type: caConfig.DEVICE_ENTITY.TIMEINSTANT_METADATA_TYPE,
              value: cellIdDescriptor.timestamp
            },
            {
              name: caConfig.DEVICE_ENTITY.ACCURACY_METADATA_NAME,
              type: caConfig.DEVICE_ENTITY.ACCURACY_METADATA_TYPE,
              value: response.body.accuracy
            }
          ]
        }
      ]
    }
  ];
  doSendUpdateContext(request, contextElements, caConfig.UPDATE_ACTIONS.APPEND, callback);
}

module.exports = {
  isPollingUpdateContext: isPollingUpdateContext,
  getOperationDescriptor: getOperationDescriptor,
  getServiceDescriptor: getServiceDescriptor,
  sendThirdPartyRequest: sendThirdPartyRequest,
  notifyOperationCompletedAsync: notifyOperationCompletedAsync,
  notifyOperationCompletedSync: notifyOperationCompletedSync,
  notifyOperationClosed: notifyOperationClosed,
  getNGSIResponse: getNGSIResponse,
  getQueryContextNGSIResponse: getQueryContextNGSIResponse,
  getCellIdDescriptors: getCellIdDescriptors,
  getGeolocation: getGeolocation,
  updateGeolocation: updateGeolocation
};
