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
		this.artistScore = true;
		this.artists = [];
		this.guessedIt = [];
		this.scores = {};
		this.creator = creator;
		this.gamestate = "Lobby";
		this.round = 1;
		this.maxRounds = 10;
		this.timer = 0;
		this.maxTimer = 60;
		this.dictionaries = {};
		this.usedWords = {};
		this.currentWord = "";
		this.hint = "";
		this.showHints = true;
		this.language = language;
		this.scheduleJob = null;
		this.slots = {
			"used": 0,
			"available": 5
		}
		this.endReason = "";
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
		if (this.scores[userid]) {
			delete this.scores[userid];
		}
		delete this.players[userid];
		this.slots.used--;
	}
	toggleDictionary(dictionary, enable = true, disable = true) {
		if (dictionary in this.dictionaries && disable) {
			delete this.dictionaries[dictionary];
		} else if (enable) {
			this.dictionaries[dictionary] = dictionaries[this.language][dictionary];
		}
	}
	addMessage(data) {
		this.chat.push(data);
	}
	startRound(options) {
		this.maxTimer = options.drawTime;
		this.maxRounds = options.maxRounds;
		this.slots.available = options.maxPlayers;
		this.artistScore = options.artistScore;
		this.showHints = options.showHints;
		this.applyDictionaries(options.dictionaries);
		this.nextRound();
	}
	applyDictionaries(dicts) {
		this.dictionaries = {};
		for (let i = 0; i < dicts.length; i++) {
			this.toggleDictionary(dicts[i], true, false);
		}
	}
	nextRound() {
		this.canvas = "";
		if (Object.keys(this.players).length <= this.artists.length) {
			this.round++;
		}
		this.gamestate = `In Game (Round ${this.round}/${this.maxRounds})`;
		this.nextArtist();
		this.pickWord();
		this.genHint(false);
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
		this.scores = {};
		this.hint = "";
		this.currentWord = "";
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
		this.scores = {};
		this.hint = "";
	}
	tick() {
		this.timer--;
		if (this.timer == 0) {
			this.endRound();
		}
		if (this.showHints) {
			this.genHint();
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
		let dictionary_name = Object.keys(this.dictionaries)[Object.keys(this.dictionaries).length * Math.random() << 0]
		let dictionary = this.dictionaries[dictionary_name];
		this.currentWord = dictionary[dictionary.length * Math.random() << 0];
		if (this.currentWord == undefined) {
			this.dictionaries = this.usedWords;
			this.usedWords = {};
			this.pickWord();
		} else {
			if (!(dictionary_name in this.usedWords)) {
				this.usedWords[dictionary_name] = [];
			}
			this.usedWords[dictionary_name].push(this.currentWord);
			this.dictionaries[dictionary_name].splice(this.dictionaries[dictionary_name].indexOf(this.currentWord), 1);
		}
	}
	genHint(hints = true) {
		let percentage = (this.maxTimer - this.timer) / (this.maxTimer / 100);
		let step = 90 / this.currentWord.length * 2;
		let amount = Math.floor(percentage / step);
		this.hint = "";
		for (let i = 0; i < this.currentWord.length; i++) {
			if (this.currentWord[i] == " ") {
				this.hint += "  ";
			} else if (i % 2 == 0 && amount > 0 && percentage != 100 && hints) {
				this.hint += this.currentWord[i] + " ";
				amount--;
			} else {
				this.hint += "_ ";
			}
		}
		this.hint = this.hint.substr(0, this.hint.length - 1);
	}
}
module.exports = Room;