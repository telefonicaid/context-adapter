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
var nock = require('nock');

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
            name: caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME,
            type: 'string',
            value: '<service-id>'
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
            value: '<aux-op-status>'
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
        for (var i = 0; i < options.contextElements.attributes.length; i++) {
          caHelper.removeAttribute(
            payload.contextElements[0].attributes,
            options.contextElements.attributes[i]);
        }
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
function getRequestOptions(options) {
  options = options || {};
  var requestOptions = {
    uri: options.uri || 'http://' + caConfig.CA_HOST + ':' + caConfig.CA_PORT +
    caConfig.CA_PATH + '/updateContext',
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
  return requestOptions;
}

/**
 * Nocks the Context Broker
 * @param {Object} options Object to configure the behavior of the Context Broker. For example,
 *  an options object such as:
 *    {
 *      allowUnmocked: true,
 *      replyQueryContextWithError|replyQueryContextWithNGSICode|replyQueryContextWithServiceDescriptor: true,
 *      statusNotification: {
 *        status: 'closed',
 *        resultPrefix: '0'
 *      }
 *    }
 *  will make the nocked Context Broker to allow unmocked operations, to reply with an error, an NGSI error or
 *  a valid service description (depending on the selected option) and will expect status notification for the
 *  provided status and result prefix
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
  } else if (options.replyQueryContextWithServiceDescriptor) {
    contextBroker.post(
      caConfig.CB_PATH + '/queryContext'
    ).reply(function() {
        return [
          200,
          JSON.stringify(options.replyQueryContextWithServiceDescriptor)
        ];
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
        if (options.statusNotification.resultPrefix) {
          // The updateContext request should include a operation result attribute
          //  starting with '0'
          expect(caHelper.getAttributeValue(
            JSON.parse(requestBody).contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.OPERATION_RESULT_ATTR_NAME).indexOf(
            options.statusNotification.resultPrefix)).to.equal(0);
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
}

/**
 * Properties and functions exported by the module
 * @type {{server, startup: startup, exitGracefully: exitGracefully}}
 */
module.exports = {
  getUpdateContextPayload: getUpdateContextPayload,
  getServiceDescriptorResponse: getServiceDescriptorResponse,
  getRequestOptions: getRequestOptions,
  nockContextBroker: nockContextBroker
};
