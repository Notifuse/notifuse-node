'use strict';

const Notifuse = require('../notifuse');
const Code = require('code');
const Lab = require('lab');
const Https = require('https');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const it = lab.test;
const expect = Code.expect;

const TEST_HOST = process.env.MOCK_HOST || 'https://localapi.notifuse.com';
const API_KEY = process.env.API_KEY || require('./api_key');

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
        expect(client.options.host).to.be.a.string();
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
            host: 'new_host',
            agent: new Https.Agent(agentOptions),
            timeout: 1337,
            maxAttempts: 1337,
            retryDelay: 1337
        };

        const client = new Notifuse(API_KEY, newOptions);

        expect(client.options).to.be.an.object();
        expect(client.options.host).to.equal(newOptions.host);
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


describe('Contacts upsert', () => {

    it('returns a promise if no callback', (done) => {

        const client = new Notifuse(API_KEY);

        const promise = client.contacts.upsert([]);

        expect(promise).to.be.an.object();
        expect(promise.then).to.be.a.function();
        expect(promise.catch).to.be.a.function();

        done();
    });

    it('returns an error if the contacts is not an array', (done) => {

        const client = new Notifuse(API_KEY);

        client.contacts.upsert('no_array').catch((error) => {

            expect(error).to.be.an.error('the first parameter (contacts) must be an Array');
        });

        done();
    });

    it('returns an error if the contact is not an object', (done) => {

        const client = new Notifuse(API_KEY);

        client.contacts.upsert(['no_object']).catch((error) => {

            expect(error).to.be.an.error('the first parameter (contacts) must contain at least one object');
        });

        done();
    });

    it('returns an error if the callback is not a function', (done) => {

        const client = new Notifuse(API_KEY);

        expect(() => {

            client.contacts.upsert([{}], 'no_function');
        }).to.throw('the second parameter must be a `callback(err, result)` function');

        done();
    });

    it('upserts a valid contact', (done) => {

        const client = new Notifuse(API_KEY, { host: TEST_HOST });
        const contact = {
            id: '123',
            profile: {
                $set: {
                    firstName: 'John',
                    lastName: 'Doe'
                }
            }
        };

        client.contacts.upsert([contact]).then((result) => {

            expect(result).to.be.an.object();
            expect(result.statusCode).to.equal(200);
            expect(result.success).to.be.true();
            expect(result.inserted).to.be.an.array();
            expect(result.updated).to.be.an.array();
            expect(result.failed).to.be.an.array().to.have.length(0);
        })
        .catch((error) => {

            Code.fail(error);
        });

        done();
    });

    it('fails to upsert a non valid contact', (done) => {

        const client = new Notifuse(API_KEY, { host: TEST_HOST });
        const contactWithoutId = {
            profile: {
                $set: {
                    firstName: 'John',
                    lastName: 'Doe'
                }
            }
        };

        client.contacts.upsert([contactWithoutId]).then((result) => {

            expect(result).to.be.an.object();
            expect(result.statusCode).to.equal(200);
            expect(result.success).to.be.false();
            expect(result.inserted).to.be.an.array().to.have.length(0);
            expect(result.updated).to.be.an.array().to.have.length(0);
            expect(result.failed).to.be.an.array().to.have.length(1);
        })
        .catch((error) => {

            Code.fail(error);
        });

        done();
    });
});


describe('Messages send', () => {

    it('returns a promise if no callback', (done) => {

        const client = new Notifuse(API_KEY);

        const promise = client.messages.send([]);

        expect(promise).to.be.an.object();
        expect(promise.then).to.be.a.function();
        expect(promise.catch).to.be.a.function();

        done();
    });

    it('returns an error if the contacts is not an array', (done) => {

        const client = new Notifuse(API_KEY);

        client.messages.send('no_array').catch((error) => {

            expect(error).to.be.an.error('the first parameter (messages) must be an Array');
        });

        done();
    });

    it('returns an error if the contact is not an object', (done) => {

        const client = new Notifuse(API_KEY);

        client.messages.send(['no_object']).catch((error) => {

            expect(error).to.be.an.error('the first parameter (messages) must contain at least one object');
        });

        done();
    });

    it('returns an error if the callback is not a function', (done) => {

        const client = new Notifuse(API_KEY);

        expect(() => {

            client.messages.send([{}], 'no_function');
        }).to.throw('the second parameter must be a `callback(err, result)` function');

        done();
    });

    it('makes a hit to the API', (done) => {

        const client = new Notifuse(API_KEY, { host: TEST_HOST });
        const message = {
            notification: 'welcome',
            channel: 'postmark-notifuse',
            template: 'en',
            contact: '123',
            contactProfile: {
                $set: {
                    email: 'john@yopmail.com'
                }
            }
        };

        client.messages.send([message]).then((result) => {

            expect(result).to.be.an.object();
            expect(result.statusCode).to.be.a.number();
        })
        .catch((error) => {

            Code.fail(error);
        });

        done();
    });
});



describe('Messages info', () => {

    it('returns a promise if no callback', (done) => {

        const client = new Notifuse(API_KEY);

        const promise = client.messages.info('message_id');

        expect(promise).to.be.an.object();
        expect(promise.then).to.be.a.function();
        expect(promise.catch).to.be.a.function();

        done();
    });

    it('returns an error if the message is not a string', (done) => {

        const client = new Notifuse(API_KEY);

        client.messages.info(false).catch((error) => {

            expect(error).to.be.an.error('the first parameter must be a message ID string');
        });

        done();
    });

    it('makes a hit to the API', (done) => {

        const client = new Notifuse(API_KEY, { host: TEST_HOST });

        client.messages.info('message_id').then((result) => {

            expect(result).to.be.an.object();
            expect(result.statusCode).to.be.a.number();
        })
        .catch((error) => {

            Code.fail(error);
        });

        done();
    });
});
