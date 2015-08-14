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

var contextAdapter = require('../../lib/context_adapter');
var caConfig = require('../../lib/context_adapter_configuration');
var caHelper = require('../../lib/context_adapter_helper');
var testHelper = require('./context_adapter_test_helper');
var hapi = require('hapi');
var request = require('request');
var nock = require('nock');

console.log('*** Running the Context Adapter unit tests with the following configuration:');
console.log(caConfig);

describe('Context Adapter server:', function () {
  it('should start successfully', function (done) {
    contextAdapter.server.start(caConfig.CA_HOST, caConfig.CA_PORT, function (err, hapiServer) {
      expect(err).to.equal(undefined);
      expect(hapiServer).to.be.an.instanceof(hapi.Server);
      expect(hapiServer).to.be.equal(contextAdapter.server.hapiServer);
      done();
    });
  });

  describe('HTTP methods:', function () {
    it('should respond with 404 - Not Found if invalid HTTP method', function (done) {
      request(
        testHelper.getRequestOptions(
          {
            method: 'PUT'
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(404);
          expect(body.statusCode).to.equal(404);
          expect(body.error).to.equal('Not Found');
          done();
        }
      );
    });

  });

  describe('Headers:', function () {
    it('should respond with 400 - Bad Request if missing Fiware-Service header', function (done) {
      request(
        testHelper.getRequestOptions(
          {
            headers: ['Fiware-Service']
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(400);
          expect(body.statusCode).to.equal(400);
          expect(response.statusMessage).to.equal('Bad Request');
          expect(body.error).to.equal('Bad Request');
          done();
        }
      );
    });

    it('should respond with 400 - Bad Request if missing Fiware-ServicePath header', function (done) {
      request(
        testHelper.getRequestOptions(
          {
            headers: ['Fiware-ServicePath']
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(400);
          expect(body.statusCode).to.equal(400);
          expect(response.statusMessage).to.equal('Bad Request');
          expect(body.error).to.equal('Bad Request');
          done();
        }
      );
    });
  });

  describe('Routes:', function () {
    it('should respond with 404 - Not Found if invalid route', function (done) {
      request(
        testHelper.getRequestOptions(
          {
            uri: 'http://' + caConfig.CA_HOST + ':' + caConfig.CA_PORT +
            caConfig.CA_PATH + '/invalidPath'
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(404);
          expect(body.statusCode).to.equal(404);
          expect(body.error).to.equal('Not Found');
          done();
        }
      );
    });
  });

  describe('updateContext requests:', function () {
    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if empty payload', function (done) {
      request(
        testHelper.getRequestOptions(),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('400');
          expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
          done();
        }
      );
    });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s id',
      function (done) {
        request(
          testHelper.getRequestOptions(
            {
              body: testHelper.getUpdateContextPayload({
                contextElements: {
                  id: false
                }
              })
            }
          ),
          function (err, response, body) {
            expect(err).to.equal(null);
            expect(response.statusCode).to.equal(200);
            expect(body.contextResponses[0].statusCode.code).to.equal('400');
            expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
            done();
          }
        );
      });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s type',
      function (done) {
        request(
          testHelper.getRequestOptions(
            {
              body: testHelper.getUpdateContextPayload({
                contextElements: {
                  type: false
                }
              })
            }
          ),
          function (err, response, body) {
            expect(err).to.equal(null);
            expect(response.statusCode).to.equal(200);
            expect(body.contextResponses[0].statusCode.code).to.equal('400');
            expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
            done();
          }
        );
      });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s isPattern',
      function (done) {
        request(
          testHelper.getRequestOptions(
            {
              body: testHelper.getUpdateContextPayload({
                contextElements: {
                  isPattern: false
                }
              })
            }
          ),
          function (err, response, body) {
            expect(err).to.equal(null);
            expect(response.statusCode).to.equal(200);
            expect(body.contextResponses[0].statusCode.code).to.equal('400');
            expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
            done();
          }
        );
      });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s ' +
      caConfig.BUTTON_ENTITY.CA_EXTERNAL_ID_ATTR_NAME + ' attribute', function (done) {
      request(
        testHelper.getRequestOptions(
          {
            body: testHelper.getUpdateContextPayload({
              contextElements: {
                attributes: [caConfig.BUTTON_ENTITY.CA_EXTERNAL_ID_ATTR_NAME]
              }
            })
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('400');
          expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
          done();
        }
      );
    });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s ' +
      caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME + ' attribute', function (done) {
      request(
        testHelper.getRequestOptions(
          {
            body: testHelper.getUpdateContextPayload({
              contextElements: {
                attributes: [caConfig.BUTTON_ENTITY.CA_SERVICE_ID_ATTR_NAME]
              }
            })
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('400');
          expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
          done();
        }
      );
    });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s ' +
      caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME + ' attribute', function (done) {
      request(
        testHelper.getRequestOptions(
          {
            body: testHelper.getUpdateContextPayload({
              contextElements: {
                attributes: [caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME]
              }
            })
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('400');
          expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
          done();
        }
      );
    });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if the contextElement\'s ' +
      caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME + ' attribute is not \'S\' or \'C\'', function (done) {
      var updateContextPayload = testHelper.getUpdateContextPayload();
      caHelper.setAttribute(
        updateContextPayload.contextElements[0].attributes,
        caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
        'NOT_S_OR_C'
      );

      request(
        testHelper.getRequestOptions(
          {
            body: updateContextPayload
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('400');
          expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
          done();
        }
      );
    });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s ' +
      caConfig.BUTTON_ENTITY.CA_OPERATION_EXTRA_ATTR_NAME + ' attribute', function (done) {
      var updateContextPayload = testHelper.getUpdateContextPayload({
        contextElements: {
          attributes: [caConfig.BUTTON_ENTITY.CA_OPERATION_EXTRA_ATTR_NAME]
        }
      });
      caHelper.setAttribute(
        updateContextPayload.contextElements[0].attributes,
        caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
        caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS
      );

      request(
        testHelper.getRequestOptions(
          {
            body: updateContextPayload
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('400');
          expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
          done();
        }
      );
    });

    it('should respond with a 400 code and BAD_PAYLOAD reasonPhrase if no contextElement\'s ' +
      caConfig.BUTTON_ENTITY.CA_OPERATION_STATUS_ATTR_NAME + ' attribute', function (done) {
      var updateContextPayload = testHelper.getUpdateContextPayload({
        contextElements: {
          attributes: [caConfig.BUTTON_ENTITY.CA_OPERATION_STATUS_ATTR_NAME]
        }
      });
      caHelper.setAttribute(
        updateContextPayload.contextElements[0].attributes,
        caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
        caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS
      );

      request(
        testHelper.getRequestOptions(
          {
            body: updateContextPayload
          }
        ),
        function (err, response, body) {
          expect(err).to.equal(null);
          expect(response.statusCode).to.equal(200);
          expect(body.contextResponses[0].statusCode.code).to.equal('400');
          expect(body.contextResponses[0].statusCode.reasonPhrase.indexOf('BAD_PAYLOAD')).to.equal(0);
          done();
        }
      );
    });

    describe('Synchronous operation requests (\'S\'):', function () {
      it('should respond with a 200 code and \'OK\' reasonPhrase if valid payload',
        function (done) {
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
              done();
            }
          );
        });

      it('should notify the request as \'closed\' if no Context Broker available to serve service information',
        function (done) {
          testHelper.nockContextBroker(
            {
              allowUnmocked: true,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithError: true,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithNGSICode: true,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      id: false
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      type: false
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      isPattern: false
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.AUTHENTICATION_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.MAPPING_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.TIMEOUT_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should send a synchronous request to the third party if a valid service descriptor is retrieved and ' +
        'a synchronous operation is requested',
        function (done) {
          // Generate a service descriptor response having 'http://thirdparty.com/service' as endpoint and
          //  'GET' as method
          var endpointDomain = 'http://thirdparty.com',
            endpointPath = '/service',
            method = 'GET';
          var response = testHelper.getServiceDescriptorResponse();
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
            endpointDomain + endpointPath
          );
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
            method);

          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: response
            }
          );

          // Nock the Third Party to listen for requests on the specified endpoint and for the
          //  method set
          nock(endpointDomain).
            intercept(endpointPath, method).
            reply(function () {
              done();
            });

          // Generate a valid updateContext request for a synchronous operation
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'closed\' if the third party responds with an error to the synchronous request',
        function (done) {
          // Generate a service descriptor response having 'http://thirdparty.com/service' as endpoint and
          //  'GET' as method
          var endpointDomain = 'http://thirdparty.com',
            endpointPath = '/service',
            method = 'GET';
          var response = testHelper.getServiceDescriptorResponse();
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
            endpointDomain + endpointPath
          );
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
            method);

          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: response,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
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

          // Generate a valid updateContext request for a synchronous operation
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'completed\' if the third party responds successfully to the synchronous ' +
         'request',
        function (done) {
          // Generate a service descriptor response having 'http://thirdparty.com/service' as endpoint and
          //  'GET' as method
          var endpointDomain = 'http://thirdparty.com',
            endpointPath = '/service',
            method = 'GET';
          var response = testHelper.getServiceDescriptorResponse();
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
            endpointDomain + endpointPath
          );
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
            method);

          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: response,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.COMPLETED,
                resultPrefix: '1'
              }
            },
            done
          );

          // Nock the Third Party to listen for requests on the specified endpoint and for the
          //  method set and reply with no error
          nock(endpointDomain).
            intercept(endpointPath, method).
            reply(function (uri, requestBody) {
              return [200, JSON.stringify(requestBody)];
            });

          // Generate a valid updateContext request for a synchronous operation
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.SYNCHRONOUS);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );
    });

    describe('Asynchronous operation requests (\'C\'):', function () {
      it('should respond with a 200 code and \'OK\' reasonPhrase if valid payload',
        function (done) {
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
              done();
            }
          );
        }
      );

      it('should notify the request as \'closed\' if no Context Broker available to serve service information',
        function (done) {
          testHelper.nockContextBroker(
            {
              allowUnmocked: true,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'closed\' if an error occured when retrieving service information from the ' +
         'Context Broker',
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithError: true,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithNGSIError: true,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'closed\' if no id in the service descriptor response received from the ' +
         'Context Broker',
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      id: false
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'closed\' if no type in the service descriptor response received from the ' +
         'Context Broker',
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      type: false
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      isPattern: false
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'closed\' if no method in the service descriptor response received from the ' +
         'Context Broker',
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.AUTHENTICATION_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.MAPPING_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
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
        function (done) {
          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: testHelper.getServiceDescriptorResponse(
                {
                  contextResponses: {
                    contextElement: {
                      attributes: [caConfig.SERVICE_ENTITY.TIMEOUT_ATTR_NAME]
                    }
                  }
                }
              ),
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
              }
            },
            done
          );

          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should send a asynchronous request to the third party if a valid service descriptor is retrieved and ' +
        'an asynchronous operation is requested',
        function (done) {
          // Generate a service descriptor response having 'http://thirdparty.com/service' as endpoint and
          //  'GET' as method
          var endpointDomain = 'http://thirdparty.com',
            endpointPath = '/service',
            method = 'GET';
          var response = testHelper.getServiceDescriptorResponse();
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
            endpointDomain + endpointPath
          );
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
            method);

          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: response,
            }
          );

          // Nock the Third Party to listen for requests on the specified endpoint and for the
          //  method set
          nock(endpointDomain).
            intercept(endpointPath, method).
            reply(function () {
              done();
            });

          // Generate a valid updateContext request for a synchronous operation
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'closed\' if the third party responds with an error to the asynchronous ' +
         'request',
        function (done) {
          // Generate a service descriptor response having 'http://thirdparty.com/service' as endpoint and
          //  'GET' as method
          var endpointDomain = 'http://thirdparty.com',
            endpointPath = '/service',
            method = 'GET';
          var response = testHelper.getServiceDescriptorResponse();
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
            endpointDomain + endpointPath
          );
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
            method);

          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: response,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.CLOSED,
                resultPrefix: '0'
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

          // Generate a valid updateContext request for a synchronous operation
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );

      it('should notify the request as \'in_progress\' if the third party responds successfully to the asynchronous ' +
         'request',
        function (done) {
          // Generate a service descriptor response having 'http://thirdparty.com/service' as endpoint and
          //  'GET' as method
          var endpointDomain = 'http://thirdparty.com',
            endpointPath = '/service',
            method = 'GET';
          var response = testHelper.getServiceDescriptorResponse();
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.ENDPOINT_ATTR_NAME,
            endpointDomain + endpointPath
          );
          caHelper.setAttribute(
            response.contextResponses[0].contextElement.attributes,
            caConfig.SERVICE_ENTITY.METHOD_ATTR_NAME,
            method);

          testHelper.nockContextBroker(
            {
              replyQueryContextWithServiceDescriptor: response,
              statusNotification: {
                status: caConfig.BUTTON_ENTITY.OPERATION_STATUS.IN_PROGRESS,
                attributes: [caConfig.BUTTON_ENTITY.EXTERNAL_ID_ATTR_NAME]
              }
            },
            done
          );

          // Nock the Third Party to listen for requests on the specified endpoint and for the
          //  method set and reply with no error
          nock(endpointDomain).
            intercept(endpointPath, method).
            reply(function (uri, requestBody) {
              return [200, JSON.stringify(requestBody)];
            });

          // Generate a valid updateContext request for a synchronous operation
          var updateContextPayload = testHelper.getUpdateContextPayload();
          caHelper.setAttribute(
            updateContextPayload.contextElements[0].attributes,
            caConfig.BUTTON_ENTITY.CA_OPERATION_ACTION_ATTR_NAME,
            caConfig.BUTTON_ENTITY.OPERATION_ACTION.ASYNCHRONOUS_CREATE);

          request(
            testHelper.getRequestOptions(
              {
                body: updateContextPayload
              }
            ),
            function (err, response, body) {
              // The Context Adapter should reply successfully to the updateContext request as
              //  soon as it validates it
              expect(err).to.equal(null);
              expect(response.statusCode).to.equal(200);
              expect(body.contextResponses[0].statusCode.code).to.equal('200');
              expect(body.contextResponses[0].statusCode.reasonPhrase).to.equal('OK');
            }
          );
        }
      );
    });

    describe('Update notification by third party: ', function () {
      it('should notify the asynchronous request as \'completed\'', function (done) {
        // Nock the Context Broker to listen for:
        //  1. The \'completed\' status notification via an updateContext request
        nock(
          'http://' + caConfig.CB_HOST + ':' + caConfig.CB_PORT
        ).post(
          caConfig.CB_PATH + '/updateContext'
        ).reply(function (uri, requestBody) {
            // The updateContext request should include a operation status attribute set
            //  to closed
            expect(caHelper.getAttributeValue(
              JSON.parse(requestBody).contextElements[0].attributes,
              caConfig.BUTTON_ENTITY.OPERATION_STATUS_ATTR_NAME)).to.equal(
              caConfig.BUTTON_ENTITY.OPERATION_STATUS.COMPLETED
            );
            // The updateContext request should include a operation result attribute
            //  starting with '0'
            expect(caHelper.getAttributeValue(
              JSON.parse(requestBody).contextElements[0].attributes,
              caConfig.BUTTON_ENTITY.OPERATION_RESULT_ATTR_NAME).indexOf('1')).to.equal(0);
            done();
          }
        );

        request(
          testHelper.getRequestOptions(
            {
              uri: 'http://' + caConfig.CA_HOST + ':' + caConfig.CA_PORT +
              caConfig.CA_PATH + caConfig.UPDATE_WEB_HOOK_PATH,
              body: {
                operationDescriptor: {
                  buttonId: '<button-id>',
                  externalButtonId: '<external-button-id>',
                  serviceId: '<service-id>',
                  action: '<action>',
                  extra: ' <extra>'
                }
              }
            }
          ), function (err, response) {
            expect(err).to.equal(null);
            expect(response.statusCode).to.equal(200);
          }
        );
      });
    });
  });
});
