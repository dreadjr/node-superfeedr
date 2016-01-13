var _ = require('lodash');
var assert = require('assert-plus');
//var request = require('superagent');
var defaults = require('superagent-defaults');


function Api(options) {
  var self = this;
  assert.object(options, 'options');
  assert.string(options.username, 'options.username');
  assert.string(options.token, 'options.token');

  var defaults = {
    endpoint: 'https://push.superfeedr.com'
  };

  self.parameters = {
    verify: ['async', 'sync'],
    format: ['json', 'atom']
  };

  self.checkParameter(name, value) {
    value = (value||'').toLowerCase();
    return _.contains(self.parameters[name], value);
  }

  // Create a defaults context
  var superagent = defaults();

  // Setup some defaults
  superagent
    .set('User-Agent', 'node-superfeedr')
    .auth(options.username. options.token);
//    .end(function(err, res) {
//
//    });
//    .accept('application/json');

  var opts = _.assign(defaults, options);
  this.request = superagent;
};

Audience.prototype.end = function (meta, callback) {
  return function (err, res) {
    if (err) {
      // Include the error details returned by the Gnip API
      var err = _.merge(err, res.body.error);
      err.meta = meta;

      return callback(err, res);
    }

    return callback(null, res);
  };
}

Audience.prototype.post = function (body) {
  var self = this;

  return new Promise(function (resolve, reject) {
    function callback(err, res) {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }

    request.post(self.endpoint)
      .send(body)
      .end(self.end({
        endpoint: self.endpoint,
        method: 'POST'
      }, callback));
  });
};

Audience.prototype.get = function (uri, query) {
  var self = this;

  return new Promise(function (resolve, reject) {
    function callback(err, res) {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }

    request.get(self.endpoint + uri)
      .query(query || {})
      .sign(self.oauth, self.auth.access_token, self.auth.access_token_secret)
      // .set('X-My', 'Header')
      .end(self.end({
        endpoint: self.endpoint,
        uri: uri,
        query: query,
        method: 'GET'
      }, callback));
  });
};

/*
  hub.mode	required	subscribe
  hub.topic	required	The URL of the HTTP resource to which you want to subscribe. It cannot be more than 2048 characters long.
  hub.callback	required	The webhook: it's the URL to which notifications will be sent. Make sure you it's web-accessible, ie not behind a firewall. Its size is currently limited to 250 characters.
  hub.secret	optional, recommended	A unique secret string which will be used by us to compute a signature. You should check this signature when getting notifications.
  hub.verify	optional	sync or async: will perform a PubSubHubbub verification of intent synschronously or asynschronously.
  format	optional
  json if you want to receive notifications as json format (for feeds only!). You can also use an Accept HTTP header like this: Accept: application/json.
  atom if you explicitly want to receive notification as Atom. This is used by default for any resource that's either Atom or RSS.
  If you don't specify any, we will send you the data pulled from the HTTP resource, (excluding feeds).
  retrieve	optional	If set to true, the response will include the current representation of the feed as stored in Superfeedr, in the format desired. Please check our Schema for more details.
*/
Api.prototype.addFeed = function (topic, callback, secret, verify, format) {
  assert.string(topic, 'topic');
  assert.optionalString(callback, 'callback');
  assert.optionalString(secret, 'secret');
  assert.optionalString(verify, 'verify');
  assert.optionalString(format, 'format');

  if (_.isString(verify) {
    assert.ok(this.checkParameter('verify', verify));
  }

  if (_.isString(format) {
    assert.ok(this.checkParameter('format', format));
  }

  return this.post({
    mode: 'subscribe',
    topic: topic,
    callback: callback,
    secret: secret,
    verify: verify,
    format: format
  });
};

/*
  hub.mode	required	unsubscribe
  hub.topic	required	The URL of the HTTP resource to which you want to subscribe.
  hub.callback	optional	The URL to which notifications will be sent. It is optional if you are only subscribed to the feed 'once', with a single hub.callback. If you have multiple subscriptions, you will need to supply the hub.callback parameter. It is also required if you use the hub.verify param. (see below).
  hub.verify	optional	sync or async. We will perform a PubSubHubbub verification of intent synschronously or asynschronously.
*/
Api.prototype.removeFeed = function (topic, callback, verify) {
  assert.string(topic, 'topic');
  assert.optionalString(callback, 'callback');
  assert.optionalString(verify, 'verify');

  if (_.isString(verify) {
    assert.ok(this.checkParameter('verify', verify));
  }

  return this.post({
    mode: 'unsubscribe',
    topic: topic,
    callback: callback,
    verify: verify
  });
};


module.exports = Api;
