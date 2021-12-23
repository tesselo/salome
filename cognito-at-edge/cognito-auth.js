const { Authenticator } = require('cognito-at-edge');
const { RobotAuthenticator } = require('./robot-auth')

const region = 'eu-central-1';
const userPoolId = 'eu-central-1_LT6czZlaJ';
const userPoolHumanAppId = '76vbkko2him4m09i1oi5u1sicu';
const userPoolRobotAppId = '4e3epne9c8f6lvsjegte64bu3k';
const userPoolDomain = 'auth.tesselo.com';
const logLevel = 'info';

const humanAuthenticator = new Authenticator({
  region: region,
  userPoolId: userPoolId,
  userPoolAppId: userPoolHumanAppId,
  userPoolDomain: userPoolDomain,
  logLevel: logLevel
});

const robotAuthenticator = new RobotAuthenticator({
  region: region,
  userPoolId: userPoolId,
  userPoolAppId: userPoolRobotAppId,
  userPoolDomain: userPoolDomain,
  logLevel: 'debug'
});

module.exports.handler = async(event) => {
  const { request } = event.Records[0].cf;
  const uri = request.uri;
  if (uri.match(/^\/?api/)) {
    event.Records[0].cf.request.uri = uri.replace(/^\/?api/,'');
    robotAuthenticator.handle(event);
  } else {
    humanAuthenticator.handle(event);
  }
}

