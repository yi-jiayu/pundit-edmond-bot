"use strict";

export default class Bot {
  constructor() {
    this.handlers = [];
  }

  new_handler(filter, callback) {
    this.handlers.push({filter, callback});
  }

  /**
   *
   * @param update
   * @return {Promise}
   */
  handle(update) {
    for (const handler of this.handlers) {
      if (typeof handler.filter === 'function') {
        const hit = !!handler.filter(update);

        if (hit) {
          return Promise.resolve(handler.callback(update));
        }
      }
    }

    return Promise.reject(new Error('unhandled update'));
  }

  /**
   * Returns the command if the update contains a message with a bot command, false otherwise.
   * @param update
   * @return {{ok: boolean, [command]: string, [args]: string}}
   */
  static is_bot_command(update) {
    let message;

    if (update.hasOwnProperty('message')) {
      message = update.message;
      // } else if (update.hasOwnProperty('edited_message')) {
      //   message = update.edited_message;
    } else {
      return {ok: false};
    }

    if (message.hasOwnProperty('text') && message.hasOwnProperty('entities')) {
      const command_entity = update.message.entities.find(e => e.type === 'bot_command');

      if (command_entity) {
        let command = update.message.text.substr(command_entity.offset, command_entity.length);
        let args = update.message.text.substr(command_entity.offset + command_entity.length);

        // strip tags and drop the beginning slash from the command
        command = command.replace(/@\w+/g, '').substr(1);

        // collapse whitespace and trim args
        args = args.replace(/\s+/g, ' ').trim();

        return {ok: true, command, args};
      } else {
        return {ok: false};
      }
    } else {
      return {ok: false};
    }
  }
}
