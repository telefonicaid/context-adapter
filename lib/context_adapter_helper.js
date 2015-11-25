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
    caPackage = require('../package.json');

/**
 * Generates a 32 bit integer hash code
 * @param {string} str The seed
 * @return {number} The hash code
 */
function getHashCode(str) {
  var hash = 0, i, chr, len;
  if (str && str.length === 0) {
    return hash;
  }
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Generates the UNICA correlator based on a request
 * @param {object} request The HTTP request
 * @return {string} The generated UNICA correlator
 */
function getUnicaCorrelator(request) {
  if (!request) {
    return caConfig.UNICA_CORRELATOR.NOT_AVAILABLE;
  } else {
    return getHashCode('from: ' + request.info.remoteAddress +
      ':' + request.info.remotePort +
      ', method: ' + request.method.toUpperCase() +
      ', url: ' + request.url.path);
  }
}

/**
 * Generates the transaction identifier to be used when for logging
 * @return {string} The generated transaction id
 */
function getTransactionId() {
  return new Date().getTime();
}

/**
 * Returns the value of certain attribute included in an attributes array
 * @param {Array} attributes The attributes array to be searched in
 * @param {string} attributeName The name of the attribute to search
 * @return {*} The attribute value, if any
 */
function getAttributeValue(attributes, attributeName) {
  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].name === attributeName) {
      return attributes[i].value;
    }
  }
}

/**
 * Removes an attribute from an attributes array
 * @param {Array} attributes The attributes array
 * @param {string} attributeName The name of the attribute to remove
 */
function removeAttribute(attributes, attributeName) {
  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].name === attributeName) {
      attributes.splice(i, 1);
    }
  }
}

/**
 * Updates the value of some attribute in an attributes array
 * @param {Array} attributes The attributes array
 * @param {string} attributeName The name of the attribute whose value should be updated
 * @param {number} newValue Thew new value to set
 */
function setAttribute(attributes, attributeName, newValue) {
  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].name === attributeName) {
      attributes[i].value = newValue;
    }
  }
}

/**
 * Returns the operation type for a concrete request to be used for logging
 * @param {object} request The request
 * @return {string} The operation type
 */
function getOperationType(request) {
  if (!request) {
    return caConfig.OPERATION_TYPE.SERVER_LOG;
  } else {
    return caConfig.OPERATION_TYPE_PREFIX + request.method.toUpperCase();
  }
}

/**
 * Returns version information about this concrete instance of the
 *  Context Adapter component
 * @return {object} A JSON-formatted object including the version information
 */
function getVersion() {
  var message = {};
  if (caPackage) {
    if (caPackage.version) {
      message.version = caPackage.version;
    }
  }
  if (Object.getOwnPropertyNames(message).length === 0) {
    message.version = 'No version information available';
  }
  return message;
}

/**
 * Indicates if certain attribute is included in an attributes array
 * @param {Array} attributes The attributes array
 * @param {string} attributeName The attribute name to find
 * @return {boolean} The result of the search
 */
function isAttributeIncluded(attributes, attributeName) {
  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].name && attributes[i].name === attributeName) {
      return true;
    }
  }
  return false;
}

/**
 * Validates the attribute values received
 * @param {object} context The context for logging
 * @param {string} entityType The entity type (Button or Service)
 * @param {Array} attributes The attributes array
 * @return {*} True if the attribute value is valid, false otherwise
 */
function isValidAttributeValues(context, entityType, attributes) {
  var interactionTypeAttrName,
    interactionTypes;
  if (entityType === caConfig.BUTTON_ENTITY.TYPE) {
    interactionTypeAttrName = caConfig.BUTTON_ENTITY.CA_INTERACTION_TYPE_ATTR_NAME;
    interactionTypes = caConfig.BUTTON_ENTITY.INTERACTION_TYPES;
  } else if (entityType === caConfig.SERVICE_ENTITY.TYPE) {
    interactionTypeAttrName = caConfig.SERVICE_ENTITY.INTERACTION_TYPE_ATTR_NAME;
    interactionTypes = caConfig.SERVICE_ENTITY.INTERACTION_TYPES;
  } else {
    caLogger.debug(
      context,
      'Invalid entity type when validating attribute values: ' + entityType
    );
    return false;
  }

  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].name === interactionTypeAttrName) {
      if (attributes[i].value !== interactionTypes.ASYNCHRONOUS &&
        attributes[i].value !== interactionTypes.SYNCHRONOUS) {
        caLogger.debug(
          context,
          'Invalid value for the interaction type attribute: ' + attributes[i].value
        );
        return false;
      }
    }
    // Using toString() to cover number and string cases
    if (!attributes[i].value || !attributes[i].value.toString().length || attributes[i].value.toString() === 'null') {
      caLogger.debug(
        context,
        'Invalid value for attribute \'' + attributes[i].name + '\': ' + attributes[i].value
      );
      return false;
    }
  }
  return true;
}

/**
 * Parses the errors array returned by the revalidation object
 * @param {Array} errors The errors array
 * @return {string} The parsed errors as a string
 */
function stringifyRevalidatorErrors(errors) {
  var errorsAsStr = '',
    counter = 0;
  errors.forEach(function(error) {
    counter++;
    if (counter > 1) {
      errorsAsStr += ', ';
    }
    errorsAsStr += error.property + ' ' + error.message;
  });
  return errorsAsStr;
}

/**
 * Encodes the response sent to the Context Broker so no forbidden characters are used
 *  The forbidden characters not allowed by the Context Broker are: < > " ' = ; ( )
 *  On the other hand, JSON does not allow \
 * @param str The string to be encoded
 * @return {string} The encoded string
 */
function encodeResponse(str) {
  return str.replace(/</g,'%3C').
  replace(/>/g, '%3E').
  replace(/"/g, '%22').
  replace(/'/g, '%27').
  replace(/=/g, '%3D').
  replace(/;/g, '%3B').
  replace(/\(/g, '%28').
  replace(/\)/g, '%29').
  replace(/\\/g, '%5C');
}

/**
 * Decodes the response sent to the Context Broker so no forbidden characters are used
 *  The forbidden characters not allowed by the Context Broker are: < > " ' = ; ( )
 *  On the other hand, JSON does not allow \
 * @param str The string to be decoded
 * @return {string} The decoded string
 */
function decodeResponse(str) {
  return str.replace(/%3C/g,'<').
  replace(/%3E/g, '>').
  replace(/%22/g, '"').
  replace(/%27/g, '\'').
  replace(/%3D/g, '=').
  replace(/%3B/g, ';').
  replace(/%28/g, '(').
  replace(/%29/g, ')').
  replace(/%5C/g, '\\');
}

/**
 * Properties and functions exported by the module
 * @type {{getUnicaCorrelator: getUnicaCorrelator, getTransactionId: getTransactionId,
 * getOperationType: getOperationType, getVersion: getVersion, getAttributeValue: getAttributeValue,
 * setAttribute: setAttribute, removeAttribute: removeAttribute}}
 */
module.exports = {
  getUnicaCorrelator: getUnicaCorrelator,
  getTransactionId: getTransactionId,
  getOperationType: getOperationType,
  getVersion: getVersion,
  getAttributeValue: getAttributeValue,
  setAttribute: setAttribute,
  removeAttribute: removeAttribute,
  isAttributeIncluded: isAttributeIncluded,
  isValidAttributeValues: isValidAttributeValues,
  stringifyRevalidatorErrors: stringifyRevalidatorErrors,
  encodeResponse: encodeResponse,
  decodeResponse: decodeResponse
};
