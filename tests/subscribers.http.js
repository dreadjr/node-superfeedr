var nock = require('nock');
var chai = require('chai');
var chaiHttp = require('chai-http');
var chaiAsPromised = require("chai-as-promised");

var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);
chai.use(chaiAsPromised);

chai.config.includeStack = true; // turn on stack trace

describe('subscribers', function () {
  describe('http', function () {
    var options = {
      username: 'user',
      token: 'token'
    };

    var superfeedr = require('./../');
    var client = new superfeedr.Subscribers.HttpClient(options);

    describe('addFeed', function () {
      before(function() {
        nock.disableNetConnect();
      });

      after(function() {
        nock.enableNetConnect();
      });

      it('should addFeed', function () {

        var params = {
          topic: 'topic',
          callback: 'https://callback.com/1',
          secret: 'shhh',
          options: {
            verify: null,
            format: 'json',
            retrieve: null
          }
        };

        var scope = nock('https://push.superfeedr.com/')
          .post('/', {
            "hub.mode": "subscribe",
            "hub.topic": "topic",
            "hub.callback": "https://callback.com/1",
            "hub.secret": "shhh",
            "hub.verify": null,
            "format": "json",
            "retrieve": null
          })
          .reply(204);

        return client.addFeed(params.topic, params.callback, params.secret, params.options)
          .should.eventually.have.status(204);
      });

      it('should fail to addFeed', function () {

        var params = {
          topic: 'topic',
          callback: 'https://callback.com/1',
          secret: 'shhh',
          options: {
            verify: null,
            format: 'json',
            retrieve: null
          }
        };

        var scope = nock('https://push.superfeedr.com/')
          .post('/', {
            "hub.mode": "subscribe",
            "hub.topic": "topic",
            "hub.callback": "https://callback.com/1",
            "hub.secret": "shhh",
            "hub.verify": null,
            "format": "json",
            "retrieve": null
          })
          .reply(422, "Please provide a valid hub.topic (feed) URL that is accepted on this hub. You did not provide a valid hub.topic.");

        var request = client.addFeed(params.topic, params.callback, params.secret, params.options)
          .should.eventually.be.rejected;

        return Promise.all([
          request.should.eventually.have.property('status', 422),
          request.should.eventually.have.property('meta').that.eql({ endpoint: 'https://push.superfeedr.com', method: 'POST'}),
          request.should.eventually.have.deep.property('response.error.text', "Please provide a valid hub.topic (feed) URL that is accepted on this hub. You did not provide a valid hub.topic.")
        ]);
      });
    });

    describe('removeFeed', function () {
      before(function() {
        nock.disableNetConnect();
      });

      after(function() {
        nock.enableNetConnect();
      });

      it('should removeFeed', function () {

        var params = {
          topic: 'topic',
          callback: 'https://callback.com/1',
          options: {
            verify: null
          }
        };

        var scope = nock('https://push.superfeedr.com/')
          .post('/', {
            "hub.mode": "unsubscribe",
            "hub.topic": "topic",
            "hub.callback": "https://callback.com/1",
            "hub.verify": null
          })
          .reply(204);

        return client.removeFeed(params.topic, params.callback, params.options)
          .should.eventually.have.status(204);
      });

      it('should removeFeed with verify', function () {

        var params = {
          topic: 'topic',
          callback: 'https://callback.com/1',
          options: {
            verify: 'async'
          }
        };

        var scope = nock('https://push.superfeedr.com/')
          .post('/', {
            "hub.mode": "unsubscribe",
            "hub.topic": "topic",
            "hub.callback": "https://callback.com/1",
            "hub.verify": 'async'
          })
          .reply(202);

        return client.removeFeed(params.topic, params.callback, params.options)
          .should.eventually.have.status(202);
      });

      it('should fail to removeFeed', function () {

        var params = {
          topic: 'topic',
          callback: 'https://callback.com/1',
          options: {
            verify: null
          }
        };

        var scope = nock('https://push.superfeedr.com/')
          .post('/', {
            "hub.mode": "unsubscribe",
            "hub.topic": "topic",
            "hub.callback": "https://callback.com/1",
            "hub.verify": null
          })
          .reply(422);

        return client.removeFeed(params.topic, params.callback, params.options)
          .should.be.rejectedWith(Error);
//          .and.should.eventually.have.status(422);
      });
    });

  });
});
