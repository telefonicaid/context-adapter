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

/**
 * The Context Adapter supports 2 ways of configuration:
 *  1. Via environment variables.
 *  2. Vía de config.js file found in the root of the application
 * Any of the supported configuration options can be configured using any of these 2 means.
 * Anyhow, it is important to note that environment variables take precedence over configuration
 *  using the config.js file in case of collisions.
 */
'use strict';

var config = require('../config.js');

var ENV = process.env;

/**
 * Constants exported by the module
 * @type {{MODES: {CONTEXT_PROVIDER: string, NOTIFICATION: string}, ATTRIBUTE_TYPE: {STRING: string, COMPOUND: string},
 * BUTTON_ENTITY: {TYPE: string, SERVICE_ID_ATTR_NAME: string, CA_SERVICE_ID_ATTR_NAME: string,
 * OPERATION_ACTION_ATTR_NAME: string, CA_OPERATION_ACTION_ATTR_NAME: string, INTERACTION_TYPE_ATTR_NAME: string,
 * CA_INTERACTION_TYPE_ATTR_NAME: string, CA_LAST_OPERATION: string, INTERACTION_TYPES: {SYNCHRONOUS: string,
 * ASYNCHRONOUS: string}, OPERATION_EXTRA_ATTR_NAME: string, CA_OPERATION_EXTRA_ATTR_NAME: string,
 * OPERATION_STATUS_ATTR_NAME: string, IOTA_OPERATION_STATUS_ATTR_NAME: string, CA_OPERATION_STATUS_ATTR_NAME: string,
 * OPERATION_STATUS: {PENDING: string, ERROR: string, COMPLETED: string, CLOSED: string},
 * OPERATION_RESULT_ATTR_NAME: string, IOTA_OPERATION_RESULT_ATTR_NAME: string, CA_OPERATION_RESULT_ATTR_NAME: string},
 * SERVICE_ENTITY: {TYPE: string, INTERACTION_TYPE_ATTR_NAME: string, INTERACTION_TYPES: {SYNCHRONOUS: string,
 * ASYNCHRONOUS: string}, PROVIDER_ATTR_NAME: string, ENDPOINT_ATTR_NAME: string, METHOD_ATTR_NAME: string,
 * AUTHENTICATION_ATTR_NAME: string, MAPPING_ATTR_NAME: string, TIMEOUT_ATTR_NAME: string}, CA_CALLBACK_PATH: string,
 * UNICA_CORRELATOR_HEADER: string, UNICA_CORRELATOR: {NOT_AVAILABLE: string}, OPERATION_TYPE_PREFIX: string,
 * TRANSACTION_ID: {NOT_AVAILABLE: string}, OPERATION_TYPE: {NOT_AVAILABLE: string, STARTUP: string, SHUTDOWN: string,
 * SERVER_START: string, SERVER_LOG: string, SERVER_STOP: string}, RESULT_CODES: {SUCCESS: string, ERROR: string}}}
 */
module.exports = {
  MODES: {
    CONTEXT_PROVIDER: 'context-provider',
    NOTIFICATION: 'notification'
  },
  ATTRIBUTE_TYPE: {
    STRING: 'string',
    COMPOUND: 'compound'
  },
  BUTTON_ENTITY: {
    TYPE: 'BlackButton',
    SERVICE_ID_ATTR_NAME: 'service_id',
    CA_SERVICE_ID_ATTR_NAME: 'aux_service_id',
    OPERATION_ACTION_ATTR_NAME: 'op_action',
    CA_OPERATION_ACTION_ATTR_NAME: 'aux_op_action',
    INTERACTION_TYPE_ATTR_NAME: 'interaction_type',
    CA_INTERACTION_TYPE_ATTR_NAME: 'aux_interaction_type',
    CA_LAST_OPERATION: 'aux_last_operation',
    INTERACTION_TYPES: {
      SYNCHRONOUS: 'synchronous',
      ASYNCHRONOUS: 'asynchronous'
    },
    OPERATION_EXTRA_ATTR_NAME: 'op_extra',
    CA_OPERATION_EXTRA_ATTR_NAME: 'aux_op_extra',
    OPERATION_STATUS_ATTR_NAME: 'op_status',
    IOTA_OPERATION_STATUS_ATTR_NAME: 'lazy_op_status',
    CA_OPERATION_STATUS_ATTR_NAME: 'aux_op_status',
    OPERATION_STATUS: {
      PENDING: 'P',
      ERROR: 'C.F',
      COMPLETED: 'C.S',
      CLOSED: 'X'
    },
    OPERATION_RESULT_ATTR_NAME: 'op_result',
    IOTA_OPERATION_RESULT_ATTR_NAME: 'lazy_op_result',
    CA_OPERATION_RESULT_ATTR_NAME: 'aux_op_result'
  },
  SERVICE_ENTITY: {
    TYPE: 'service',
    INTERACTION_TYPE_ATTR_NAME: 'interaction_type',
    INTERACTION_TYPES: {
      SYNCHRONOUS: 'synchronous',
      ASYNCHRONOUS: 'asynchronous'
    },
    PROVIDER_ATTR_NAME: 'provider',
    ENDPOINT_ATTR_NAME: 'endpoint',
    METHOD_ATTR_NAME: 'method',
    AUTHENTICATION_ATTR_NAME: 'authentication',
    MAPPING_ATTR_NAME: 'mapping',
    TIMEOUT_ATTR_NAME: 'timeout'
  },
  CA_CALLBACK_PATH: '/update',
  UNICA_CORRELATOR_HEADER: 'unica-correlator',
  UNICA_CORRELATOR: {
    NOT_AVAILABLE: 'NA'
  },
  OPERATION_TYPE_PREFIX: 'OP_CA_',
  TRANSACTION_ID: {
    NOT_AVAILABLE: 'NA'
  },
  OPERATION_TYPE: {
    NOT_AVAILABLE: 'NA',
    STARTUP: 'OP_CA_STARTUP',
    SHUTDOWN: 'OP_CA_SHUTDOWN',
    SERVER_START: 'OP_CA_SERVER_START',
    SERVER_LOG: 'OP_CA_SERVER_LOG',
    SERVER_STOP: 'OP_CA_SERVER_STOP'
  },
  RESULT_CODES: {
    SUCCESS: '200',
    ERROR: '500'
  }
};

/**
 * Log level configuration property exported by the module
 * @type {string|*}
 */
module.exports.LOGOPS_LEVEL = ENV.LOGOPS_LEVEL || config.logging.level || 'INFO';
if (!isNaN(ENV.PROOF_OF_LIFE_INTERVAL)) {
  /**
   * Proof of life interval configuration property
   * @type {*|string}
   */
  module.exports.PROOF_OF_LIFE_INTERVAL = ENV.PROOF_OF_LIFE_INTERVAL;
} else if (config.logging && !isNaN(config.logging.proofOfLifeInterval)) {
  /**
   * Proof of life interval configuration property
   * @type {*|string}
   */
  module.exports.PROOF_OF_LIFE_INTERVAL = config.logging.proofOfLifeInterval;
} else {
  /**
   * Proof of life interval configuration property
   * @type {*|string}
   */
  module.exports.PROOF_OF_LIFE_INTERVAL = '60';
}

/**
 * Context Broker host configuration property exported by the module
 * @type {*|string}
 */
module.exports.CB_HOST = ENV.CB_HOST || (config.contextBroker && config.contextBroker.host) || 'localhost';
if (!isNaN(ENV.CB_PORT)) {
  /**
   * Context Broker port configuration property exported by the module
   * @type {Number}
   */
  module.exports.CB_PORT = parseInt(ENV.CB_PORT, 10);
} else if (config.contextBroker && !isNaN(config.contextBroker.port)) {
  /**
   * Context Broker port configuration property exported by the module
   * @type {Number}
   */
  module.exports.CB_PORT = parseInt(config.contextBroker.port, 10);
} else {
  /**
   * Context Broker port configuration property exported by the module
   * @type {number}
   */
  module.exports.CB_PORT = 1026;
}
if (ENV.CB_PATH && ENV.CB_PATH.charAt(0) === '/') {
  /**
   * Context Broker path configuration property exported by the module
   * @type {*|string}
   */
  module.exports.CB_PATH = ENV.CB_PATH;
} else if (config.contextBroker && config.contextBroker.path && config.contextBroker.path.charAt(0) === '/') {
  /**
   * Context Broker path configuration property exported by the module
   * @type {string}
   */
  module.exports.CB_PATH = config.contextBroker.path;
} else {
  /**
   * Context Broker path configuration property exported by the module
   * @type {string}
   */
  module.exports.CB_PATH = '/v1';
}

/**
 * Default service configuration property exported by the module
 * @type {string|*}
 */
module.exports.DEFAULT_SERVICE = ENV.DEFAULT_SERVICE || config.server.defaultService || 'blackbutton';
/**
 * Default service path configuration property exported by the module
 * @type {*|string}
 */
module.exports.DEFAULT_SERVICE_PATH = ENV.DEFAULT_SERVICE_PATH ||
  (config.server && config.server.defaultServicePath) || '/';

/**
 * Context Adapter host configuration property exported by the module
 * @type {string|*}
 */
module.exports.CA_HOST = ENV.CA_HOST || config.server.host || 'localhost';
module.exports.CA_PUBLIC_HOST = ENV.CA_PUBLIC_HOST || config.server.publicHost || '127.0.0.1';
if (!isNaN(ENV.CA_PORT)) {
  /**
   * Context Adapter port configuration property exported by the module
   * @type {Number}
   */
  module.exports.CA_PORT = parseInt(ENV.CA_PORT, 10);
} else if (config.server && !isNaN(config.server.port)) {
  /**
   * Context Adapter port configuration property exported by the module
   * @type {Number}
   */
  module.exports.CA_PORT = parseInt(config.server.port, 10);
} else {
  /**
   * Context Adapter port configuration property exported by the module
   * @type {number}
   */
  module.exports.CA_PORT = 9999;
}
if (ENV.CA_PATH && ENV.CA_PATH.charAt(0) === '/') {
  /**
   * Context Adapter path configuration property exported by the module
   * @type {*|string}
   */
  module.exports.CA_PATH = ENV.CA_PATH;
} else if (config.server && config.server.path && config.server.path.charAt(0) === '/') {
  /**
   * Context Adapter path configuration property exported by the module
   * @type {string}
   */
  module.exports.CA_PATH = config.server.path;
} else {
  /**
   * Context Adapter path configuration property exported by the module
   * @type {string}
   */
  module.exports.CA_PATH = '/v1';
}
if ([
    module.exports.MODES.CONTEXT_PROVIDER,
    module.exports.MODES.NOTIFICATION
  ].indexOf(ENV.CA_MODE) !== -1) {
  /**
   * Context Adapter mode configuration property exported by the module
   * @type {string}
   */
  module.exports.CA_MODE = ENV.CA_MODE;
} else if ([
    module.exports.MODES.CONTEXT_PROVIDER,
    module.exports.MODES.NOTIFICATION
  ].indexOf(config.server.mode) !== -1) {
  module.exports.CA_MODE = config.server.mode;
} else {
  /**
   * Context Adapter mode configuration property exported by the module
   * @type {string}
   */
  module.exports.CA_MODE = 'notification';
}
