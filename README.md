#<a id="section0"></a> Context Adapter

[![Join the chat at https://gitter.im/telefonicaid/context-adapter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/telefonicaid/context-adapter?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

* [Introduction] (#section1)
    * [Black Button flow] (#section11)
        * [Context Adapter as context provider scenario] (#section111)
        * [Context Adapter notification scenario] (#section112)
        * [Third Party service protocol] (#section113)
    * [Geolocation update] (#section12)
* [Dependencies](#section2)
* [Installation](#section3)
* [Automatic deployment using Docker](#section4)
* [Running the Context Adapter](#section5)
* [Test coverage](#section6)
* [Contribution guidelines] (#section7)
* [Additional development documentation] (#section8)
* [Contact](#section9)

##<a id="section1"></a> Introduction

The Context Adapter is a FIWARE component part of the [FIWARE platform](https://www.fiware.org).

For the time being, the Context Adapter is able to function in 2 compatible modes. This is, the component is able to
handle requests for each one of these modes simultaneously.

The supported modes are:

    1 Black Button flow

    2 Geolocation resolution and update

###<a id="section11"></a> Black Button flow

Working in this mode, the Context Adapter is in charge of adapting the communication (protocols and messages) between
Telefónica's IoT Platform (and, more concretely, the [Orion Context Broker](https://github.com/telefonicaid/fiware-orion))
and the services exposed by Third Parties.

To this regard, the Context Adapter is able to handle redirected `updateContext` requests (see the `Context Adapter as a
context provider scenario` section below) or notification (`notify`) requests (see the `Context Adapter notifications
scenario`) sent by the Context Broker.

The main capability of the Context Adapter consists of transforming these requests into requests to the corresponding
Third Party service associated to the clicked Black Button.

Once the response is received from the Third Party (synchronously or asynchronously), the Context Adapter
updates the concrete Black Button entity updating not only the response or result received from the Third Party service
but also the status of the Black Button request.

####<a id="section111"></a> Context Adapter as context provider scenario

In this scenario, the Context Broker is properly configured to redirect `updateContext` requests to the Context Adapter
as the result of a Black Button click.

To configure the Context Adapter to work as a context provider, the `CA_MODE` configuration variable must be set to
`context-provider` as mentioned in the [Running the Context Adapter](#section5) section below.

In this scenario, the Context Broker redirects to the Context Adapter (more concretely to the path `/v1/updateContext`,
where the `/v1` part is configurable)  an `updateContext` request such as the following one:

<pre>
    {
        "contextElements": [
            {
                "id": &lt;device-id&gt;,
                "type": "BlackButton",
                "isPattern": false,
                "attributes": [
                    {
                        "name": "aux_interaction_type",
                        "type": "string",
                        "value": &lt;synchronous | asynchronous&gt;
                    },
                    {
                        "name": "aux_service_id",
                        "type": "string",
                        "value": &lt;aux-service-id&gt;
                    },
                    {
                        "name": "aux_op_action",
                        "type": "string",
                        "value": &lt;aux-op-action&gt;
                    },
                    {
                        "name": "aux_op_extra",
                        "type": "string",
                        "value": &lt;aux-op-extra&gt;
                    },
                    {
                        "name": "aux_op_status",
                        "type": "string",
                        "value": &lt;aux-op-status&gt;
                    }
                ]
            }
        ],
        "updateAction": "UPDATE"
    }
</pre>

From the information contained in this request (and more concretely the `aux_service_id` property), the Context Adapter obtains
detailed information about the Third Party service to be invoked sending a `queryContext` request to the
Context Broker with the following payload:

<pre>
    {
      "entities": [
        {
          "id": &lt;service-id&gt;,
          "type": "service",
          "isPattern": false,
          "attributes": [
            "endpoint",
            "method",
            "authentication",
            "mapping",
            "timeout"
          ]
        }
      ]
    }
</pre>

The Context Broker responds to the previous `queryContext` request with information about the concrete Third Party service such as the following one:

<pre>
    {
      "contextElements": [
        {
          "id": &lt;service-id&gt;,
          "type": "service",
          "isPattern": false,
          "attributes": [
            {
              "name": "endpoint",
              "type": "string",
              "value": &lt;endpoint&gt;
            },
            {
              "name": "method",
              "type": "string",
              "value": &lt;method&gt;
            },
            {
              "name": "authentication",
              "type": "string",
              "value": &lt;authentication&gt;
            },
            {
              "name": "mapping",
              "type": "string",
              "value": &lt;mapping&gt;
            },
            {
              "name": "timeout",
              "type": "string",
              "value": &lt;timeout&gt;
            }
          ]
        }
      ],
      "statusCode": {
        "code": "200",
        "reasonPhrase": "OK"
      }
    }
</pre>

Using this information, the Context Adapter sends a request to the provided `endpoint` using the provided `method`
following the protocol specified in the [Third Party service protocol](#section113) section below.

The response or result received from the Third Party service is finally updated in the Context Broker
(via an `updateContext` request) as the result of the initial Black Button request as well as its final status
(i.e., successfully completed or completed with error).

####<a id="section112"></a> Context Adapter notification scenario

In this scenario, the Context Broker is properly configured to send notification requests to the Context Adapter
(more concretely to the path `/v1/notify`, where the `/v1` part is configurable) as the result of a Black Button click.

To configure the Context Adapter to work as a context provider, the `CA_MODE` configuration variable must be set to
`notification` as mentioned in the [Running the Context Adapter](#section5) section below.

In this scenario, the Context Broker sends notification requests to the Context Adapter such as the following one:

<pre>
    {
        "subscriptionId": &lt;subscription-id&gt;,
        "originator": &lt;orion-contextBroker-instance&gt;,
        "contextResponses": [
            {
                "contextElement": {
                    "id": &lt;device-id&gt;,
                    "type": "BlackButton",
                    "isPattern": false,
                    "attributes": [
                        {
                            "name": "interaction_type",
                            "type": "string",
                            "value": &lt;synchronous | asynchronous&gt;
                        },
                        {
                            "name": "service_id",
                            "type": "string",
                            "value": &lt;service-id&gt;
                        },
                        {
                            "name": "op_action",
                            "type": "string",
                            "value": &lt;op-action&gt;
                        },
                        {
                            "name": "op_extra",
                            "type": "string",
                            "value": &lt;op-extra&gt;
                        }
                    ]
                },
                "statusCode": {
                    "code": "200",
                    "reasonPhrase": "OK"
                }
            }
        ]
    }
</pre>

From the information contained in this request (and more concretely the `service_id` property), the Context Adapter obtains
detailed information about the Third Party service to be invoked sending a `queryContext` request to the
Context Broker with the following payload:

<pre>
    {
        "entities": [
            {
                "id": &lt;service-id&gt;,
                "type": "service",
                "isPattern": false,
                "attributes": [
                    "endpoint",
                    "method",
                    "authentication",
                    "mapping",
                    "timeout"
                ]
            }
        ]
    }
</pre>

The Context Broker responds to the previous `queryContext` request with information about the Third Party service
such as the following one:

<pre>
    {
        "contextElements": [
            {
                "id": &lt;service-id&gt;,
                "type": "service",
                "isPattern": false,
                "attributes": [
                    {
                        "name": "endpoint",
                        "type": "string",
                        "value": &lt;endpoint&gt;
                    },
                    {
                        "name": "method",
                        "type": "string",
                        "value": &lt;method&gt;
                    },
                    {
                        "name": "authentication",
                        "type": "string",
                        "value": &lt;authentication&gt;
                    },
                    {
                        "name": "mapping",
                        "type": "string",
                        "value": &lt;mapping&gt;
                    },
                    {
                        "name": "timeout",
                        "type": "string",
                        "value": &lt;timeout&gt;
                    }
                ]
            }
        ],
        "statusCode": {
            "code": "200",
            "reasonPhrase": "OK"
        }
    }
</pre>

Using this information, the Context Adapter sends a request to the provided `endpoint` using the provided `method`
following the protocol specified in the [Third Party service protocol](#section113) section below.

The response or result received from the Third Party service is finally updated in the Context Broker
(via an `updateContext` request) as the result of the initial Black Button request as well as its final status
(i.e., successfully completed or completed with error).

####<a id="section113"></a> Third Party service protocol

Once the information about the Third Party service has been collected, the Context Adapter interacts with it following
to the next protocol:

1 Synchronous Third Party services (for services with `interaction-type` to `synchronous`):

    1 The Context Adapter sends a request to the proper `endpoint` using the proper `method` with the following payload:
      {
        "button”: ”<button-id>",
        "action”: ”<action>”,
        "extra”: ”<extra>”
      }
    2 The Third Party service synchronously responds with a 200 - OK (the Context Adapter is able to deal with error
     codes such as not responding Third Party services, 4XX, 5XX, etc.) with the following payload:
      {
        "details”: {
            "rt":"20”,
            "rrgb":”00FF00"
        }
      }
      `details` may contain any JSON object which the Context Adapter will stringify and update in the Context Broker as
      the result of the original request.

2 Asynchronous Third Party services (for services with `interaction-type` to `asynchronous`):

    1 The Context Adapter sends a request to the proper `endpoint` using the proper `method` with the following payload:
          {
            "button”: ”<button-id>",
            "action”: ”<action>”,
            "extra”: ”<extra>”,
            "callback”: "http://context-adapter-host:port/v1/update” (the /v1 path and the /update part are both configurable)
          }
    2 The Third Party service synchronously responds to the previous request with a 200 - OK (the Context Adapter is
    able to deal with error codes such as not responding Third Party services, 4XX, 5XX, etc.).
    3 The Third Party service sends a `POST` request to the URL specified in the `callback` property sent in the
    original request with the following payload:
        {
            "buttonId”: ”<button-id>”,
            "externalId”: ”<external-id>”,
            "details”: {
                "rt":"20”,
                "rrgb":”00FF00"
        }
    `details` may contain any JSON object which the Context Adapter will stringify and update in the Context Broker as
    the result of the original request.
    4 The Context Adapter responds to the previous request from the Third Party service with a 200 - OK status code.

###<a id="section12"></a> Geolocation update

Working in this mode, the Context Adapter is able to update the geolocation of entities, transforming cell tower information
such as the cell identifier, the mobile country code, the mobile network code and the location area code into coordinates
(latitude and longitude).

In this case, the Context Adapter receives a notification in the path `/v1/notifyGeolocation` (where the `/v1` part is
configurable) of an entity update including a `P1` compound attribute. This `P1` attribute includes all the cell tower
information. The notification request received should be such as the following one:

<pre>
    {
        "subscriptionId": &lt;subscription-id&gt;,
        "originator": &lt;orion.contextBroker.instance&gt;,
        "contextResponses": [
            {
                "contextElement": {
                    "attributes": [
                        {
                            "name": "P1",
                            "type": "compound",
                            "value": [
                                {
                                    "name": "mcc",
                                    "type": "string",
                                    "value": &lt;mobile-country-code&gt;
                                },
                                {
                                  "name": "mnc",
                                  "type": "string",
                                  "value": &lt;mobile-network-code&gt;
                                },
                                {
                                  "name": "lac",
                                  "type": "string",
                                  "value": &lt;location-area-code-as-hexadecimal-number&gt;
                                },
                                {
                                  "name": "cell-id",
                                  "type": "string",
                                  "value": &lt;cell-id-as-hexadecimal-number&gt;
                                }
                            ]
                        }
                    ],
                    "type": &lt;type&gt;,
                    "isPattern": false,
                    "id": &lt;device-id&gt;
                },
                "statusCode": {
                    "code": "200",
                    "reasonPhrase": "OK"
                }
            }
        ]
    }
</pre>

Using the provided information, the Context Adapter invokes the
[Google Maps Geolocation API](https://developers.google.com/maps/documentation/geolocation/intro) to get the concrete
geolocation coordinates (latitude and longitude).

Once these coordinates have been received, the Context Adapter updates the geolocation of the concrete entity sending
`updateContext` request to the configured Context Broker with a payload similar to the following one:

<pre>
    {
        "contextElements": [
            {
                "id": &lt;device-id&gt;,
                "type": &lt;type&gt;,
                "isPattern": false,
                "attributes": [
                    {
                        "name": "position",
                        "type": "coords",
                        "value": &lt;latitute, longitude&gt;,
                        "metadatas": [
                            {
                                "name": "location",
                                "type": "string",
                                "value": "WGS84"
                            },
                            {
                                "name": "TimeInstant",
                                "type": "ISO8601",
                                "value": &lt;date-in-iso-8601-format&gt;
                            },
                            {
                                "name": "accuracy",
                                "type": "meters",
                                "value": &lt;accuracy&gt;
                            }
                        ]
                    }
                ],
                "updateAction": "APPEND"
            }
        ]
    }
</pre>

[Top](#section0)

##<a id="section2"></a> Dependencies
The Context Adapter component is a Node.js application which depends on certain Node.js modules as stated in the ```project.json``` file.

[Top](#section0)

##<a id="section3"></a> Installation
The Context Adapter can be installed in two ways: using the RPM or cloning the Github repository.

### Cloning the Github Repository
1. Clone the repository:
<pre> git clone https://github.com/telefonicaid/context-adapter.git </pre>
2. Get into the directory where the Context Adapter repository has been cloned:
<pre> cd context-adapter/ </pre>
3. Install the Node.js modules and dependencies:
<pre> npm install </pre>
The Context Adapter component server is ready to be started.

### Using the RPM
The project contains a script for generating an RPM that can be installed in Red Hat 6.5 compatible Linux distributions. The
RPM depends on Node.js 0.10 version, so EPEL repositories are advisable. 

In order to create the RPM, execute the following script, inside the `/rpm` folder:
```
create-rpm.sh -v <versionNumber> -r <releaseNumber>
```


Once the RPM is generated, it can be installed using the following command:
```
yum localinstall --nogpg <nameOfTheRPM>.rpm
```
[Top](#section0)

## <a id="section4"></a>Automatic deployment using Docker

A [`Dockerfile`](https://github.com/telefonicaid/fiware-sth-comet/blob/master/Dockerfile) file has been included in this very repository to quickly and easily start your own instance of the Context Adapter component.

To do it, follow the next steps once you have installed Docker in your machine:

1. Navigate to the path where this repository was cloned.

2. Build your Context Adapter image:
```bash
docker build -t my_context_adapter:my_tag .
```

3. Run the Context Adapter image:
```bash
docker run -t -i my-context-adapter:my-tag
```

## <a id="section5"></a>Running the Context Adapter
1. To run the Context Adapter component, just execute:
```bash
./bin/context-adapter
```

The Context Adapter component provides the user with 2 mechanisms to configure the component to the concrete needs of the user:

* Environment variables, which can be set assigning values to them or using the `context-adapter_default.conf` file if a packaged
version of the Context Adapter component is used.
* The [`config.js`](https://github.com/telefonicaid/context-adapter/blob/develop/config.js) located at the root of the Context Adapter component code, a JSON formatted file including the configuration properties.

It is important to note that environment variables, if set, take precedence over the properties defined in the `config.js` file.

The script accepts the following parameters as environment variables:

- CA_HOST: The host where the Context Adapter server will be started. Optional. Default value: "localhost".
- CA_PUBLIC_HOST: The public host or IP where the Context Adapter server will be listening. Default value: "127.0.0.1".
- CA_PORT: The port where the Context Adapter server will be listening. Optional. Default value: "9999".
- CA_PATH: The path to add to the routes where the Context Broker is attending requests. Optional. Default value: "/v1".
- CA_MODE: The Context Adapter supports 2 modes of operation: 1) it can act as a context provider receiving the redirected
updateContext requests received by the Context Broker as a consequence of button clicks (to set this
operation mode set the `mode` configuration option to "context-provider") and 2) being notified by the
Context Broker of new button clicks (to set this operation mode set the `mode` configuration option to
"notification"). Default value: "notification".
- LOGOPS_LEVEL: The logging level of the messages. Messages with a level equal or superior to this will be logged.
Accepted values are: "debug", "info", "warn" and "error". Optional. Default value: "info".
- PROOF_OF_LIFE_INTERVAL: The time in seconds between proof of life logging messages informing that the server is up and running normally. Default value: "60".
- DEFAULT_SERVICE: The service to be used if not sent by the Orion Context Broker in the requests. Optional. Default value: "blackbutton".
- DEFAULT_SERVICE_PATH: The service path to be used if not sent by the Orion Context Broker in the requests. Optional. Default value: "/".
- CB_HOST: The host where the Orion Context Broker is running. Optional. Default value: "localhost".
- CB_PORT: The port where the Orion Context Broker is listening. Optional. Default value: "1026".
- CB_PATH: The path to add to the routes where the Orion Context Broker is attending requests. Optional. Default value: "/v1".

For example, to start the Context Adapter and make it listen on port 7777, use:

As already mentioned, all this configuration parameters can also be adjusted using the
[`config.js`](https://github.com/telefonicaid/context-adapter/blob/develop/config.js) file whose contents are self-explanatory.

It is important to note that the Context Adapter component uses the `logops` module. For more information about how to further
configure it, please visit [https://www.npmjs.com/package/logops](https://www.npmjs.com/package/logops).

[Top](#section0)

## <a id="section6"></a> Test coverage
The Context Adapter component source code includes a set of tests to validate the correct functioning of the whole set of capabilities
exposed by the component. This set includes:

- Attending synchronous operation requests
- Attending asynchronous operation requests
- Attending third party's service updates

### Running the tests
In order to execute the test suite you must have the Grunt client installed. You can install it using the following command
(you will need root permissions):
```bash
npm install -g grunt-cli
```

Once the client is installed and the dependencies are downloaded, you can execute the tests using:
```
grunt test
```

This will execute the functional tests and the syntax checking as well.

Take into consideration that the tests can be run using distinct configurations using environment variables or properly
setting the [`config.js`](https://github.com/telefonicaid/context-adapter/blob/develop/config.js) file as explained in
[Running the Context Adapter](#section5).

[Top](#section0)

## <a id="section7"></a>Contribution guidelines

### <a id="section7.1"></a> Overview
Being an open source project, everyone can contribute, provided that it respects the following points:
* Before contributing any code, the author must make sure all the tests work (see below how to run the tests).
* Developed code must adhere to the syntax guidelines enforced by the linters.
* Code must be developed following the branching model and changelog policies defined below.
* For any new feature added, unit tests must be provided, following the example of the ones already created.

In order to start contributing:
1. Fork this repository clicking on the "Fork" button on the upper-right area of the page.
2. Clone your just forked repository:
```
git clone https://github.com/your-github-username/context-adapter.git
```
3. Add the main context-adapter repository as a remote to your forked repository (use any name for your remote
repository, it does not have to be context-adapter, although we will use it in the next steps):
```
git remote add context-adapter https://github.com/telefonicaid/context-adapter.git
```

Before starting your contribution, remember to synchronize the `develop` branch in your forked repository with the `develop`
branch in the main lcontext-adapter repository following the next steps:

1. Change to your local `develop` branch (in case you are not in it already):
```
  git checkout develop
```
2. Fetch the remote changes:
```
  git fetch context-adapter
```
3. Merge them:
```
  git rebase context-adapter/develop
```

Contributions following these guidelines will be added to the `develop` branch, and released in the next version. The
release process is explained in the [Releasing](#section7.9) section below.


### <a id="section7.2"></a> Branching model
There are two special branches in the repository:

* `master`: holds the code for the last stable version of the project. It is only updated when a new version is released.
* `develop`: contains the last stable development code. New features and bug fixes are always merged to `develop`.

In order to start developing a new feature or refactoring, a new branch should be created with name `task/<taskName>`
in the newly forked repository.
This new branch must be created from the current version of the `develop` branch (remember to fetch the latest changes from
the remote `develop` branch before creating this new branch).
Once the new functionality has been completed, a pull request should be created from the
new branch to the `develop` branch in the main remote repository.
Remember to check both the linters and the tests before creating the pull request.

Fixing bugs follow the same branching guidelines as in the case of adding a new feature or refactoring code with the
exception of the branch name. In the case of bug fixes, the new branch should be called `bug/<bugName>`.

There are another set of branches called `release/<versionNumber>`, one for each version of the product. These branches
point to each one of the released versions of the project. They are permanent and they are created with each release.

### <a id="section7.3"></a> Changelog
The project contains a version changelog file, called `CHANGES_NEXT_RELEASE`, that can be found in the root of the project.
Whenever a new feature or bug fix is going to be merged with `develop`, a new entry should be added to this changelog.
The new entry should contain the reference number of the issue it is solving (if any).

When a new version is released, the changelog is cleared, and remains fixed in the last commit of that version. The
content of the changelog is also moved to the release description in the Github release.

### <a id="section7.4"> Coding guidelines
Coding guidelines are defined via the provided `.jshintrc` and `.gjslintrc` flag files. The latter requires Python and
its use can be disabled while creating the project skeleton with grunt-init.
To check source code style, type:
```bash
grunt lint
```

Checkstyle reports can be used together with Jenkins to monitor project quality metrics by means of Checkstyle
and Violations plugins.
To generate Checkstyle and JSLint reports under `report/lint/`, type:
```bash
grunt lint-report
```

### <a id="section7.5"></a> Testing
The test environment is preconfigured to run the [Mocha](http://mochajs.org/) Test Runner with support
for the [Chai](http://chaijs.com/) assertion library as well as for [Sinon](http://sinonjs.org/) spies, stubs, etc.,
following a [BDD](http://chaijs.com/api/bdd/) testing style with `chai.expect` and `chai.should()` available globally
while executing tests, as well as the [Sinon-Chai](http://chaijs.com/plugins/sinon-chai) plugin.

Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire).

To run tests, type:
```bash
grunt test
```

Tests reports can be used together with Jenkins to monitor project quality metrics by means of TAP or XUnit plugins.
To generate TAP report in `report/test/unit_tests.tap`, type
```bash
grunt test-report
```

### <a id="section7.6"></a> Continuous testing
Support for continuous testing is provided so that tests are run when any source file or test is modified.
For continuous testing, type:
```bash
grunt watch
```

### <a id="section7.7"></a> Source code documentation
HTML code documentation can be generated under the `site/doc/` path. It can be used together with Jenkins by means of
DocLinks plugin.
For compiling source code documentation, type:
```bash
grunt doc
```

### <a id="section7.8"></a> Code coverage
A very good practice is to measure the code coverage of your tests.

To generate an HTML coverage report under the `site/coverage/` path and to print out a summary, type:
```bash
grunt coverage
```

To generate a Cobertura report in `report/coverage/cobertura-coverage.xml` that can be used together with Jenkins to
monitor project quality metrics by means of Cobertura plugin, type
```bash
grunt coverage-report
```

### <a id="section7.8"></a> Code complexity
Another very good practice is to analise code complexity.

Support for using Plato and storing the generated report in the `site/report/` path is provided. This capability can be
used together with Jenkins by means of DocLinks plugin.

To generate a code complexity report, type:
```bash
grunt complexity
```

### <a id="section7.9"></a> Releasing
The process of making a release consists of the following steps and should be made by any of the owners or administrators
of the main repository:

1. Create a new task branch changing the development version number in the `package.json` file (with a suffix `-next`)
to the new target version (without any suffix), and create a pull request of this new task branch into `develop`. Remember
to delete the temporary created task branch.
2. Create a release branch named `release/<versionNumber>` from the last version of `develop` using the corresponding
version number.
3. Create a new release in Github setting the tag version as `release-<versionNumber>` from the new release branch
`release/<versionNumber>` and publish it.
5. Create a pull request from the new release branch `release/<versionNumber>` to `master`.
6. Create a new task branch to prepare the `develop` branch for the next release, adding the `-next` suffix to the
current version number in the `package.json` file (to signal this as the development version) and removing the contents
of the `CHANGES_NEXT_RELEASE` changelog file. Create a pull request from this new task branch to `develop`.
Remember to delete the temporary created task branch.

To further guide you through your first contributions, we have created the label [```mentored```](https://github.com/telefonicaid/context-adapter/labels/mentored)
which are assigned to those bugs and issues simple and interesting enough to be solved by people new to the project.
Feel free to assign any of them to yourself and do not hesitate to mention any of the main developers
(this is, [@gtorodelvalle](https://github.com/gtorodelvalle) or [@dmoranj](https://github.com/dmoranj)
in the issue's comments to get help from them during its resolution. They will be glad to help you.

[Top](#section0)

## <a id="section8"></a>Additional development documentation
### Project build
The project is managed using Grunt Task Runner.

For a list of available task, type
```bash
grunt --help
```

The following sections show the available options in detail.


### PLC

To update the contributors of the project, type:
```bash
grunt contributors
```


### Development environment

Initialize your environment with git hooks.
```bash
grunt init-dev-env 
```

We strongly suggest you to make an automatic execution of this task for every developer simply by adding the following
lines to your `package.json`
```
{
  "scripts": {
     "postinstall": "grunt init-dev-env"
  }
}
``` 


### Site generation

There is a grunt task to generate the GitHub pages of the project, publishing also coverage, complexity and JSDocs pages.
In order to initialize the GitHub pages, use:

```bash
grunt init-pages
```

This will also create a site folder under the root of your repository. This site folder is detached from your repository's
history, and associated to the gh-pages branch, created for publishing. This initialization action should be done only
once in the project history. Once the site has been initialized, publish with the following command:

```bash
grunt site
```

This command will only work after the developer has executed init-dev-env (that's the goal that will create the detached site).

This command will also launch the coverage, doc and complexity task (see the sections above).

## <a id="section9"></a>Contact
* Germán Toro del Valle (<a href="mailto:german.torodelvalle@telefonica.com">german.torodelvalle@telefonica.com</a>, <a href="http://www.twitter.com/gtorodelvalle" target="_blank">@gtorodelvalle</a>)
* Daniel Morán Jiménez (<a href="mailto:daniel.moranjimenez@telefonica.com">daniel.moranjimenez@telefonica.com</a>)

[Top](#section0)
