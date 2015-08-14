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

var caLogger = require('logops');
var caConfig = require('./context_adapter_configuration');
var caHelper = require('./context_adapter_helper');
var caServer = require('./context_adapter_server');

var isStarted = false, proofOfLifeInterval;

/**
 * Gracefully stops the application, stopping the server after completing
 *  all the pending requests
 * @param {Error} err The error provoking the exit if any
 */
function exitGracefully(err, callback) {
  function onStopped() {
    isStarted = false;
    var exitCode = 0;
    if (err) {
      exitCode = 1;

    } else {
      caLogger.info(
        {
          op: caConfig.OPERATION_TYPE.SHUTDOWN
        },
        'Application exited successfully');
    }
    if (callback) {
      callback(err);
    }
    // TODO:
    // Due to https://github.com/winstonjs/winston/issues/228 we use the
    //  setTimeout() hack. Once the issue is solved, we will fix it.
    setTimeout(process.exit.bind(null, exitCode), 500);
  }

  if (err) {
    var message = err.toString();
    if (message.indexOf('listen EADDRINUSE') !== -1) {
      message += ' (another Context Adapter instance maybe already listening on the same port)';
    }
    caLogger.error(
      {
        op: caConfig.OPERATION_TYPE.SHUTDOWN
      },
      message
    );
  }

  if (proofOfLifeInterval) {
    clearInterval(proofOfLifeInterval);
  }
  caServer.stop(onStopped);
}

/**
 * Convenience method to startup the Context Adapter component as a running
 *  Node.js application or via require()
 * @param {Function} callback Callback function to notify when startup process
 *  has concluded
 * @return {*}
 */
function startup(callback) {
  if (isStarted) {
    return process.nextTick(callback);
  }

  caLogger.setLevel(caConfig.LOG_LEVEL);

  var version = caHelper.getVersion();
  caLogger.info(
    {
      op: caConfig.OPERATION_TYPE.STARTUP
    },
    'Starting up Context Adapter server version %s...',
    version.version
  );
  caLogger.debug(
    {
      op: caConfig.OPERATION_TYPE.STARTUP
    },
    'Context Adapter configuration: \n',
    caConfig
  );

  // Start the hapi server
  caServer.start(
    caConfig.CA_HOST, caConfig.CA_PORT, function (err) {
      if (err) {
        caLogger.error(
          {
            op: caConfig.OPERATION_TYPE.SERVER_START
          },
          err);
        // Error when starting the server
        return exitGracefully(err, callback);
      } else {
        isStarted = true;
        caLogger.info(
          {
            op: caConfig.OPERATION_TYPE.SERVER_START
          },
          'Server started at %s...', caServer.server.info.uri);
        if (callback) {
          return process.nextTick(callback);
        }
      }
    }
  );
}

// Starts the Context Adapter application up in case this file has not been 'require'd,
//  such as, for example, for testing
if (!module.parent) {
  startup(function () {
    proofOfLifeInterval = setInterval(function () {
      caLogger.info(
        {
          op: caConfig.OPERATION_TYPE.SERVER_LOG
        },
        'Everything OK, %d requests attended in the last %ds interval...',
        caServer.getKPIs().attendedRequests,
        caConfig.PROOF_OF_LIFE_INTERVAL);
      caServer.resetKPIs();
    }, parseInt(caConfig.PROOF_OF_LIFE_INTERVAL, 10) * 1000);
  });
}

// In case Control+C is clicked, exit gracefully
process.on('SIGINT', function () {
  return exitGracefully(null);
});

// In case of an uncaught exception exists gracefully
process.on('uncaughtException', function (exception) {
  return exitGracefully(exception);
});

module.exports = {
  get server() {
    return caServer;
  },
  startup: startup,
  exitGracefully: exitGracefully
};
