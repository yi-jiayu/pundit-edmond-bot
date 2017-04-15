"use strict";

import 'source-map-support/register';
import './env';

import PunditEdmondBot from './pundit-edmond-bot';

const peb = PunditEdmondBot;

exports.main = function (req, res) {
  const update = req.body;

  console.log(JSON.stringify(update));

  peb.handle(update)
    .then(rpc => {
      console.log(rpc);
      res.json(rpc);
    })
    .catch(err => {
      console.error(err);
      res.status(200).end();
    });
};
