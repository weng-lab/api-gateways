# API Gateway
This repository uses Apollo Federation to create gateway APIs which communicate with backend microservices. Deployment configurations can be found in the `k8s` directory. We currently deploy three gateways, two for serving ENCODE resources (SCREEN and Factorbook) and the other PsychENCODE (PsychSCREEN).

## Configuration
Downstream microservices are added via configuration. They are not hardcoded.

These configurations are set via environment variable. These environment variables must be named SERVICE_$NUM where NUM is a unique number, ie. "SERVICE_0", "SERVICE_1". The value of these variables should take the form $NAME>$URL, ie. "signal>http://testservice.sample"

## GraphQL
Downstream GraphQL schemas are composed into a single GraphQL schema using [GraphQL Federation]: https://www.apollographql.com/docs/apollo-server/federation/introduction/

## REST
Adds downstream REST endpoints. To make this work, the downstream service needs to have a GET `/rest` endpoint that returns a list of end points. This is read on startup and proxies are set up. Wildcards are allowed.

## Auth
Firebase Auth is used for Authentication. A JWT must be provided with a header that looks like this: "Authorization: Bearer <token>". The JWT is validated, and a decoded JSON version of the user token is sent to downstream services with the header "user".
