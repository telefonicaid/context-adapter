/*
 * Copyright 2015 Telefonica Investigación y Desarrollo, S.A.U
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

  var path = require('path');

  var config = {};

// Context Adapter server configuration
//--------------------------
  config.server = {
    // The host where the Context Adapter server will be started. Default value: "localhost".
    host: 'localhost',
    // The port where the Context Adapter server will be listening. Default value: "8666".
    port: '9999',
    // The path where the Context Adapter server will be expecting requests. Default value: "/v1".
    path: '/v1',
    // The service to be used if not sent by the Context Broker in the interchanged messages.
    //  Default value: "blackbutton".
    defaultService: 'blackbutton',
    // The service path to be used if not sent by the Context Broker in the interchanged messages.
    //  Default value: "/".
    defaultServicePath: '/'
  };

// Logging configuration
//------------------------
  config.logging = {
    // The logging level of the messages. Messages with a level equal or superior to this will be logged.
    //  Accepted values are: "debug", "info", "warn" and "error". Default value: "info".
    level: 'info',
    // A flag indicating if the logs should be sent to the console. Default value: "true".
    toConsole: 'true',
    // A flag indicating if the logs should be sent to a file. Default value: "true".
    toFile: 'true',
    // Maximum size in bytes of the log files. If the maximum size is reached, a new log file is
    //  created incrementing a counter used as the suffix for the log file name. Default value: "0" (no
    //  size limit).
    maxFileSize: '0',
    // The path to a directory where the log file will be searched for or created if it does not exist.
    //  Default value: "./log".
    directoryPath: '.' + path.sep + 'log',
    // The name of the file where the logs will be stored. Default value: "sth_app.log".
    fileName: 'context_adapter.log',
    // The time in seconds between proof of life logging messages informing that the server is up and running normally.
    //  Default value: "60"
    proofOfLifeInterval: '60'
  };

  // Context Broker configuration
//--------------------------
  config.contextBroker = {
    // The host where the Context Broker will be started. Default value: "localhost".
    host: 'localhost',
    // The port where the Context Broker will be listening. Default value: "1206".
    port: '1026',
    // The path where the Context Broker will be expecting requests. Default value: "/v1".
    path: '/v1'
  };

  module.exports = config;
})();
