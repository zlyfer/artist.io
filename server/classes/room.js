var uuid = require('uuid');
var dictionaries = require('../../config/dictionaries.json')["dictionaries"];
var errors = require('../../config/errors.json');
var User = require('./user.js')
class Room {
	constructor(name, creator, language) {
		this.name = name;
		this.id = uuid(); // TODO: Make use of.
		this.creator = creator;
		this.language = language;
		this.players = {};
		this.gamestate = "Lobby";
		this.chat = [];
		this.dictionaries = {};
		this.word = {
			word: "",
			hint: ""
		};
		this.options = {
			"maxPlayers": 5,
			"drawTime": 60,
			"maxRounds": 10,
			"artistScore": true,
			"showHints": true
		};
		this.slots = {
			used: 0,
			left: this.options["maxPlayers"],
			available: this.options["maxPlayers"]
		};
		this.time = {
			used: 0,
			left: this.options["drawTime"],
			available: this.options["drawTime"]
		};
		this.rounds = {
			used: 0,
			left: this.options["maxRounds"],
			available: this.options["maxRounds"]
		};
	}

	addPlayer(user) {
		if (user.id in this.players) {
			console.log(errors["01"], `${user.id} => ${this.id}`);
			return [true, errors["01"]];
		} else if (this.slots.used < this.slots.available) {
			user.room = this.id;
			this.players[user.id] = user;
			this.slots.used++;
			return [false];
		} else {
			console.log(errors["02"], `${user.id} => ${this.id}`);
			return [true, errors["02"]];
		}
	}
	removePlayer(user) {
		delete this.players[user.id];
		this.slots.used--;
	}
}
module.exports = Room;