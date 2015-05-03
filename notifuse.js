var request = require('request');

var createClient = function(apiKey, options){

  if(!apiKey) throw new Error("Your Notifuse API key is required to init the client: `init(apiKey)`");

  var client = {
    apiKey: apiKey,
    debug: (options.debug === true) ? true : false,
    host: options.host || 'https://api.notifuse.com/v1',
    messages: [],
    logger: options.logger || null
  };


  /**
      addMessage(message)
      ---
      this function adds a message to next sendMessages() call

      // todo: add URL to the docs about message structure

      message:object                  the message object
  */
  client.addMessage = function(message){

    if(typeof message !== 'object') {
      throw new Error("The message should be an object: `addMessage(message)`");
    }

    client.messages.push(message);

    client.log('info', 'message added', message);
  };


  /**
      log(level, message, metadata)
      ---
      this function logs a message with the provided logger in options.logger
      with logger.log(level, message, metadata)

      level:string                  the log level
      message:string                the log message
      metadata:object               optionnal metadata json object
  */
  client.log = function(level, message, metadata){

    if(client.logger) {
      if(metadata) client.logger.log(level, message, metadata);
      else client.logger.log(level, message);
    }
    else if(client.debug) {
      if(metadata) console.log(message, metadata);
      else console.log(message);
    }
  };


  /**
      send(callback)
      ---
      this function sends messages to the API endpoint

      callback:function(err:Error, result:object)   callback is called when the request is
                                                    finished or an error occurs
  */
  client.send = function(callback){

    var result = {};

    client.log('info', 'sending '+this.messages.length+' messages');

    if(this.messages.length == 0) {

      result = {
        'code': '200',
        'success': true,
        'queued': [],
        'failed': []
      };

      callback(null, result);
    }

    var requestOptions = {
      method : 'POST',
      url : client.host+'/messages',
      headers: {
        'Authorization': 'Bearer '+client.apiKey
      },
      json: {messages: client.messages}
    };

    client.log('info', 'request', requestOptions);

    client.request_(requestOptions, 200, function(err, result){

      if(err) {
        client.log('error', 'send messages failed');
        return callback(err);
      }

      client.log('info', 'messages sent', result);

      callback(null, result);
    });
  };


  /**
      request_(options, expectedStatusCode, callback)
      ---
      this function performs an HTTP request with provided options
      and returns formatted result

      options:object                                request options
      expectedStatusCode:interger                   expected status code of the response
      callback:function(err:Error, result:object)   callback is called when the request is
                                                    finished or an error occurs
  */
  client.request_ = function(options, expectedStatusCode, callback) {

    request(options, function (err, response, data) {

      if(err) {
        client.log('error', err);
        return callback(err);
      }

      client.log('info', 'HTTP response', data);

      if(response.statusCode !== expectedStatusCode) {

        client.log('warning', 'request failed, status code: '+response.statusCode+', expected: '+expectedStatusCode, response.body);

        return callback(null, {
          code: response.statusCode,
          success: false,
          error: response.body
        });
      }
      
      callback(null, data);
    });
  };

  return client;
};

module.exports = {
  init: createClient
};