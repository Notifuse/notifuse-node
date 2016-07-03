'use strict';

const Request = require('request');
const Hoek = require('hoek');
const Https = require('https');
const Async = require('async');
const Utils = require('./utils.js');

const internals = {};



// Client

internals.Client = function (apiKey, options) {

    if (!options) {
        options = {};
    }

    Hoek.assert(typeof apiKey === 'string', 'Your project API key is required!');
    Hoek.assert(typeof options === 'object', 'Options should be an Object!');


    const defaults = {
        baseUri: 'https://api.notifuse.com/v2/',
        agent: new Https.Agent({ maxSockets: Infinity }),
        timeout: 5000, // ms
        maxAttempts: 5,
        retryDelay: 250 // ms
    };

    this.apiKey = apiKey;

    this.options = Hoek.applyToDefaults(defaults, options);

    this.contacts = new internals.Contacts(this._makeAPICall.bind(this));
    this.messages = new internals.Messages(this._makeAPICall.bind(this));
};


internals.Client.prototype._makeAPICall = function (settings, callback) {

    const options = {
        method: settings.method,
        url: this.options.baseUri + settings.endpoint,
        headers: {
            'Authorization': 'Bearer ' + this.apiKey,
            'User-Agent': 'node-client v' + require('../version')
        },
        qs: settings.query || {},
        json: settings.payload || true,
        timeout: this.options.timeout,
        agent: this.options.agent
    };

    const strategy = {
        times: (this.options.maxAttempts < 1) ? 1 : this.options.maxAttempts,
        retryDelay: this.options.retryDelay
    };

    // console.log('options', options);
    // console.log('strategy', strategy);

    Async.retry(strategy, (done, previousResult) => {

        Request(options, (error, response, body) => {

            // console.log('error', error);
            if (error) {
                return done(error);
            }

            if (response && response.statusCode >= 400) {
                let message = response.statusCode + ' ' + body;

                if (body.error) {
                    message = body.error;
                }

                if (body.error && body.message) {
                    message += ' - ' + body.message;
                }

                return done(new Error(message));
            }

            done(null, body);
        });

    }, callback);
};


// Contacts

internals.Contacts = function (makeAPICall) {

    this.name = 'contacts';
    this.makeAPICall = makeAPICall;
};

// Contacts.upsert

internals.Contacts.prototype.upsert = function (contacts, callback) {

    Hoek.assert(callback === undefined || typeof callback === 'function', 'the second parameter must be a `callback(err, result)` function');
    Hoek.assert(Array.isArray(contacts), 'the first parameter must be an Array of contacts');
    Hoek.assert(contacts.length > 0, 'the first parameter (Array) must contain at least one object (contact)');

    contacts.forEach((contact, i) => {

        Hoek.assert(typeof contact === 'object', 'the contact Array[' + i + '] must be an Object');
    });

    if (!callback) {
        return Utils.promisify(this, this.upsert, [contacts]);
    }

    return this.makeAPICall({
        method: 'POST',
        endpoint: 'contacts.upsert',
        payload: { contacts: contacts }
    }, callback);
};


// Messages

internals.Messages = function (makeAPICall) {

    this.name = 'messages';
    this.makeAPICall = makeAPICall;
};

internals.Messages.prototype.send = function (messages, callback) {

    Hoek.assert(callback === undefined || typeof callback === 'function', 'the second parameter must be a `callback(err, result)` function');
    Hoek.assert(Array.isArray(messages), 'the first parameter (messages) must be an Array');
    Hoek.assert(messages.length > 0, 'the first parameter (messages) must contain at least one object');

    messages.forEach((contact, i) => {

        Hoek.assert(typeof contact === 'object', 'messages Array[' + i + '] must be an Object');
    });

    if (!callback) {
        return Utils.promisify(this, this.send, [messages]);
    }

    return this.makeAPICall({
        method: 'POST',
        endpoint: 'messages.send',
        payload: { messages: messages }
    }, callback);
};

internals.Messages.prototype.info = function (message, callback) {

    Hoek.assert(callback === undefined || typeof callback === 'function', 'the second parameter must be a `callback(err, result)` function');
    Hoek.assert(typeof message === 'string', 'the first parameter must be a message ID string');

    if (!callback) {
        return Utils.promisify(this, this.info, [message]);
    }

    return this.makeAPICall({
        method: 'GET',
        endpoint: 'messages.info',
        query: { message: message }
    }, callback);
};

module.exports = internals.Client;
