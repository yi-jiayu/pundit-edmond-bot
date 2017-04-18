"use strict";

import request from 'request';

import Bot from './Bot';
import App from './wit.ai';

const players = {
  edmond: {
    team_id: 143284,
    canonical_name: 'Edmond'
  },
  sng: {
    team_id: 863324,
    canonical_name: 'Andrew Sng'
  },
  junkai: {
    team_id: 825497,
    canonical_name: 'Jun Kai'
  },
  tuyong: {
    team_id: 870316,
    canonical_name: 'Tu Yong'
  },
  anand: {
    team_id: 821363,
    canonical_name: 'Andrew Anand'
  },
  mark: {
    team_id: 828271,
    canonical_name: 'Mark'
  }
};

function get_team_id(name) {
  name = name.trim().toUpperCase();

  switch (name) {
    case 'ED':
    case 'EDMOND':
      return players.edmond.team_id;
    case 'SNG':
      return players.sng.team_id;
    case 'ANAND':
      return players.anand.team_id;
    case 'JUN KAI':
    case 'JK':
    case 'JUNKAI':
      return players.junkai.team_id;
    case 'TY':
    case 'TUYONG':
    case 'TU YONG':
      return players.tuyong.team_id;
    case 'MARK':
      return players.mark.team_id;
    default:
      throw new Error(`failed to associate ${name} with a team id`);
  }
}

function get_canonical_name(name) {
  const normalised = name.trim().toUpperCase();

  switch (normalised) {
    case 'ED':
    case 'EDMOND':
      return players.edmond.canonical_name;
    case 'SNG':
      return players.sng.canonical_name;
    case 'ANAND':
      return players.anand.canonical_name;
    case 'JUN KAI':
    case 'JK':
    case 'JUNKAI':
      return players.junkai.canonical_name;
    case 'TY':
    case 'TUYONG':
    case 'TU YONG':
      return players.tuyong.canonical_name;
    case 'MARK':
      return players.mark.canonical_name;
    default:
      throw new Error(`failed to find player ${name}`);
  }
}

function get_fpl_standings() {
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

function get_team_info(team_id) {
  return new Promise((resolve, reject) => {
    request.get(`https://fantasy.premierleague.com/drf/entry/${team_id}`,
      (err, res, body) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(JSON.parse(body));
        }
      });
  });
}

function get_squad_value(team_id) {
  return get_team_info(team_id)
    .then(team => team['entry']['value'] / 10);
}

function get_bank_value(team_id) {
  return get_team_info(team_id)
    .then(team => team['entry']['bank'] / 10);
}

function get_weekly_points(team_id) {
  return get_team_info(team_id)
    .then(team => team['entry']['summary_event_points']);
}

function perform_action(update, action, entities) {
  let name;

  switch (action) {
    case 'getStandings':
      return get_fpl_standings()
        .then(standings => {
          const league = standings['league']['name'].trim();

          return create_reply(
            update.message.chat.id,
            `Here are the current standings for the ${league} league:\n\n${format_standings(standings['standings']['results'])}`);
        });
    case 'getSquadValue':
      name = entities['contact'][0].value;

      return get_squad_value(get_team_id(name))
        .then(value => create_reply(
          update.message.chat.id,
          `${get_canonical_name(name)}'s squad value is £${value}M.`
        ));
    case 'getWeeklyPoints':
      name = entities['contact'][0].value;

      return get_weekly_points(get_team_id(name))
        .then(points => create_reply(
          update.message.chat.id,
          `${get_canonical_name(name)} got ${points} points this week.`
        ));
  }
}

function create_reply(chat_id, text, options = {}) {
  const reply = {
    method: 'sendMessage',
    chat_id,
    text
  };

  if (options.parse_mode) {
    reply.parse_mode = options.parse_mode;
  }

  if (options.reply_markup) {
    reply.reply_markup = options.reply_markup;
  }

  return reply;
}

const peb = new Bot();

// text message handler
peb.new_handler(update => {
  const {ok} = Bot.is_bot_command(update);

  return !ok && update.hasOwnProperty('message') && update.message.hasOwnProperty('text');
}, update => {
  const app = new App(process.env.WIT_AI_TOKEN);

  const session_id = update.update_id;
  const text = update.message.text;

  return app.new_conversation(session_id, text)
    .then(res => {
      console.log(JSON.stringify(res));

      if (res.type === 'action') {
        return perform_action(update, res.action, res.entities);
      }
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
