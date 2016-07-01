'use strict';

const Request = require('request');
const Hoek = require('hoek');
const Https = require('https');
const Async = require('async');

const internals = {};

// Utils

internals._wrap = function (bind, method, args) {

  return new Promise((resolve, reject) => {

    const callback = (error, result) => {

      if (error) {
        return reject(error);
      }

      return resolve(result);
    };

    method.apply(bind, args ? args.concat(callback) : [callback]);
  });
};


// Client

internals.Client = function(apiKey, options) {
  if (!options) {
    options = {};
  }

  Hoek.assert(typeof apiKey === 'string', 'Your project API key is required!');
  Hoek.assert(typeof options === 'object', 'Options should be an Object!');


  const defaults = {
    host: 'https://api.notifuse.com/v2/',
    agent: new Https.Agent({ maxSockets: Infinity }),
    timeout: 5000, // ms
    maxAttempts: 5,
    retryDelay: 250 // ms
  };

  this.apiKey = apiKey;

  this.options = Hoek.applyToDefaults(defaults, options);

  this.contacts = new internals.Contacts(this._makeAPICall.bind(this));
};


internals.Client.prototype._makeAPICall = function(settings, callback) {

  let options = {
    method: settings.method,
    url: this.options.host+settings.endpoint,
    headers: {
      'Authorization': 'Bearer '+this.apiKey,
      'User-Agent': 'node-client v'+require('./version')
    },
    qs: settings.query || {},
    json: settings.payload || true,
    timeout: this.options.timeout,
    agent: this.options.agent
  };

  let strategy = {
    times: this.options.maxAttempts,
    retryDelay: this.options.retryDelay
  };

  // console.log('options', options);
  // console.log('strategy', strategy);

  Async.retry(strategy, (done, previousResult) => {

    Request(options, (error, response, body) => {

      if (error) {
        return done(error);
      }
      
      if (response && response.statusCode >= 400) {
        let message = response.statusCode+' '+body;

        if (body.error) message = body.error;
        if (body.error && body.message) message += ' - '+body.message;

        return done(new Error(message));
      }

      done(null, body);
    });
    
  }, callback);
};


// Contacts

internals.Contacts = function(makeAPICall) {
  this.name = 'contacts';
  this.makeAPICall = makeAPICall;
};

// Contacts.upsert

internals.Contacts.prototype.upsert = function(contacts, callback) {

  if (!callback) {
    return internals._wrap(this, this.upsert, [contacts]);
  }

  try {
    Hoek.assert(Array.isArray(contacts), 'contacts must be an Array');
    Hoek.assert(contacts.length > 0, 'contacts must contain at least one object');

    contacts.forEach((contact, i) => {
      Hoek.assert(typeof contact === 'object', 'contacts['+i+'] must be an Object');
    });
  }
  catch (e) {
    return callback(e);
  }

  return this.makeAPICall({
    method: 'POST', 
    endpoint: 'contacts.upsert', 
    payload: {contacts: contacts}
  }, callback);
};


// Messages

internals.Messages = function(makeAPICall) {
  this.name = 'messages';
  this.makeAPICall = makeAPICall;
};

internals.Messages.prototype.send = function(messages, callback) {

  if (!callback) {
    return internals._wrap(this, this.send, [messages]);
  }

  try {
    Hoek.assert(Array.isArray(messages), 'messages must be an Array');
    Hoek.assert(messages.length > 0, 'messages must contain at least one object');

    messages.forEach((contact, i) => {
      Hoek.assert(typeof contact === 'object', 'messages['+i+'] must be an Object');
    });
  }
  catch (e) {
    return callback(e);
  }

  return this.makeAPICall({
    method: 'POST', 
    endpoint: 'messages.send', 
    payload: {messages: messages}
  }, callback);
};

internals.Messages.prototype.info = function(message, callback) {

  if (!callback) {
    return internals._wrap(this, this.info, [message]);
  }

  try {
    Hoek.assert(typeof message === 'string', 'message must be a message ID string');
  }
  catch (e) {
    return callback(e);
  }

  return this.makeAPICall({
    method: 'GET', 
    endpoint: 'messages.info', 
    query: {message: message}
  }, callback);
};

module.exports = internals.Client;
