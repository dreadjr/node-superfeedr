var nock = require('nock');
var chai = require('chai');
var sinon = require('sinon');
var chaiHttp = require('chai-http');
var chaiAsPromised = require("chai-as-promised");

var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);
chai.use(chaiAsPromised);

chai.config.includeStack = true; // turn on stack trace

var superfeedr = require('./../');

describe('subscribers', function () {
  describe('http', function () {

    describe('client', function () {
      it('should get username and token from environmental variables', function () {
        process.env.SUPERFEEDR_USERNAME = "username";
        process.env.SUPERFEEDR_TOKEN = "token";

        var test = new superfeedr.Subscribers.HttpClient();

        var req = test.request.get('http://example.com');
        var authString = process.env.SUPERFEEDR_USERNAME + ':' + process.env.SUPERFEEDR_TOKEN;
        var expectedAuthHeader = 'Basic ' + (new Buffer(authString)).toString('base64');

        req.request()._headers.authorization.should.equal(expectedAuthHeader);
      });

      it('should call on.error', function () {
        var test = new superfeedr.Subscribers.HttpClient();
        var spy = sinon.spy();
        test.request.on('error', spy);
        test.request.emit('error', new Error('here'));
        spy.called.should.equal.true;
      });
    });

    var options = {
      username: 'user',
      token: 'token'
    };

    var client = new superfeedr.Subscribers.HttpClient(options);

    describe('get', function () {
      before(function () {
        nock.disableNetConnect();
      });

      after(function () {
        nock.enableNetConnect();
      });

      it('should GET from endpoint', function () {
        var scope = nock('https://push.superfeedr.com')
          .get('/test?q=test')
          .reply(200);

        return client.get('/test', {
            q: 'test'
          })
          .should.eventually.have.status(200);
      });

      it('should GET from endpoint on error', function () {
        var scope = nock('https://push.superfeedr.com')
          .get('/test')
          .reply(422, "Generic Error");

        var request = client.get('/test')
          .should.eventually.be.rejected;

        return Promise.all([
          request.should.eventually.have.property('status', 422),
          request.should.eventually.have.property('meta').that.eql({
            endpoint: 'https://push.superfeedr.com',
            query: {},
            uri: '/test',
            method: 'GET'
          }),
          request.should.eventually.have.deep.property('response.error.text', "Generic Error")
        ]);
      });
    });

    describe('post', function () {
      before(function () {
        nock.disableNetConnect();
      });

      after(function () {
        nock.enableNetConnect();
      });

      it('should POST from endpoint', function () {
        var scope = nock('https://push.superfeedr.com')
          .post('/', {
            q: 'test'
          })
          .reply(200);

        return client.post({
            q: 'test'
          })
          .should.eventually.have.status(200);
      });
    });

    describe('checkParameter', function () {
      it('should return false when field not checked', function () {
        client.checkParameter('nothing', 'value').should.be.false;
      });

      it('should return false when field checked but not in accepted values', function () {
        client.checkParameter('verify', 'value').should.be.false;
      });

      it('should return false when field checked and pass null', function () {
        client.checkParameter('verify', null).should.be.false;
      });

      it('should return true when field checked and in accepted values', function () {
        client.checkParameter('verify', 'async').should.be.true;
      });
    });

    describe('end', function () {
      it('should append meta and call callback', function (done) {
        function callback(err, res) {
          err.meta.should.eql({
            meta: true
          });
          return done();
        }

        client.end({
          meta: true
        }, callback)(new Error("Bad error"));
      });
    });

    describe('addFeed', function () {
      before(function () {
        nock.disableNetConnect();
      });

      after(function () {
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
          request.should.eventually.have.property('meta').that.eql({
            endpoint: 'https://push.superfeedr.com',
            method: 'POST'
          }),
          request.should.eventually.have.deep.property('response.error.text', "Please provide a valid hub.topic (feed) URL that is accepted on this hub. You did not provide a valid hub.topic.")
        ]);
      });

      it('should fail to addFeed if verify wrong', function () {

        var params = {
          topic: 'topic',
          callback: 'https://callback.com/1',
          secret: 'shhh',
          options: {
            verify: 'bad value',
            format: 'json',
            retrieve: null
          }
        };

        return client.addFeed(params.topic, params.callback, params.secret, params.options)
          .should.eventually.be.rejected;
        //          .should.eventually.be.rejectedWith(AssertionError);
      });
    });

    describe('removeFeed', function () {
      before(function () {
        nock.disableNetConnect();
      });

      after(function () {
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
          .reply(422, "Failure.");

        var request = client.removeFeed(params.topic, params.callback, params.options)
          .should.eventually.be.rejected;

        return Promise.all([
          request.should.eventually.have.property('status', 422),
          request.should.eventually.have.property('meta').that.eql({
            endpoint: 'https://push.superfeedr.com',
            method: 'POST'
          }),
          request.should.eventually.have.deep.property('response.error.text', 'Failure.')
        ]);
      });
    });

  });
});
