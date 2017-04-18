/**
 * Created by jiayu on 4/18/2017.
 */

import request from 'request';

const wit_ai_endpoint = 'https://api.wit.ai/';

export default class App {
  constructor(token) {
    this.token = token;
  }

  new_conversation(session_id, text) {
    return new Promise((resolve, reject) => {
      request({
        uri: wit_ai_endpoint + 'converse',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.token
        },
        qs: {
          q: text,
          session_id
        },
        json: true
      },
        (err, res, body) => {
          if (err) {
            return reject(err);
          } else if (res.status >= 400) {
            return reject(body);
          } else {
            return resolve(body);
          }
        });
    });
  }
}
