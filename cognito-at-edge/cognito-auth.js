const { Authenticator } = require('cognito-at-edge');

const authenticator = new Authenticator({
  region: 'eu-central-1',
  userPoolId: 'eu-central-1_LT6czZlaJ',
  userPoolAppId: '76vbkko2him4m09i1oi5u1sicu',
  userPoolDomain: 'auth.tesselo.com',
  logLevel: 'info'
});

module.exports.handler = async(request) => authenticator.handle(request);

