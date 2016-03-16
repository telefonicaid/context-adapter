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

var caConfig = require('../../lib/context_adapter_configuration');
var caHelper = require('../../lib/context_adapter_helper');
var caTestConfig = require('../../test/unit/context_adapter_test_configuration');
var nock = require('nock');
var request = require('request');

/**
 * Apply the attribute options passed to a request generation process
 * @param contextElement The contextElement object being generated
 * @param attributes The attribute options
 */
function applyAttributeOptions(contextElement, attributes) {
  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].value) {
      caHelper.setAttribute(
        contextElement.attributes[i],
        attributes[i].name,
        attributes[i].value
      );
    } else {
      caHelper.removeAttribute(
        contextElement.attributes,
        attributes[i].name);
    }
  }
}

/**
 * Returns a valid and well-formed or invalid and not well-formed
 *  updateContext request depending on the options passed
 * @param {object} options Object including the properties which should
 *  be excluded from the final returned payload. For example, if options is:
 *  {
   *    contextElements: {
   *      id: false,
   *      isPattern: false,
   *      attributes: [
   *        caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME
   *      ]
   *    },
   *    updateAction: false
   *  }
 *  the returned payload will not include an id, isPattern properties or
 *  the specified attributes in the contextElements entry, or an updateAction
 *  property.
 * @return {object} The updateContext request payload
 */
function getUpdateContextPayload(options) {
  var payload = {
    contextElements: [
      {
        id: '<device-id>',
        type: caConfig.BUTTON_ENTITY.TYPE,
        isPattern: 'false',
        attributes: [
          {
            name: caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME,
            type: 'string',
            value: '<aux-interaction-type>'
          },
          {
            name: caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME,
            type: 'string',
            value: '<aux-service-id>'
          },
          {
            name: caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            type: 'string',
            value: '<aux-op-action>'
          },
          {
            name: caConfig.BUTTON_ENTITY.CA_OPERATION_EXTRA_ATTR_NAME,
            type: 'string',
            value: '<aux-op-extra>'
          },
          {
            name: caConfig.BUTTON_ENTITY.CA_OPERATION_STATUS_ATTR_NAME,
            type: 'string',
            value: caConfig.BUTTON_ENTITY.OPERATION_STATUS.PENDING
          }
        ]
      }
    ],
    updateAction: 'UPDATE'
  };
  if (options) {
    if (options.contextElements) {
      if (options.contextElements.id === false) {
        delete payload.contextElements[0].id;
      }
      if (options.contextElements.type === false) {
        delete payload.contextElements[0].type;
      }
      if (options.contextElements.isPattern === false) {
        delete payload.contextElements[0].isPattern;
      }
      if (options.contextElements.attributes && Array.isArray(options.contextElements.attributes)) {
        applyAttributeOptions(
          payload.contextElements[0],
          options.contextElements.attributes);
      }
    }
    if (options.updateAction === false) {
      delete payload.updateAction;
    }
  }
  return payload;
}

/**
 * Returns a valid and well-formed or invalid and not well-formed
 *  notification request depending on the options passed
 * @param {object} options Object including the properties which should
 *  be excluded from the final returned payload. For example, if options is:
 *  {
   *    contextElements: {
   *      id: false,
   *      isPattern: false,
   *      attributes: [
   *        caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME
   *      ]
   *    },
   *    updateAction: false
   *  }
 *  the returned payload will not include an id, isPattern properties or
 *  the specified attributes in the contextElements entry, or an updateAction
 *  property.
 * @return {object} The updateContext request payload
 */
function getNotificationPayload(options) {
  var payload = {
    contextResponses: [
      {
        contextElement: {
          id: '<device-id>',
          type: caConfig.BUTTON_ENTITY.TYPE,
          isPattern: 'false',
          attributes: [
            {
              name: caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME,
              type: 'string',
              value: '<aux-interaction-type>'
            },
            {
              name: caConfig.BUTTON_ENTITY.SERVICE_ID_ATTR_NAME,
              type: 'string',
              value: '<aux-service-id>'
            },
            {
              name: caConfig.BUTTON_ENTITY.OPERATION_ACTION_ATTR_NAME,
              type: 'string',
              value: '<aux-op-action>'
            },
            {
              name: caConfig.BUTTON_ENTITY.OPERATION_EXTRA_ATTR_NAME,
              type: 'string',
              value: '<aux-op-extra>'
            },
            {
              name: caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME,
              type: 'string',
              value: caConfig.BUTTON_ENTITY.OPERATION_STATUS.PENDING
            }
          ]
        },
        statusCode: {
          code: '200',
          reasonPhrase: 'OK'
        }
      }
    ]
  };
  if (options && options.contextResponses && options.contextResponses.length) {
    if (options.contextResponses[0].contextElement) {
      if (options.contextResponses[0].contextElement.id === false) {
        delete payload.contextResponses[0].contextElement.id;
      }
      if (options.contextResponses[0].contextElement.type === false) {
        delete payload.contextResponses[0].contextElement.type;
      }
      if (options.contextResponses[0].contextElement.isPattern === false) {
        delete payload.contextResponses[0].contextElement.isPattern;
      }
      if (options.contextResponses[0].contextElement.attributes &&
        Array.isArray(options.contextResponses[0].contextElement.attributes)) {
        applyAttributeOptions(
          payload.contextResponses[0].contextElement,
          options.contextResponses[0].contextElement.attributes);
      }
    }
    if (options.contextResponses[0].statusCode) {
      if (options.contextResponses[0].statusCode.code === false) {
        delete payload.contextResponses[0].statusCode.code;
      }
      if (options.contextResponses[0].statusCode.reasonPhrase === false) {
        delete payload.contextResponses[0].statusCode.reasonPhrase;
      }
    }
  }
  return payload;
}

/**
 * Returns a valid and well-formed or invalid and not well-formed
 *  button descriptor response to a previous queryContext request
 *  depending on the options passed
 * @param {object} options Object including the properties which should
 *  be excluded from the final returned payload. For example, if options is:
 *  {
   *    contextResponses: {
   *      contextElement: {
   *        id: false,
   *        isPattern: false,
   *        attributes: [
   *          caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME
   *          caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME
   *        ]
   *      }
   *      statusCode: {
   *        code: true
   *      }
   *    }
   *  }
 *  the returned response will not include an id, isPattern properties or
 *  the specified attributes in the contextElement entry, or the statusCode's
 *  code property
 * @return {object} The button descriptor response
 */
function getButtonDescriptorResponse(options) {
  var response = {
    contextResponses: [
      {
        contextElement: {
          id: '<button-id>',
          type: caConfig.BUTTON_ENTITY.TYPE,
          isPattern: 'false',
          attributes: [
            {
              name: caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME,
              type: 'string',
              value: '<interaction-type>'
            }
          ]
        },
        statusCode: {
          code: '200',
          reasonPhrase: 'OK'
        }
      }
    ]
  };

  /**
   * Processes the attributes configuration options passed
   */
  function processAttributes() {
    for (var i = 0; i < options.contextResponses.contextElement.attributes.length; i++) {
      caHelper.removeAttribute(
        response.contextResponses[0].contextElement.attributes,
        options.contextResponses.contextElement.attributes[i]
      );
    }
  }

  if (options) {
    if (options.contextResponses) {
      if (options.contextResponses.contextElement) {
        if (options.contextResponses.contextElement.id === false) {
          delete response.contextResponses[0].contextElement.id;
        }
        if (options.contextResponses.contextElement.type === false) {
          delete response.contextResponses[0].contextElement.type;
        }
        if (options.contextResponses.contextElement.isPattern === false) {
          delete response.contextResponses[0].contextElement.isPattern;
        }
        if (options.contextResponses.contextElement.attributes &&
          Array.isArray(options.contextResponses.contextElement.attributes)) {
          processAttributes();
        }
      }
      if (options.contextResponses.statusCode) {
        if (options.contextResponses.statusCode.code === false) {
          delete response.contextResponses[0].statusCode.code;
        }
        if (options.contextResponses.statusCode.reasonPhrase === false) {
          delete response.contextResponses[0].statusCode.reasonPhrase;
        }
      }
    }
  }
  return response;
}

/**
 * Returns a valid and well-formed or invalid and not well-formed
 *  service descriptor response to a previous queryContext request
 *  depending on the options passed
 * @param {object} options Object including the properties which should
 *  be excluded from the final returned payload. For example, if options is:
 *  {
   *    contextResponses: {
   *      contextElement: {
   *        id: false,
   *        isPattern: false,
   *        attributes: [
   *          caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME
   *          caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME
   *        ]
   *      }
   *      statusCode: {
   *        code: true
   *      }
   *    }
   *  }
 *  the returned response will not include an id, isPattern properties or
 *  the specified attributes in the contextElement entry, or the statusCode's
 *  code property
 * @return {object} The service descriptor response
 */
function getServiceDescriptorResponse(options) {
  var response = {
    contextResponses: [
      {
        contextElement: {
          id: '<service-id>',
          type: caConfig.SERVICE_ENTITY.TYPE,
          isPattern: 'false',
          attributes: [
            {
              name: caConfig.SERVICE_ENTITY.PROVIDER_ATTR_NAME,
              type: 'string',
              value: '<provider>'
            },
            {
              name: caConfig.SERVICE_ENTITY.INTERACTION_TYPE_ATTR_NAME,
              type: 'string',
              value: '<interaction-type>'
            },
            {
              name: caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
              type: 'string',
              value: '<endpoint>'
            },
            {
              name: caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
              type: 'string',
              value: '<method>'
            },
            {
              name: caConfig.SERVICE_ENTITY.AUTHENTICATION_ATTR_NAME,
              type: 'string',
              value: '<authentication>'
            },
            {
              name: caConfig.SERVICE_ENTITY.MAPPING_ATTR_NAME,
              type: 'string',
              value: '<mapping>'
            },
            {
              name: caConfig.SERVICE_ENTITY.TIMEOUT_ATTR_NAME,
              type: 'string',
              value: '<timeout>'
            }
          ]
        },
        statusCode: {
          code: '200',
          reasonPhrase: 'OK'
        }
      }
    ]
  };

  /**
   * Processes the attributes configuration options passed
   */
  function processAttributes() {
    for (var i = 0; i < options.contextResponses.contextElement.attributes.length; i++) {
      caHelper.removeAttribute(
        response.contextResponses[0].contextElement.attributes,
        options.contextResponses.contextElement.attributes[i]
      );
    }
  }

  if (options) {
    if (options.contextResponses) {
      if (options.contextResponses.contextElement) {
        if (options.contextResponses.contextElement.id === false) {
          delete response.contextResponses[0].contextElement.id;
        }
        if (options.contextResponses.contextElement.type === false) {
          delete response.contextResponses[0].contextElement.type;
        }
        if (options.contextResponses.contextElement.isPattern === false) {
          delete response.contextResponses[0].contextElement.isPattern;
        }
        if (options.contextResponses.contextElement.attributes &&
          Array.isArray(options.contextResponses.contextElement.attributes)) {
          processAttributes();
        }
      }
      if (options.contextResponses.statusCode) {
        if (options.contextResponses.statusCode.code === false) {
          delete response.contextResponses[0].statusCode.code;
        }
        if (options.contextResponses.statusCode.reasonPhrase === false) {
          delete response.contextResponses[0].statusCode.reasonPhrase;
        }
      }
    }
  }
  return response;
}

/**
 * Returns a request options object to be passed to the request module
 * @param {object} options Object including configuration options to apply to
 *  the generated updateContext request. For example, if options is:
 *  {
   *    uri: 'http://domain.com/path',
   *    method: 'GET',
   *    headers: ['Fiware-Service']
   *    },
 *    body: { ... }
 *  }
 *  the returned updateContext request will include the passed uri, 'GET' as HTTP method
 *  and will not include the 'Fiware-Service ' header
 *  @return {object} The request module options
 */
function getBlackButtonRequestOptions(type, options) {
  options = options || {};

  var requestOptions = {
    uri: options.uri || 'http://' + caConfig.CA_HOST + ':' + caConfig.CA_PORT +
      caConfig.CA_PATH,
    method: options.method || 'POST',
    headers: {
      'Fiware-Service': caConfig.DEFAULT_SERVICE,
      'Fiware-ServicePath': caConfig.DEFAULT_SERVICE_PATH
    },
    json: true,
    body: options.body || {}
  };
  if (options.headers) {
    options.headers.forEach(function(header) {
      delete requestOptions.headers[header];
    });
  }

  switch(type) {
    case caTestConfig.API_OPERATION.NOTIFY:
      requestOptions.uri += caConfig.CA_ROUTE_SUFFIXES.UPDATE_CONTEXT;
      break;
    case caTestConfig.API_OPERATION.ADMIN.SET_LOG_LEVEL:
      requestOptions.uri = 'http://' + caConfig.CA_HOST + ':' + caConfig.CA_PORT +
        caConfig.CA_ROUTE_SUFFIXES.ADMIN_SET_LOG_LEVEL;
      if (options.level) {
        requestOptions.qs = {
          level: options.level
        };
      }
      delete requestOptions.headers;
      delete requestOptions.json;
      delete requestOptions.body;
      break;
  }
  return requestOptions;
}

/**
 * Nocks the Context Broker
 * @param {Object} options Object to configure the behavior of the Context Broker. For example,
 *  an options object such as:
 *    {
 *      allowUnmocked: true,
 *      replyQueryContextWithError|replyQueryContextWithNGSICode: true,
 *      replyQueryContextWithData: {
 *        serviceDescriptor: theServiceDescriptor,
 *        buttonDescriptor: theButtonDescriptor
 *      },
 *      statusNotification: {
 *        status: 'closed',
 *        result: {
 *          code: '200'
 *        }
 *      },
 *      updateGeolocationNotification: true
 *  will make the nocked Context Broker to allow unmocked operations, to reply with an error, an NGSI error or
 *  a valid service description (depending on the selected option) and will expect status notification for the
 *  provided status and result prefix or geolocation coordinates
 * @param {Function} done The done() function to notify the unit tests as concluded
 */
function nockContextBroker(options, done) {
  options = options || {};

  var contextBroker, nockOptions;

  if (options.allowUnmocked) {
    // Including the allowUnmocked option will make nock not to respond to unmocked requests and
    //  consequently a ECONNREFUSED will be received by the Context Adapter for queryContext requests
    //  if they are not nocked
    nockOptions = {
      allowUnmocked: true
    };
  }

  contextBroker = nock(
    'http://' + caConfig.CB_HOST + ':' + caConfig.CB_PORT,
    nockOptions
  );

  if (options.replyQueryContextWithError) {
    contextBroker.post(
      caConfig.CB_PATH + '/queryContext'
    ).replyWithError(
      {
        code: 'THE_ERROR_CODE',
        message: 'THE MESSAGE'
      }
    );
  } else if (options.replyQueryContextWithNGSICode) {
    contextBroker.post(
      caConfig.CB_PATH + '/queryContext'
    ).reply(function() {
        return [
          200,
          JSON.stringify(
            {
              errorCode: {
                code: '404',
                reasonPhrase: 'No context elements found'
              }
            }
          )
        ];
      }
    );
  } else if (options.replyQueryContextWithData) {
    contextBroker.post(
      caConfig.CB_PATH + '/queryContext'
    ).reply(function(uri, requestBody) {
        var requestBodyObj = JSON.parse(requestBody);
        if (requestBodyObj.entities[0].type === caConfig.BUTTON_ENTITY.TYPE) {
          return [
            200,
            options.replyQueryContextWithData.buttonDescriptor
          ];
        } else if (requestBodyObj.entities[0].type === caConfig.SERVICE_ENTITY.TYPE) {
          return [
            200,
            options.replyQueryContextWithData.serviceDescriptor
          ];
        }
      }
    );
  }

  // Nock the Context Broker to listen for status notifications via an
  //  updateContext request
  if (options.statusNotification) {
    contextBroker.post(
      caConfig.CB_PATH + '/updateContext'
    ).reply(function(uri, requestBody) {
        // The updateContext request should include a operation status attribute set
        //  to closed
        if (options.statusNotification.status) {
          expect(caHelper.getAttributeValue(
            JSON.parse(requestBody).contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME)).to.equal(
            options.statusNotification.status
          );
        }
        if (options.statusNotification.result) {
          // The updateContext request should include a operation result attribute
          //  starting with '0'
          expect(JSON.parse(caHelper.decodeResponse(caHelper.getAttributeValue(
            JSON.parse(requestBody).contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.OPERATION_RESULT_ATTR_NAME))).code).to.equal(options.statusNotification.result.code);
        }
        if (options.statusNotification.attributes &&
          Array.isArray(options.statusNotification.attributes)) {
          options.statusNotification.attributes.forEach(function(attribute) {
            expect(caHelper.getAttributeValue(
              JSON.parse(requestBody).contextElements[0].attributes,
              attribute)).to.exist;
          });
        }
        if (done) {
          done();
        }
      }
    );
  }

  // Nock the Context Broker to listen for geolocation updates via an
  //  updateContext request
  if (options.updateGeolocationNotification) {
    contextBroker.post(
      caConfig.CB_PATH + '/updateContext'
    ).reply(function(uri, requestBody) {
        // The updateContext request must include a position attribute including
        //  a latitude and a longitude separated by a ','
        var positionAttr = caHelper.getAttribute(
          JSON.parse(requestBody).contextElements[0].attributes,
          caConfig.DEVICE_ENTITY.POSITION_ATTR_NAME
        );
        var positionValue = positionAttr.value;
        var positionArr = positionValue.split(',');
        expect(positionArr[0].trim()).to.be.equal(caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.RESPONSE.LATITUDE);
        expect(positionArr[1].trim()).to.be.equal(caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.RESPONSE.LONGITUDE);
        // The updateContext request must include a location metadata with value 'WGS84'
        expect(caHelper.getAttributeValue(positionAttr.metadatas, caConfig.DEVICE_ENTITY.LOCATION_METADATA_NAME)).
          to.equal(caConfig.DEVICE_ENTITY.LOCATION_METADATA_VALUE);
        // The updateContext request must include a TimeInstant metadata
        expect(caHelper.getAttributeValue(positionAttr.metadatas, caConfig.DEVICE_ENTITY.TIMEINSTANT_METADATA_NAME)).
          to.exist;
        // The updateContext request must include a accuracy metadata
        expect(caHelper.getAttributeValue(positionAttr.metadatas, caConfig.DEVICE_ENTITY.ACCURACY_METADATA_NAME)).
          to.equal(caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.RESPONSE.ACCURACY);
        if (done) {
          done();
        }
      }
    );
  }
}

/**
 * Returns a geolocation update request options object to be passed to the request module
 *  @return {object} The request module options
 */
function getGeolocationUpdateRequestOptions() {
  var requestOptions = {
    uri: 'http://' + caConfig.CA_HOST + ':' + caConfig.CA_PORT +
      caConfig.CA_PATH + caConfig.CA_ROUTE_SUFFIXES.NOTIFY_GEOLOCATION,
    method: 'POST',
    headers: {
      'Fiware-Service': caConfig.DEFAULT_SERVICE,
      'Fiware-ServicePath': caConfig.DEFAULT_SERVICE_PATH
    },
    json: true,
    body: {
      'subscriptionId' : '1234567890ABCDF123456789',
      'originator' : 'orion.contextBroker.instance',
      'contextResponses' : [
        {
          'contextElement' : {
            'attributes' : [
              {
                'name' : 'P1',
                'type' : 'compound',
                'value' : [
                  {
                    'name': 'mcc',
                    'type': 'string',
                    'value': '20A'
                  },
                  {
                    'name': 'mnc',
                    'type': 'string',
                    'value': 'B'
                  },
                  {
                    'name': 'lac',
                    'type': 'string',
                    'value': '6fba'
                  },
                  {
                    'name': 'cell-id',
                    'type': 'string',
                    'value': '1d31FFF'
                  }
                ],
                'metadatas' : [
                  {
                    'name': 'TimeInstant',
                    'type': 'ISO8601',
                    'value': '2015-07-20T09:55:04.028966Z'
                  }
                ]

              }
            ],
            'type': 'gdl',
            'isPattern': 'false',
            'id': 'device-01'
          },
          'statusCode': {
            'code': '200',
            'reasonPhrase': 'OK'
          }
        }
      ]
    }
  };
  return requestOptions;
}

/**
 * Nocks the Google Maps Geolocation API (https://developers.google.com/maps/documentation/geolocation/intro)
 */
function nockGoogleMapsGeolocationAPI() {
  var googleMapsGeolocationAPI = nock(
    'https://' + caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.URI.HOST
  );

  googleMapsGeolocationAPI.post(
    caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.URI.PATH + caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.URI.PARAMS
  ).reply(function() {
      return [
        200,
        JSON.stringify(
          {
            'location': {
              'lat': caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.RESPONSE.LATITUDE,
              'lng': caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.RESPONSE.LONGITUDE
            },
            'accuracy': caTestConfig.GOOGLE_MAPS_GEOLOCATION_SERVICE.RESPONSE.ACCURACY
          }
        )
      ];
    }
  );
}

/**
 * Main test suite covering the Context Adapter operation
 * @param payload The payload received by the Context Adapter
 * @param serviceDescriptorResponse The service descriptor queried to the Context Broker
 * @param endpointDomain The endpoint domain where the Third Party is listening
 * @param endpointPath The endpoint path where the Third Party is listening
 * @param method The method to be used in the requests sent to the Third Party
 */
function operationTestSuite(payload, interactionType) {
  // Generate a service descriptor response having 'http://thirdparty.com/service' as endpoint and
  //  'GET' as method
  var endpointDomain = 'http://thirdparty.com',
    endpointPath = '/service',
    method = 'GET';
  var serviceDescriptorResponse = getServiceDescriptorResponse();

  beforeEach(function() {
    caHelper.setAttribute(
      serviceDescriptorResponse.contextResponses[0].contextElement.attributes,
      caConfig.SERVICE_ENTITY.INTERACTION_TYPE_ATTR_NAME,
      interactionType
    );
    caHelper.setAttribute(
      serviceDescriptorResponse.contextResponses[0].contextElement.attributes,
      caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
      endpointDomain + endpointPath
    );
    caHelper.setAttribute(
      serviceDescriptorResponse.contextResponses[0].contextElement.attributes,
      caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
      method);
  });

  it('should respond with a 200 code and \'OK\' reasonPhrase if valid payload',
    function(done) {
      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
          done();
        }
      );
    });

  it('should notify the request as \'closed\' if no Context Broker available to serve service information',
    function(done) {
      nockContextBroker(
        {
          allowUnmocked: true,
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if an error occured when retrieving service information ' +
    'from the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithError: true,
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no service information available in the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithNGSICode: true,
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no id in the service descriptor response received from ' +
    'the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    id: false
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no type in the service descriptor response received from ' +
    'the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    type: false
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no isPattern in the service descriptor response received from ' +
    'the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    isPattern: false
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no provider in the service descriptor response received from ' +
    'the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    attributes: [caConfig.SERVICE_ENTITY.PROVIDER_ATTR_NAME]
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no interaction_type in the service descriptor response received ' +
    'from the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    attributes: [caConfig.SERVICE_ENTITY.INTERACTION_TYPE_ATTR_NAME]
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no endpoint in the service descriptor response received from ' +
    'the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    attributes: [caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME]
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no method in the service descriptor response received from ' +
    'the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    attributes: [caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME]
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no authentication in the service descriptor response received ' +
    'from the Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    attributes: [caConfig.SERVICE_ENTITY.AUTHENTICATION_ATTR_NAME]
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no mapping in the service descriptor response received from the ' +
    'Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    attributes: [caConfig.SERVICE_ENTITY.MAPPING_ATTR_NAME]
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if no timeout in the service descriptor response received from the ' +
    'Context Broker',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: getServiceDescriptorResponse(
              {
                contextResponses: {
                  contextElement: {
                    attributes: [caConfig.SERVICE_ENTITY.TIMEOUT_ATTR_NAME]
                  }
                }
              }
            )
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should send a ' + interactionType + ' request to the third party if a valid service descriptor is retrieved ' +
    'and a ' + interactionType + ' operation is requested',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: serviceDescriptorResponse
          }
        }
      );

      // Nock the Third Party to listen for requests on the specified endpoint and for the
      //  method set
      nock(endpointDomain).
        intercept(endpointPath, method).
        reply(function() {
          done();
        });

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'closed\' if the third party responds with an error to the ' +
      interactionType + ' request',
    function(done) {
      nockContextBroker(
        {
          replyQueryContextWithData: {
            serviceDescriptor: serviceDescriptorResponse
          },
          statusNotification: {
            status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
            result: {
              code: caConfig.RESULT_CODES.ERROR
            }
          }
        },
        done
      );

      // Nock the Third Party to listen for requests on the specified endpoint and for the
      //  method set and respond with an error
      nock(endpointDomain).
        intercept(endpointPath, method).
        replyWithError(
        {
          code: 'THE_ERROR_CODE',
          message: 'THE MESSAGE'
        }
      );

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the request as \'completed\' if the third party responds successfully to the ' +
      interactionType + ' request (only applies to synchronous third party services)',
    function(done) {
      if (interactionType === caConfig.SERVICE_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) {
        return done();
      }

      var nockContextBrokerOptions = {
        replyQueryContextWithData: {
          serviceDescriptor: serviceDescriptorResponse
        },
        statusNotification: {
          result: {
            code: caConfig.RESULT_CODES.SUCCESS
          }
        }
      };

      if (payload &&
        ((payload.contextElements && payload.contextElements[0] &&
          payload.contextElements[0].attributes &&
          caHelper.getAttributeValue(
            payload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME
          ) === caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) ||
        (payload.contextResponses && payload.contextResponses[0].contextElement &&
          payload.contextResponses[0].contextElement &&
          payload.contextResponses[0].contextElement.attributes &&
          caHelper.getAttributeValue(
            payload.contextResponses[0].contextElement.attributes,
            caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME
          ) === caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS))) {
        nockContextBrokerOptions.statusNotification.status = caConfig.BUTTON_ENTITY.OPERATION_STATUS.COMPLETED;
      }

      nockContextBroker(
        nockContextBrokerOptions,
        done
      );

      // Nock the Third Party to listen for requests on the specified endpoint and for the
      //  method set and reply with no error
      nock(endpointDomain).
        intercept(endpointPath, method).
        reply(function(uri, requestBody) {
          return [200, JSON.stringify(
            {
              details: requestBody
            }
          )];
        });

      request(
        getBlackButtonRequestOptions(
          caTestConfig.API_OPERATION.NOTIFY,
          {
            body: payload
          }
        ),
        function(err, response, body) {
          // The Context Adapter should reply successfully to the request as
          //  soon as it validates it
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('200');
          expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
        }
      );
    }
  );

  it('should notify the ' + interactionType + ' request as \'completed\' if the third party sends a request ' +
      'to the Context Adapter callback url with the request\'s results ' +
      '(only applies to asynchronous third party services)', function(done) {
    if (interactionType === caConfig.SERVICE_ENTITY.INTERACTION_TYPES.SYNCHRONOUS) {
      return done();
    }

    var nockContextBrokerOptions = {
      replyQueryContextWithData: {
        serviceDescriptor: serviceDescriptorResponse
      },
      statusNotification: {
        result: {
          code: caConfig.RESULT_CODES.SUCCESS
        }
      }
    };

    if (payload &&
      ((payload.contextElements && payload.contextElements[0] &&
        payload.contextElements[0].attributes &&
        caHelper.getAttributeValue(
          payload.contextElements[0].attributes,
          caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME
        ) === caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) ||
      (payload.contextResponses && payload.contextResponses[0] &&
      payload.contextResponses[0].contextElement.attributes &&
      caHelper.getAttributeValue(
        payload.contextResponses[0].contextElement.attributes,
        caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME
      ) === caConfig.BUTTON_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS))) {
      nockContextBrokerOptions.statusNotification.status = caConfig.BUTTON_ENTITY.OPERATION_STATUS.COMPLETED;
    }

    var finalButtonDescriptor = getButtonDescriptorResponse();
    if (payload && payload.contextElements && payload.contextElements[0] && payload.contextElements[0].attributes) {
      caHelper.setAttribute(
        finalButtonDescriptor.contextResponses[0].contextElement.attributes,
        caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME,
        caHelper.getAttributeValue(
          payload.contextElements[0].attributes,
          caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME
        )
      );
    } else {
      caHelper.setAttribute(
        finalButtonDescriptor.contextResponses[0].contextElement.attributes,
        caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME,
        caHelper.getAttributeValue(
          payload.contextResponses[0].contextElement.attributes,
          caConfig.BUTTON_ENTITY.INTERACTION_TYPE_ATTR_NAME
        )
      );
    }

    if (interactionType === caConfig.SERVICE_ENTITY.INTERACTION_TYPES.ASYNCHRONOUS) {
      nockContextBrokerOptions.replyQueryContextWithData.buttonDescriptor = finalButtonDescriptor;
    }

    nockContextBroker(
      nockContextBrokerOptions,
      done
    );

    request(
      getBlackButtonRequestOptions(
        null,
        {
          uri: 'http://' + caConfig.CA_HOST + ':' + caConfig.CA_PORT +
            caConfig.CA_PATH + caConfig.CA_CALLBACK_PATH,
          body: {
            buttonId: '<button-id>',
            externalId: '<external-id>',
            details: {
              key1: 'value1',
              key2: 'value2',
              key3: 'value3',
              key4: 'value4',
              key5: 'value'
            }
          }
        }
      ), function(err, response) {
        expect(err).to.equal(null);
        expect(response.statusCode).to.equal(200);
      }
    );
  });
}

/**
 * Main test suite covering the Context Adapter geolocation update operation
 */
function geolocationUpdateTestSuite() {
  it('should update the geolocation coordinates in the Context Broker', function(done) {
    nockGoogleMapsGeolocationAPI();

    nockContextBroker(
      {
        updateGeolocationNotification: true
      },
      done
    );

    request(
      getGeolocationUpdateRequestOptions(),
      function(err, response, body) {
        // The Context Adapter should reply successfully to the request as
        //  soon as it receives it
        expect(err).to.equal(null);
        expect(response.statusCode).to.equal(200);
        expect(body.contextResponses[0].statusCode.code).to.equal('200');
        expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');

        // Cell data must be valid hexadecimal numbers
        var p1Value = caHelper.getAttributeValue(
          body.contextResponses[0].contextElement.attributes,
          caConfig.DEVICE_ENTITY.P1_ATTR_NAME);
        var hexRegExp = /[0-9A-F]+/i;
        expect(caHelper.getAttributeValue(
          p1Value,
          caConfig.DEVICE_ENTITY.P1_VALUES.CELL_ID
        ).match(hexRegExp));
        expect(caHelper.getAttributeValue(
          p1Value,
          caConfig.DEVICE_ENTITY.P1_VALUES.LAC
        ).match(hexRegExp));
        expect(caHelper.getAttributeValue(
          p1Value,
          caConfig.DEVICE_ENTITY.P1_VALUES.MCC
        ).match(hexRegExp));
        expect(caHelper.getAttributeValue(
          p1Value,
          caConfig.DEVICE_ENTITY.P1_VALUES.MNC
        ).match(hexRegExp));
      }
    );
  });
}

/**
 * Valid log level test
 * @param level The log level
 * @param done The done() function
 */
function validLogLevelChangeTest(level, done) {
  request(
    getBlackButtonRequestOptions(
      caTestConfig.API_OPERATION.ADMIN.SET_LOG_LEVEL,
      {
        level: level
      }
    ),
    function (err, response) {
      console.log(err);
      expect(err).to.equal(null);
      expect(response.statusCode).to.equal(200);
      expect(response.statusMessage).to.equal('OK');
      done();
    }
  );
}

/**
 * Properties and functions exported by the module
 * @type {{server, startup: startup, exitGracefully: exitGracefully}}
 */
module.exports = {
  getUpdateContextPayload: getUpdateContextPayload,
  getNotificationPayload: getNotificationPayload,
  getServiceDescriptorResponse: getServiceDescriptorResponse,
  getBlackButtonRequestOptions: getBlackButtonRequestOptions,
  operationTestSuite: operationTestSuite,
  geolocationUpdateTestSuite: geolocationUpdateTestSuite,
  validLogLevelChangeTest: validLogLevelChangeTest
};
