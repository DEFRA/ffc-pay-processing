# FFC Process Payments

FFC payment processing core service

## Prerequisites

- Access to an instance of an
[Azure Service Bus](https://docs.microsoft.com/en-us/azure/service-bus-messaging/)(ASB).
- Docker
- Docker Compose

Optional:
- Kubernetes
- Helm

## Azure Service Bus

This service depends on a valid Azure Service Bus connection string for
asynchronous communication.  The following environment variables need to be set
in any non-production (`!config.isProd`) environment before the Docker
container is started or tests are run. 

When deployed into an appropriately configured AKS
cluster (where [AAD Pod Identity](https://github.com/Azure/aad-pod-identity) is
configured) the microservice will use AAD Pod Identity.

| Name | Description |
| ---| --- |
| MESSAGE_QUEUE_HOST | Azure Service Bus hostname, e.g. `myservicebus.servicebus.windows.net` |
| MESSAGE_QUEUE_PASSWORD | Azure Service Bus SAS policy key |
| MESSAGE_QUEUE_USER     | Azure Service Bus SAS policy name, e.g. `RootManageSharedAccessKey` |
| MESSAGE_QUEUE_SUFFIX | Developer initials |

### Example messages

#### Payment request

```
{
  "sourceSystem": "SFIP",
  "frn": 1234567890,
  "marketingYear": 2022,
  "paymentRequestNumber": 1,
  "correlationId":"9e016c50-046b-4597-b79a-ebe4f0bf8505",
  "invoiceNumber": "S123456789A123456V001",
  "agreementNumber": "SIP00000000000001",
  "contractNumber": "SFIP000001",
  "currency": "GBP",
  "schedule": "Q4",
  "dueDate": "09/11/2022",
  "value": 100000,
  "schemeId": 2,
  "ledger": "AP",
  "deliveryBody": "RP00",
  "invoiceLines": [{
    "description": "G00 - Gross value of claim",
    "value": 100000,
    "schemeCode": "80001",
    "fundCode": "DOM00",
    "accountCode": "SOS100"
  }]
}
```

#### Acknowledgment

##### Success

```
{
  "invoiceNumber": "S123456789A123456V001",
  "frn": 1234567890,
  "success": true,
  "acknowledged": "Fri Jan 21 2022 00:00:00 GMT+0000 (Greenwich Mean Time)"
}
```

##### Failure

```
{
  "invoiceNumber": "S123456789A123456V001",
  "frn": 1234567890,
  "success": false,
  "acknowledged": "Fri Jan 21 2022 00:00:00 GMT+0000 (Greenwich Mean Time)",
  "message": "Journal JN12345678 has been created Validation failed Line : 21."
}
```

#### Return

```
{
  "sourceSystem": "SITIAgri",
  "invoiceNumber": "S123456789A123456V001",
  "frn": 1234567890,
  "postedDate": "Fri Jan 21 2022 00:00:00 GMT+0000 (Greenwich Mean Time)",
  "currency": "GBP",
  "value": 10000,
  "settlementDate": "Fri Jan 21 2022 00:00:00 GMT+0000 (Greenwich Mean Time)",
  "reference": "PY1234567",
  "settled": true,
  "detail": ""
}
```

## Running the application

The application is designed to run in containerised environments, using Docker Compose in development and Kubernetes in production.

- A Helm chart is provided for production deployments to Kubernetes.

### Build container image

Container images are built using Docker Compose, with the same images used to run the service with either Docker Compose or Kubernetes.

When using the Docker Compose files in development the local `app` folder will
be mounted on top of the `app` folder within the Docker container, hiding the CSS files that were generated during the Docker build.  For the site to render correctly locally `npm run build` must be run on the host system.


By default, the start script will build (or rebuild) images so there will
rarely be a need to build images manually. However, this can be achieved
through the Docker Compose
[build](https://docs.docker.com/compose/reference/build/) command:

```
# Build container images
docker-compose build
```

### Start

Use Docker Compose to run service locally.

The service uses [Liquibase](https://www.liquibase.org/) to manage database migrations. To ensure the appropriate migrations have been run the utility script `scripts/start` may be run to execute the migrations, then the application.

Alternatively the steps can be run manually:
* run migrations
  * `docker-compose -f docker-compose.migrate.yaml run --rm database-up`
* start
  * `docker-compose up`
* stop
  * `docker-compose down` or CTRL-C

Additional Docker Compose files are provided for scenarios such as linking to other running services.

Link to other services:
```
docker-compose -f docker-compose.yaml -f docker-compose.link.yaml up
```

## Test structure

The tests have been structured into subfolders of `./test` as per the
[Microservice test approach and repository structure](https://eaflood.atlassian.net/wiki/spaces/FPS/pages/1845396477/Microservice+test+approach+and+repository+structure)

### Running tests

A convenience script is provided to run automated tests in a containerised
environment. This will rebuild images before running tests via docker-compose,
using a combination of `docker-compose.yaml` and `docker-compose.test.yaml`.
The command given to `docker-compose run` may be customised by passing
arguments to the test script.

Examples:

```
# Run all tests
scripts/test

# Run tests with file watch
scripts/test -w
```

## CI pipeline

This service uses the [FFC CI pipeline](https://github.com/DEFRA/ffc-jenkins-pipeline-library)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
