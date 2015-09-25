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

/**
 * Properties and functions exported by the module
 * @type {{BadPayload: Function, BadService: Function}}
 */
module.exports = {
  /**
   * BadPayload error type
   * @param {Object} payload The bad payload
   * @constructor
   */
  BadPayload: function(payload) {
    this.code = 'BAD_PAYLOAD';
    this.message = 'The request payload \'' + JSON.stringify(payload) + '\' is not valid';
  },
  /**
   * BadService error type
   * @param {String} serviceId The service id
   * @constructor
   */
  BadService: function(serviceId) {
    this.code = 'BAD_SERVICE';
    this.message = 'The service with id "' + serviceId + '" is not valid';
  },
  /**
   * BadInteractionType error type
   * @param {String} interactionType The interaction type
   * @constructor
   */
  BadInteractionType: function(buttonId, interactionType) {
    this.code = 'BAD_INTERACTION_TYPE';
    this.message = 'The button with id "' + buttonId + '" has \'' +
      interactionType + '\'  as interaction type';
  }
};
