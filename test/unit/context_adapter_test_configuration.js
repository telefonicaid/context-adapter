/* globals module */

/*
 * Copyright 2015 Telefónica Investigación y Desarrollo, S.A.U
 *
 * This file is part of the Short Time Historic (STH) component
 *
 * STH is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * STH is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with STH.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with: [german.torodelvalle@telefonica.com]
 */

'use strict';

var caConfig = require('../../lib/context_adapter_configuration');

module.exports = {
  API_OPERATION: {
    NOTIFY: 'notify',
    ADMIN: {
      SET_LOG_LEVEL: 'setLogLevel'
    },
    VERSION: 'version'
  },
  GOOGLE_MAPS_GEOLOCATION_SERVICE: {
    URI: {
      HOST: 'www.googleapis.com',
      PATH: '/geolocation/v1/geolocate',
      PARAMS: '?key=' + caConfig.GOOGLE_MAPS_GEOLOCATION_API_KEY
    },
    RESPONSE: {
      LATITUDE: '51.0',
      LONGITUDE: '-0.1',
      ACCURACY: '1200.4'
    }
  },
  DEFAULT_SERVICE: 'blackbutton',
  DEFAULT_SERVICE_PATH: '/'
};
