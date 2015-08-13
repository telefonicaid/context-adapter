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
        caLogger.info('Application exited successfully', {
          operationType: caConfig.OPERATION_TYPE.SHUTDOWN
        });
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
      caLogger.error(message, {
        operationType: caConfig.OPERATION_TYPE.SHUTDOWN
      });
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

    var version = caHelper.getVersion();
    caLogger.info(
      'Starting up Context Adapter server version %s...',
      version.version,
      {
        operationType: caConfig.OPERATION_TYPE.SERVER_START
      }
    );
    caLogger.debug(
      'Context Adapter configuration: \n',
      caConfig,
      {
        operationType: caConfig.OPERATION_TYPE.SERVER_START
      }
    );

    // Start the hapi server
    caServer.start(
      caConfig.CA_HOST, caConfig.CA_PORT, function(err) {
        if (err) {
          caLogger.error(err.toString(), {
            operationType: caConfig.OPERATION_TYPE.SERVER_START
          });
          // Error when starting the server
          return exitGracefully(err, callback);
        } else {
          isStarted = true;
          caLogger.info('Server started at', caServer.server.info.uri, {
            operationType: caConfig.OPERATION_TYPE.SERVER_START
          });
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
    startup(function() {
      proofOfLifeInterval = setInterval(function() {
        caLogger.info('Everything OK, ' + caServer.getKPIs().attendedRequests + ' requests attended in the last ' +
          caConfig.PROOF_OF_LIFE_INTERVAL + 's interval', {
          operationType: caConfig.OPERATION_TYPE.SERVER_LOG
        });
        caServer.resetKPIs();
      }, parseInt(caConfig.PROOF_OF_LIFE_INTERVAL, 10) * 1000);
    });
  }

  // In case Control+C is clicked, exit gracefully
  process.on('SIGINT', function() {
    return exitGracefully(null);
  });

  // In case of an uncaught exception exists gracefully
  process.on('uncaughtException', function(exception) {
    return exitGracefully(exception);
  });

  module.exports = {
    get server() {
      return caServer;
    },
    startup: startup,
    exitGracefully: exitGracefully
  };
})();
