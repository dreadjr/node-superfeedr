var _ = require('lodash');
var assert = require('assert-plus');
var superagent = require('superagent');
var defaults = require('superagent-defaults');
var debug = require('debug');

var log = debug('superfeedr:subscribers:http');
var error = debug('superfeedr:subscribers:http:error');

/**
 * Superfeedr Subscribers Http Client
 *
 * Example:
 *
 * ```javascript
 * var superfeedr = require('node-superfeedr');
 * var options = {
 *   username: process.env.SUPERFEEDR_USERNAME || 'username',
 *   token: process.env.SUPERFEEDR_TOKEN || 'token'
 * };
 *
 * var client = new superfeedr.Subscribers.HttpClient(options);
 * ```
 *
 * @class Superfeedr.Subscribers.HttpClient
 * @constructor
 * @param {Object} [options] - override default options
 * @param {string} options.username - Superfeedr username | default: process.env.SUPERFEEDR_USERNAME
 * @param {string} options.token - Superfeedr token value | default: process.env.SUPERFEEDR_TOKEN
 * @param {url} options.endpoint - Superfeedr Push Api Endpoint | default: https://push.superfeedr.com
 *
 * @module superfeedr/subscribers/http
 * @submodule http
 */
function Api(options) {
  var self = this;
  assert.object(options, 'options');

  if (!options.username) {
    options.username = process.env.SUPERFEEDR_USERNAME;
  }

  if (!options.token) {
    options.token = process.env.SUPERFEEDR_TOKEN;
  }

  assert.string(options.username, 'options.username');
  assert.string(options.token, 'options.token');

  var defaultOptions = {
    endpoint: 'https://push.superfeedr.com'
//    username: process.env.SUPERFEEDR_USERNAME,
//    token: process.env.SUPERFEEDR_TOKEN
  };

  self.parameters = {
    verify: ['async', 'sync'],
    format: ['json', 'atom']
  };

  self.checkParameter = function(name, value) {
    value = (value||'').toLowerCase();
    return _.includes(self.parameters[name], value);
  }

  var opts = _.assign(defaultOptions, options);
  log('OPTIONS', opts);

  // Create a defaults context
  var superagent = defaults();

  // Setup some defaults
  superagent
    .set('User-Agent', 'node-superfeedr')
    .auth(opts.username, opts.token)
    .on('error', function(err) {
      error(err);
    })
    .on('request', function (req) {
      log(req);
    });

  this.request = superagent;
  this.endpoint = opts.endpoint;
};

Api.prototype.end = function (meta, callback) {
  return function (err, res) {
    if (err) {
      err.meta = meta;

      error('end', err);
      return callback(err, res);
    }

    return callback(null, res);
  };
}

Api.prototype.post = function (body) {
  var self = this;

  return new Promise(function (resolve, reject) {
    function callback(err, res) {
      if (err) {
        return reject(err, res);
      }

      return resolve(res);
    }

    log('post', self.endpoint, body);
    self.request.post(self.endpoint)
      .send(body)
      .end(self.end({
        endpoint: self.endpoint,
        method: 'POST'
      }, callback));
  });
};

Api.prototype.get = function (uri, query) {
  var self = this;

  return new Promise(function (resolve, reject) {
    function callback(err, res) {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }

    self.request.get(self.endpoint + uri)
      .query(query || {})
      .end(self.end({
        endpoint: self.endpoint,
        uri: uri,
        query: query,
        method: 'GET'
      }, callback));
  });
};

/**
 * @method
 * @name addFeed
 * @param {url} topic - The URL of the HTTP resource to which you want to subscribe. It cannot be more than 2048 characters long.
 * @param {url} callback - The webhook: it's the URL to which notifications will be sent. Make sure you it's web-accessible, ie not behind a firewall. Its size is currently limited to 250 characters.
 * @param {string} [secret] - Recommended. A unique secret string which will be used by us to compute a signature. You should check this signature when getting notifications.
 * @param {Object} [options] - Less used options
 * @param {string} options.verify - Will perform a PubSubHubbub verification of intent synschronously or asynschronously | async &#124; sync.
 * @param {string} options.format - If you want to receive notifications as json format (for feeds only!). You can also use an Accept HTTP header like this: Accept: application/json. If you explicitly want to receive notification as Atom. This is used by default for any resource that's either Atom or RSS.
  If you don't specify any, we will send you the data pulled from the HTTP resource, (excluding feeds). | json &#124; atom.
 * @param {string} options.retrieve - If set to true, the response will include the current representation of the feed as stored in Superfeedr, in the format desired. Please check our Schema for more details. | true &#124; false
 *
 * @returns {Promise}
*/
Api.prototype.addFeed = function (topic, callback, secret, options) {
  log('addFeed', topic, callback, secret, options);
  if (!options) {
    options = {};
  }

  assert.string(topic, 'topic');
  assert.ok(topic.length <= 2048);
  assert.string(callback, 'callback');
  assert.optionalString(secret, 'secret');
  assert.optionalObject(options, 'options');
  assert.optionalString(options.verify, 'options.verify');
  assert.optionalString(options.format, 'options.format');
  assert.optionalBool(options.retrieve, 'options.retrieve');

  if (_.isString(callback)) {
    assert.ok(callback.length <= 250);
  }

  if (_.isString(options.verify)) {
    assert.ok(this.checkParameter('verify', options.verify));
  }

  if (_.isString(options.format)) {
    assert.ok(this.checkParameter('format', options.format));
  }

  return this.post({
    'hub.mode': 'subscribe',
    'hub.topic': topic,
    'hub.callback': callback,
    'hub.secret': secret,
    'hub.verify': options.verify,
    format: options.format,
    retrieve: options.retrieve
  });
};

/**
 * @method
 * @name removeFeed
 * @param {url} topic - The URL of the HTTP resource to which you want to unsubscribe.
 * @param {url} [callback] - The URL to which notifications will be sent. It is optional if you are only subscribed to the feed 'once', with a single hub.callback. If you have multiple subscriptions, you will need to supply the hub.callback parameter. It is also required if you use the hub.verify param.
 * @param {Object} [options] - Less used options
 * @param {string} options.verify - We will perform a PubSubHubbub verification of intent synschronously or asynschronously. | async &#124; sync
 *
 * @returns {Promise}
*/
Api.prototype.removeFeed = function (topic, callback, options) {
  log('removeFeed', topic, callback, options);
  if (!options) {
    options = {};
  }

  assert.string(topic, 'topic');
  assert.optionalString(callback, 'callback');
  assert.optionalObject(options, 'options');
  assert.optionalString(options.verify, 'options.verify');

  if (_.isString(callback)) {
    assert.ok(callback.length <= 250);
  }

  if (_.isString(options.verify)) {
    assert.ok(this.checkParameter('verify', options.verify));
  }

  return this.post({
    'hub.mode': 'unsubscribe',
    'hub.topic': topic,
    'hub.callback': callback,
    'hub.verify': options.verify
  });
};


module.exports = Api;
