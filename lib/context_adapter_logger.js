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
  var fs = require('fs');
  var mkdirp = require('mkdirp');
  var path = require('path');
  var winston = require('winston');

  var LOG_LEVEL = {
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error'
  };

  var LOG_LEVEL_CONFIG = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * Formatter function for the winston logger
   * @param {object} log Log data
   * @return {string} The formatted text to be logged
   */
  function formatter(log) {
    return 'time=' + (new Date()).toISOString() +
      ' | lvl=' + log.level.toUpperCase() +
      ' | corr=' + (log.meta.unicaCorrelator || caConfig.UNICA_CORRELATOR. NOT_AVAILABLE) +
      ' | trans=' + (log.meta.transactionId || caConfig.TRANSACTION_ID.NOT_AVAILABLE) +
      ' | op=' + (log.meta.operationType || caConfig.OPERATION_TYPE.NOT_AVAILABLE) +
      ' | msg=' + log.message +
      ((log.level === LOG_LEVEL.error) ? ', alarm_status=ALARM' : '');
  }

  // Create the directory for the logging files if it does not exist
  if (fs.existsSync(caConfig.LOG_DIR)) {
    // The path exists
    if (!fs.statSync(caConfig.LOG_DIR).isDirectory()) {
      // The paths exists but it is not a directory
      mkdirp.sync(caConfig.LOG_DIR);
    }
  } else {
    // The path does not exist
    mkdirp.sync(caConfig.LOG_DIR);
  }

  // Logger configuration
  var transports = [];
  if (caConfig.LOG_TO_CONSOLE) {
    transports.push(new winston.transports.Console({
      level: caConfig.LOG_LEVEL,
      formatter: formatter
    }));
  }
  if (caConfig.LOG_TO_FILE) {
    // TODO:
    // Using a File transport instead of the DailyRotateFile one due to
    //  https://github.com/winstonjs/winston/issues/150
    // Issue created to get the problem fixed:
    //  https://github.com/winstonjs/winston/issues/567
    transports.push(new winston.transports.File({
      level: caConfig.LOG_LEVEL,
      filename: caConfig.LOG_DIR + path.sep + caConfig.LOG_FILE_NAME,
      maxsize: caConfig.LOG_FILE_MAX_SIZE_IN_BYTES,
      json: false,
      formatter: formatter
    }));
  }

  // Instantiate and export the logger
  module.exports = new winston.Logger({
    levels: LOG_LEVEL_CONFIG,
    transports: transports
  });
})();
