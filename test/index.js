'use strict';

const Code = require('code');
const Lab = require('lab');
const Https = require('https');
const Nock = require('nock');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const it = lab.test;
const expect = Code.expect;

const Notifuse = require('../lib/notifuse');
const Utils = require('../lib/utils');

const HOST = 'https://localapi.notifuse.com';
const BASE_URI = HOST + '/v2/';
const API_KEY = 'xxxxxxxx';


describe('Utils', () => {

    it('promisify returns a promise if no callback', (done) => {

        const functionWithoutCallback = function (params){ };

        const promise = Utils.promisify(this, functionWithoutCallback, 123);

        expect(promise).to.be.an.object();
        expect(promise.then).to.be.a.function();
        expect(promise.catch).to.be.a.function();

        done();
    });
});



describe('Client', () => {

    it('throws when apiKey is not a string', (done) => {

        expect(() => {

            new Notifuse();
        }).to.throw('Your project API key is required!');
        done();
    });

    it('throws when options is not an object', (done) => {

        expect(() => {

            new Notifuse(API_KEY, 'wrong options');
        }).to.throw('Options should be an Object!');
        done();
    });

    it('returns a valid Client', (done) => {

        const client = new Notifuse(API_KEY);

        expect(client.apiKey).to.be.a.string();

        expect(client.options).to.be.an.object();
        expect(client.options.baseUri).to.be.a.string();
        expect(client.options.agent).to.be.an.object();
        expect(client.options.agent.constructor.name).equal('Agent');
        expect(client.options.timeout).to.be.a.number();
        expect(client.options.maxAttempts).to.be.a.number();
        expect(client.options.retryDelay).to.be.a.number();

        expect(client.contacts).to.be.an.object();
        expect(client.contacts.name).to.equal('contacts');
        expect(client.contacts.makeAPICall).to.be.a.function();
        expect(client.contacts.upsert).to.be.a.function();

        expect(client.messages).to.be.an.object();
        expect(client.messages.name).to.equal('messages');
        expect(client.messages.makeAPICall).to.be.a.function();
        expect(client.messages.send).to.be.a.function();
        expect(client.messages.info).to.be.a.function();

        expect(client._makeAPICall).to.be.a.function();

        done();
    });

    it('returns Client with overwritten options', (done) => {

        const agentOptions = {
            maxSockets: 1337,
            timeout: 1337
        };

        const newOptions = {
            baseUri: 'new_baseUri',
            agent: new Https.Agent(agentOptions),
            timeout: 1337,
            maxAttempts: 1337,
            retryDelay: 1337
        };

        const client = new Notifuse(API_KEY, newOptions);

        expect(client.options).to.be.an.object();
        expect(client.options.baseUri).to.equal(newOptions.baseUri);
        expect(client.options.agent).to.be.an.object();
        expect(client.options.agent.constructor.name).equal('Agent');
        expect(client.options.agent.options.maxSockets).to.equal(agentOptions.maxSockets);
        expect(client.options.agent.options.timeout).to.equal(agentOptions.timeout);
        expect(client.options.timeout).to.be.equal(newOptions.timeout);
        expect(client.options.maxAttempts).to.be.equal(newOptions.maxAttempts);
        expect(client.options.retryDelay).to.be.equal(newOptions.retryDelay);

        done();
    });
});

describe('API call', () => {

    it('returns an error after request timeout', (done) => {

        Nock.cleanAll();

        const client = new Notifuse(API_KEY, {
            baseUri: BASE_URI,
            maxAttempts: 1,
            retryDelay: 0,
            timeout: 200
        });
        const messageId = 'message_id_timeout';

        Nock(HOST, { reqheaders: { 'authorization': 'Bearer ' + API_KEY } })
            .get('/v2/messages.info')
            .query({ message: messageId })
            .socketDelay(400)
            .reply(200, {
                statusCode: 200
            });

        client.messages.info(messageId).then((result) => {

            done('socket timeout not working');
        })
        .catch((error) => {

            expect(error).to.be.an.error();
            expect(error.code).to.equal('ESOCKETTIMEDOUT');
            done();
        });
    });

    it('returns an error for >= 400 statusCode', (done) => {

        Nock.cleanAll();

        const client = new Notifuse(API_KEY, {
            baseUri: BASE_URI,
            maxAttempts: 1,
            retryDelay: 0
        });
        const messageId = 'message_id_api_error';

        Nock(HOST, { reqheaders: { 'authorization': 'Bearer ' + API_KEY } })
            .get('/v2/messages.info')
            .query({ message: messageId })
            .reply(400, {
                statusCode: 400,
                error: 'Bad Request',
                message: 'message is required'
            });

        client.messages.info(messageId).then((result) => {

            done('API errors in responses not caught');
        })
        .catch((error) => {

            expect(error).to.be.an.error('Bad Request - message is required');
            done();
        });
    });
});

describe('contacts.upsert', () => {

    this.notifuseClient = new Notifuse(API_KEY, { baseUri: BASE_URI });

    it('returns a promise if no callback', (done) => {

        const promise = this.notifuseClient.contacts.upsert([{}]);

        expect(promise).to.be.an.object();
        expect(promise.then).to.be.a.function();
        expect(promise.catch).to.be.a.function();

        done();
    });

    it('returns an error if the contacts is not an array', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.contacts.upsert('no_array');
        }).to.throw('the first parameter must be an Array of contacts');

        done();
    });

    it('returns an error if the contacts Array is empty', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.contacts.upsert([]);
        }).to.throw('the first parameter (Array) must contain at least one object (contact)');

        done();
    });

    it('returns an error if the contact is not an object', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.contacts.upsert(['no_object']);
        }).to.throw('the contact Array[0] must be an Object');

        done();
    });

    it('returns an error if the callback is not a function', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.contacts.upsert([{}], 'no_function');
        }).to.throw('the second parameter must be a `callback(err, result)` function');

        done();
    });

    it('makes a hit to the API', (done) => {

        Nock.cleanAll();

        const payload = [{
            id: '123',
            profile: {
                $set: {
                    firstName: 'John',
                    lastName: 'Doe'
                }
            }
        }];

        Nock(HOST, { reqheaders: { 'authorization': 'Bearer ' + API_KEY } })
            .post('/v2/contacts.upsert', {
                contacts: payload
            })
            .reply(200, {
                statusCode: 200,
                success: true,
                inserted: [],
                updated: ['123'],
                failed: []
            });

        this.notifuseClient.contacts.upsert(payload).then((result) => {

            expect(result).to.be.an.object();
            expect(result.statusCode).to.equal(200);
            done();
        })
        .catch((error) => {

            done(error);
        });
    });
});


describe('messages.send', () => {

    this.notifuseClient = new Notifuse(API_KEY, { baseUri: BASE_URI });

    it('returns a promise if no callback', (done) => {

        const promise = this.notifuseClient.messages.send([{}]);

        expect(promise).to.be.an.object();
        expect(promise.then).to.be.a.function();
        expect(promise.catch).to.be.a.function();

        done();
    });

    it('returns an error if the first parameter is not an array', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.messages.send('no_array');
        }).to.throw('the first parameter (messages) must be an Array');

        done();
    });

    it('returns an error if the messages Array is empty', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.messages.send([]);
        }).to.throw('the first parameter (messages) must contain at least one object');

        done();
    });

    it('returns an error if a message is not an object', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.messages.send(['no_object']);
        }).to.throw('messages Array[0] must be an Object');

        done();
    });

    it('returns an error if the callback is not a function', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.messages.send([{}], 'no_function');
        }).to.throw('the second parameter must be a `callback(err, result)` function');

        done();
    });

    it('makes a hit to the API', (done) => {

        Nock.cleanAll();

        const payload = [{
            notification: 'welcome',
            channel: 'postmark-notifuse',
            template: 'en',
            contact: '123',
            contactProfile: {
                $set: {
                    email: 'john@yopmail.com'
                }
            }
        }];

        Nock(HOST, { reqheaders: { 'authorization': 'Bearer ' + API_KEY } })
            .post('/v2/messages.send', {
                messages: payload
            })
            .reply(200, {
                statusCode: 200,
                success: true,
                queued: [{}],
                failed: []
            });

        this.notifuseClient.messages.send(payload).then((result) => {

            expect(result).to.be.an.object();
            expect(result.statusCode).to.equal(200);
            done();
        })
        .catch((error) => {

            done(error);
        });
    });
});



describe('Messages info', () => {

    this.notifuseClient = new Notifuse(API_KEY, { baseUri: BASE_URI });

    it('returns a promise if no callback', (done) => {

        const promise = this.notifuseClient.messages.info('message_id');

        expect(promise).to.be.an.object();
        expect(promise.then).to.be.a.function();
        expect(promise.catch).to.be.a.function();

        done();
    });

    it('returns an error if the message is not a string', (done) => {

        const self = this;

        expect(() => {

            self.notifuseClient.messages.info(false);
        }).to.throw('the first parameter must be a message ID string');

        done();
    });

    it('makes a hit to the API', (done) => {

        Nock.cleanAll();

        const messageId = 'message_id';

        Nock(HOST, { reqheaders: { 'authorization': 'Bearer ' + API_KEY } })
            .persist()
            .get('/v2/messages.info')
            .query({ message: messageId })
            .reply(200, {
                statusCode: 200,
                message: {}
            });

        this.notifuseClient.messages.info(messageId).then((result) => {

            expect(result).to.be.an.object();
            expect(result.statusCode).to.equal(200);
            done();
        })
        .catch((error) => {

            done(error);
        });
    });
});
