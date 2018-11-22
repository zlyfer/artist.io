var {
	dictionaries
} = require('../../config/dictionaries.json');
var User = require('./user.js')
class Room {
	constructor(name, creator, language) {
		this.name = name;
		this.players = {};
		this.chat = [];
		this.canvas = "";
		this.artist = null;
		this.artists = [];
		this.guessedIt = [];
		this.creator = creator;
		this.gamestate = "Lobby";
		this.round = 1;
		this.maxRounds = 10;
		this.timer = 0;
		this.maxTimer = 60;
		this.dictionaries = [];
		this.currentWord = "";
		this.language = language;
		this.scheduleJob = null;
		this.slots = {
			"used": 0,
			"available": 5
		}
	}
	joinPlayer(user) {
		if (this.slots.used >= this.slots.available || user.id in this.players) {
			return false;
		} else {
			this.players[user.id] = user;
			this.slots.used++;
			user.room = this.name;
			return user;
		}
	}
	removePlayer(userid) {
		delete this.players[userid];
		this.slots.used--;
	}
	toggleDictionary(dictionary) {
		if (this.dictionaries.includes(dictionaries[this.language][dictionary])) {
			this.dictionaries.splice(this.dictionaries.indexOf(dictionaries[this.language][dictionary]), 1);
		} else {
			this.dictionaries.push(dictionaries[this.language][dictionary]);
		}
	}
	clearDictionaries() {
		this.dictionaries = {};
	}
	addMessage(author, message) {
		this.chat.push({
			"author": author,
			"message": message
		});
	}
	startRound(options) {
		this.maxTimer = options.drawTime;
		this.maxRounds = options.maxRounds;
		this.slots.available = options.maxPlayers;
		for (let dict in options.dictionaries) {
			this.toggleDictionary(options.dictionaries[dict]);
		}
		this.nextRound();
	}
	nextRound() {
		this.canvas = "";
		if (Object.keys(this.players).length <= this.artists.length) {
			this.round++;
		}
		this.gamestate = `In Game (Round ${this.round}/${this.maxRounds})`;
		this.nextArtist();
		this.pickWord();
		this.timer = this.maxTimer;
	}
	checkNextRound() {
		if (
			this.round >= this.maxRounds &&
			Object.keys(this.players).length <= this.artists.length
		) {
			this.gamestate = "End Game";
		}
	}
	nextGame() {
		this.artists = [];
		this.guessedIt = [];
		this.round = 1;
		this.chat = [];
		for (let player in this.players) {
			this.players[player].score = 0;
		}
	}
	endRound() {
		if (this.scheduleJob) {
			this.scheduleJob.cancel();
		}
		this.guessedIt = [];
	}
	tick() {
		this.timer--;
		if (this.timer == 0) {
			this.endRound();
		}
	}
	nextArtist() {
		if (this.artist && this.players[this.artist]) {
			this.players[this.artist].artist = false;
		}
		let keys = Object.keys(this.players);
		let a;
		if (keys.length <= this.artists.length) {
			this.artists = [];
		}
		do {
			a = this.players[keys[keys.length * Math.random() << 0]];
		} while (this.artists.includes(a.id))
		this.artists.push(a.id);
		this.artist = a.id;
		a.artist = true;
	}
	pickWord() {
		let keys = Object.keys(this.dictionaries);
		let dictionary = this.dictionaries[keys[keys.length * Math.random() << 0]];
		this.currentWord = dictionary[dictionary.length * Math.random() << 0];
	}
}
module.exports = Room;