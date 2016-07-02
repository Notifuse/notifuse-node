# Node library for the Notifuse API

[Notifuse](https://notifuse.com) connects all your notification channels (SenGrid, Mailgun, Twilio SMS, Slack, push...) to a powerful API/platform that handles templating, contacts segmentation and smart campaigns.

We recommend you to read the [API Reference](https://notifuse.com/docs/api) to understand the behavior and results of every methods.

## Installation

```bashp
npm install notifuse --save
```

## Usage

```js
var Notifuse = require('notifuse'),
    client = new Notifuse.Client(API_KEY, options);
```

### Client options

| Key         | Expected value.                                  |
|-------------|--------------------------------------------------|
| timeout     | Request timeout in ms. Default 5000.             |
| maxAttempts | Max retry attempts. Default 5.                   |
| retryDelay  | Delay between retry attempts in ms. Default 250. |
| agent       | Https agent for the requests.                    |

### Upsert contacts
```js

// upsert an array of contacts

var myContact = {
  id: '123',
  profile: {
    $set: {
      firstName: 'John',
      lastName: 'Doe'
    }
  }  
};

client.contacts.upsert([myContact], function(error, result){
  if (error) {
   // handle error
  }

  // result example:
  // { 
  //   statusCode: 200,
  //   success: true,
  //   inserted: [],
  //   updated: ['123'],
  //   failed: []
  // }

});

// same with a promise

client.contacts.upsert([myContact]).then(function(result){

})
.catch(function(error){

});

```

### Send messages
```js

var Notifuse = require('notifuse'),
    client = new Notifuse.Client(API_KEY);

var myMessage = {
  notification: 'welcome',
  channel: 'sendgrid-acme',
  template: 'v1',
  contact: '123',
  contactProfile: {
    $set: {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  templateData: {
    _verificationToken: 'xxx'
  } 
};

client.messages.send([myMessage], function(error, result){
  if (error) {
   // handle error
  }

  // result example:
  // { 
  //   statusCode: 200,
  //   success: true,
  //   queued: [{ ... }],
  //   failed: []
  // }

});

// same with a promise

client.messages.send([myMessage]).then(function(result){

})
.catch(function(error){

});

```

### Retrieve a message
```js

var Notifuse = require('notifuse'),
    client = new Notifuse.Client(API_KEY);

var myMessageId = 'xxxxxxxxxxxxxxxx';

client.messages.info(myMessageId, function(error, result){
  if (error) {
   // handle error
  }

  // result is a message object defined in the API Reference
});

// same with a promise

client.messages.info([myMessage]).then(function(result){

})
.catch(function(error){

});

```

## Support

Feel free to create a new Github issue if it concerns this library, otherwise use our [contact form](https://notifuse.com/contact).

## Copyright

Copyright &copy; Notifuse, Inc. MIT License; see LICENSE for further details.