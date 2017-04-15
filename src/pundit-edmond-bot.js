"use strict";

import Bot from './Bot';

function new_tweet(text) {
  const Twitter = require('twitter');

  const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

  return new Promise((resolve, reject) => {
    client.post('statuses/update', {status: text}, (err, tweet) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(tweet['id_str']);
      }
    });
  });
}

function get_fpl_standings() {
  const request = require('request');

  return new Promise((resolve, reject) => {
    request.get(`https://fantasy.premierleague.com/drf/leagues-classic-standings/${process.env.FPL_LEAGUE_ID}`,
      (err, res, body) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(JSON.parse(body));
        }
      });
  });
}

function format_standings(standings) {
  let text = '';
  const top_score = standings[0].total;

  for (const item of standings) {
    switch (item.rank) {
      case 1:
        text += "🏆";
        break;
      case 2:
        text += "🥈";
        break;
      case 3:
        text += "🥉";
        break;
      case 4:
        text += "4⃣";
        break;
      case 5:
        text += "5⃣";
        break;
      case 6:
        text += "💩";
        break;
      default:
        text += item.rank;
    }

    switch (item.movement) {
      case 'up':
        text += '🔺';
        break;
      case 'down':
        text += '🔻';
        break;
      case 'same':
        text += '▫';
        break;
      default:
        text += item.movement;
    }

    if (item.rank === 1) {
      text += ` ${item.entry_name} (${item.total})\n`
    } else {
      const difference = top_score - item.total;
      text += ` ${item.entry_name} (-${difference})\n`
    }
  }

  text += '\nUpdated at ' + new Date().toUTCString();

  return text;
}

const peb = new Bot();

// tweet command handler
peb.new_handler(update => {
  const {ok, command} = Bot.is_bot_command(update);

  return ok && command === 'tweet';
}, update => {
  //noinspection EqualityComparisonWithCoercionJS
  if (update.message.chat.id != process.env.ATTACHED_CHAT_ID) {
    return {
      method: 'sendMessage',
      chat_id: update.message.chat.id,
      text: 'Oops, you are not authorised to tweet to this account.'
    };
  }

  const {args} = Bot.is_bot_command(update);

  if (args.length === 0) {
    return {
      method: 'sendMessage',
      chat_id: update.message.chat.id,
      reply_to_message_id: update.message.message_id,
      reply_markup: JSON.stringify({force_reply: true, selective: true}),
      text: 'What would you like to tweet?'
    };
  } else {
    return new_tweet(args)
      .then(tweet_id => {
        const tweet_url = `https://twitter.com/${process.env.TWITTER_USERNAME}/status/${tweet_id}`;

        return {
          method: 'sendMessage',
          chat_id: update.message.chat.id,
          reply_to_message_id: update.message.message_id,
          text: `Success! View ${process.env.TWITTER_NAME}'s latest tweet at ${tweet_url}`
        };
      });
  }
});

// text message handler
peb.new_handler(update => {
  const {ok} = Bot.is_bot_command(update);

  return !ok && update.hasOwnProperty('message') && update.message.hasOwnProperty('text');
}, update => {
  //noinspection EqualityComparisonWithCoercionJS
  if (update.message.chat.id != process.env.ATTACHED_CHAT_ID) {
    return {
      method: 'sendMessage',
      chat_id: update.message.chat.id,
      text: 'Oops, you are not authorised to tweet to this account.'
    };
  }

  return new_tweet(update.message.text)
    .then(tweet_id => {
      const tweet_url = `https://twitter.com/${process.env.TWITTER_USERNAME}/status/${tweet_id}`;

      return {
        method: 'sendMessage',
        chat_id: update.message.chat.id,
        reply_to_message_id: update.message.message_id,
        text: `Success! View ${process.env.TWITTER_NAME}'s latest tweet at ${tweet_url}`
      };
    });
});

// standings command handler
peb.new_handler(update => {
  const {ok, command} = Bot.is_bot_command(update);

  return ok && command === 'standings';
}, update => {
  return get_fpl_standings()
    .then(standings => {
      const league = standings['league']['name'].trim();

      return {
        method: 'sendMessage',
        chat_id: update.message.chat.id,
        text: `Here are the current standings for the ${league} league:\n\n${format_standings(standings['standings']['results'])}`
      };
    });
});

export default peb;
