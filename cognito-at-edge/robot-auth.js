const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const assert = require('assert');
const axios = require('axios');
const pino = require('pino');

class RobotAuthenticator {
  constructor(params) {
    this._verifyParams(params);
    this._userPoolAppId = params.userPoolAppId;
    this._issuer = `https://cognito-idp.${params.region}.amazonaws.com/${params.userPoolId}`;
    this._logger = pino({
      level: params.logLevel || 'silent', // Default to silent
      base: null, //Remove pid, hostname and name logging as not useful for Lambda
    });
  }

  /**
   * Verify that constructor parameters are corrects.
   * @param  {object} params constructor params
   * @return {void} throw an exception if params are incorects.
   */
  _verifyParams(params) {
    if (typeof params !== 'object') {
      throw new Error('Expected params to be an object');
    }
    [ 'region', 'userPoolId', 'userPoolAppId', 'userPoolDomain' ].forEach(param => {
      if (typeof params[param] !== 'string') {
        throw new Error(`Expected params.${param} to be a string`);
      }
    });
  }

  /**
   * Download JSON Web Key Set (JWKS) from the UserPool.
   * @param  {String} issuer URI of the UserPool.
   * @return {Promise} Request.
   */
  _fetchJWKS() {
    this._jwks = {};
    const URL = `${this._issuer}/.well-known/jwks.json`;
    this._logger.debug(`Fetching JWKS from ${URL}`);
    return axios.get(URL)
      .then(resp => {
        resp.data.keys.forEach(key => this._jwks[key.kid] = key);
      })
      .catch(err => {
        this._logger.error(`Unable to fetch JWKS from ${URL}`);
        throw err;
      });
  }

  /**
   * Verify that the current token is valid. Throw an error if not.
   * @param  {String} token Token to verify.
   * @return {Object} Decoded token.
   */
  _getVerifiedToken(token) {
    this._logger.debug({ msg: 'Verifying token...', token });
    const decoded = jwt.decode(token, {complete: true});
    const kid = decoded.header.kid;
    const verified = jwt.verify(token, jwkToPem(this._jwks[kid]), { sub: this._userPoolAppId, iss: this._issuer });
    assert.strictEqual(verified.token_use, 'access');
    return verified;
  }

  /**
   * Handle Lambda@Edge event:
   *   * if authentication cookie is present and valid: forward the request
   *   * if ?code=<grant code> is present: set cookies with new tokens
   *   * else redirect to the Cognito UserPool to authenticate the user
   * @param  {Object}  event Lambda@Edge event.
   * @return {Promise} CloudFront response.
   */
  async handle(event) {
    this._logger.debug({ msg: 'Handling Lambda@Edge event', event });

    if (!this._jwks) {
      await this._fetchJWKS();
    }

    const { request } = event.Records[0].cf;

    try {
      const authHeader = request.headers.authorization[0].value;
      if (authHeader.split(" ")[0] !== 'Bearer') {
        throw 'Authorization does not follow the Bearer schema';
      }

      const token = authHeader.split(" ")[1];
      const user = this._getVerifiedToken(token);
      this._logger.info({ msg: 'Forwarding request', path: request.uri, user });
      return request;
    } catch (err) {
        return {
            body: 'Unauthorized',
            status: '401',
            statusDescription: 'Unauthorized',
          };
      
    }
  }
}

module.exports.RobotAuthenticator = RobotAuthenticator;
