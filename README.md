# Salome

## Authentication service for Tesselo

Evolving service born from a proof of concept
heading towards unification of all services auth


## Structure


This repository holds several serverless functions:


### static-basic-auth

The first attempt of all. Independent, fast and static.
Just a hardcoded password and a basic HTTP Auth.


### cognito-at-edge

Another simple working attempt. Rely on an AWS library
to proxy the authentication to Amazon Cognito.


## Manual deployment

```
export CLOUDFRONT_DISTRIBUTION_ID=E1IMP927QPR5BQ
cd FUNCTION_DIR
sls deploy
```


