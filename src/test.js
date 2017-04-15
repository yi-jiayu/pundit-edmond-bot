"use strict";

import 'source-map-support/register';
import './env'

import peb from './pundit-edmond-bot';

peb.handle({
  message: {
    message_id: 1,
    text: '/standings',
    entities: [{type: 'bot_command', offset: 0, length: 10}],
    chat: {
      id: 1
    }
  }
})
  .then(console.log)
  .catch(console.error);