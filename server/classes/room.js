// jshint esversion: 6
const shortid = require("shortid");
const dictionaries = require("../../config/dictionaries.json").dictionaries;
const errors = require("../../config/errors.json");
class Room {
	constructor(name, owner, language) {
		this.id = shortid.generate();
		this.owner = owner;
		this.name = name;
		this.language = language;
		this.players = {};
		this.spectators = {};
		this.dictionaries = dictionaries[this.language];
		this.chatlog = [];
		this.canvas = null;
		this.gamestate = "In Lobby";
		this.customEnd = null;
		this.toScore = {};
		this.word = {
			actual: "",
			hidden: "",
			revealed: [],
			used: []
		};
		this.artist = {
			actual: null,
			used: []
		};
		this.options = {
			roomName: {
				id: "roomName",
				name: "Room Name",
				type: "text",
				min: 1,
				max: 16,
				value: name,
				dependencies: false,
				disabled: false
			},
			roomLang: {
				id: "roomLang",
				name: "Room Language",
				type: "select",
				list: Object.keys(dictionaries),
				value: language,
				dependencies: false,
				disabled: false
			},
			slots: {
				id: "slots",
				name: "Max. Players",
				type: "number",
				min: 2,
				max: 99,
				value: 10,
				current: 0,
				spectators: 0,
				dependencies: false,
				disabled: false
			},
			drawTime: {
				id: "drawTime",
				name: "Draw Time",
				type: "number",
				min: 30,
				max: 900,
				value: 90,
				current: 0,
				dependencies: false,
				disabled: false
			},
			rounds: {
				id: "rounds",
				name: "Max. Rounds",
				type: "number",
				min: 1,
				max: 99,
				value: 10,
				current: 0,
				dependencies: false,
				disabled: false
			},
			waitTime: {
				id: "waitTime",
				name: "Wait Time",
				type: "number",
				min: 1,
				max: 60,
				value: 5,
				current: 0,
				dependencies: false,
				disabled: false
			},
			multiWords: {
				id: "multiWords",
				name: "Allow Used Words",
				type: "toggle",
				value: false,
				dependencies: false,
				disabled: false
			},
			chooseWords: {
				id: "chooseWords",
				name: "Choose Words",
				type: "toggle",
				value: false,
				dependencies: false,
				disabled: false
			},
			wordsCount: {
				id: "wordsCount",
				name: "Choosable Words",
				type: "select",
				list: [2, 3, 4, 5],
				value: 3,
				dependencies: [
					{
						name: "chooseWords",
						value: true
					}
				],
				disable: false
			},
			chooseTime: {
				id: "chooseTime",
				name: "Time To Choose",
				type: "number",
				min: 3,
				max: 60,
				value: 8,
				current: 0,
				dependencies: [
					{
						name: "chooseWords",
						value: true
					}
				],
				disabled: false
			},
			artistScore: {
				id: "artistScore",
				name: "Artist Score",
				type: "toggle",
				value: true,
				dependencies: false,
				disabled: false
			},
			showHints: {
				id: "showHints",
				name: "Show Hints",
				type: "toggle",
				value: true,
				dependencies: false,
				disabled: false
			},
			hintLevel: {
				id: "hintLevel",
				name: "Max. Word Reveal",
				type: "select",
				list: ["25%", "50%", "75%"],
				value: "50%",
				dependencies: [
					{
						name: "showHints",
						value: true
					}
				],
				disabled: false
			},
			allowSpectators: {
				id: "allowSpectators",
				name: "Allow Spectators",
				type: "toggle",
				value: true,
				dependencies: false,
				disabled: false
			},
			allowSpectatorChat: {
				id: "allowSpectatorChat",
				name: "Allow Spectator Chat",
				type: "toggle",
				value: false,
				dependencies: [
					{
						name: "allowSpectators",
						value: true
					}
				],
				disabled: false
			},
			showWordToSpectators: {
				id: "showWordToSpectators",
				name: "Show Word To Spectators",
				type: "toggle",
				value: false,
				dependencies: [
					{
						name: "allowSpectators",
						value: true
					}
				],
				disabled: false
			}
		};
	}

	applyOptions() {
		this.name = this.options.roomName.value;
		this.language = this.options.roomLang.value;
		this.dictionaries = dictionaries[this.language];
	}

	getPlayerList() {
		let playerList = [];
		for (let player of Object.keys(this.players)) {
			playerList.push(this.players[player]);
		}
		for (let player of Object.keys(this.spectators)) {
			playerList.push(this.spectators[player]);
		}
		return playerList;
	}

	startGame() {
		return this.nextRound();
	}

	endRound() {
		for (let player in this.players) {
			if (this.toScore[player])
				this.players[player].score += this.toScore[player];
		}
		this.options.drawTime.current = 0;
		if (this.options.rounds.current >= this.options.rounds.value) {
			return true;
		}
		return false;
	}

	nextRound() {
		if (Object.keys(this.players).length <= 1) {
			return false;
		}
		this.customEnd = null;
		for (let player in this.players)
			this.players[player].changeTitle("guesser");
		this.pickWord();
		this.pickArtist();
		this.word.revealed = [];
		this.options.rounds.current++;
		this.gamestate = `In Game (${this.options.rounds.current}/${
			this.options.rounds.value
		})`;
		return true;
	}

	endGame() {
		this.gamestate = "End Game";
		this.word.actual = "";
		this.word.used = [];
	}

	resetGame() {
		this.gamestate = "In Lobby";
	}

	tick() {
		this.options.drawTime.current++;
		if (
			this.options.drawTime.current > this.options.drawTime.value ||
			this.customEnd != null
		) {
			return true;
		}
		this.genHidden();
		return false;
	}

	pickArtist() {
		let artistlist = Object.keys(this.players);
		artistlist = artistlist.filter(
			player => this.artist.used.includes(player) == false
		);
		let selartist = artistlist[Math.floor(Math.random() * artistlist.length)];
		if (
			this.artist.used.length == Object.keys(this.players).length ||
			selartist == undefined
		) {
			this.artist.used = [];
			this.pickArtist();
			return;
		}
		this.artist.used.push(selartist);
		this.artist.actual = selartist;
		this.players[selartist].changeTitle("artist");
	}

	getWordList(filter) {
		let wordlist = [];
		for (let dict of this.dictionaries) {
			if (dict.activated) wordlist = wordlist.concat(dict.words);
		}
		if (filter)
			wordlist = wordlist.filter(word => filter.includes(word) == false);
		return wordlist;
	}

	pickWord() {
		let wordlist = this.getWordList();
		if (this.options.multiWords.value == false)
			wordlist = this.getWordList(this.word.used);
		let selword = wordlist[Math.floor(Math.random() * wordlist.length)];
		if (
			this.word.used.length == this.getWordList().length ||
			selword == undefined
		) {
			this.word.used = [];
			this.pickWord();
			return;
		}
		this.word.used.push(selword);
		this.word.actual = selword;
	}

	genHidden() {
		// Fill this.word.revealed:
		let hintlevel = 0;
		if (this.options.showHints.value)
			hintlevel = parseInt(
				this.options.hintLevel.value.substr(
					0,
					this.options.hintLevel.value.length - 1
				)
			);
		let wordprogress =
			this.options.drawTime.current / (this.options.drawTime.value / 100);
		let maxreveal = Math.ceil(hintlevel * (this.word.actual.length / 100));
		// Thanks to: https://gist.github.com/AugustMiller/85b54d49493bb71ba81e
		let toreveal = Math.ceil(
			((wordprogress - 0) * (maxreveal - 0)) / (100 - 0) + 0
		);
		for (let i = 0; i < toreveal - this.word.revealed.length; i++) {
			let nextreveal = 0;
			do {
				nextreveal = Math.floor(Math.random() * this.word.actual.length - 1);
			} while (
				this.word.revealed.includes(nextreveal) ||
				this.word.actual[nextreveal] == " "
			);
			this.word.revealed.push(nextreveal);
		}
		// Generate hint based on this.word.revealed:
		this.word.hidden = "";
		for (let i = 0; i < this.word.actual.length; i++) {
			if (this.word.actual[i] === " ") {
				this.word.hidden += " ";
			} else {
				if (this.word.revealed.includes(i)) {
					this.word.hidden += this.word.actual[i];
				} else {
					this.word.hidden += "_";
				}
				if (i < this.word.actual.length - 1) this.word.hidden += " ";
			}
		}
		return this.word.hidden;
	}

	solved(user) {
		user.changeTitle("solver");
		let score = Math.floor(Math.random() * 100); // TODO: Calculate score.
		this.toScore[user.id] = score;
	}

	genScoreboard() {
		let scoreboard = [];
		for (let ply in this.players) {
			let player = this.players[ply];
			let entry = {
				name: player.name,
				score: player.score
			};
			scoreboard.push(entry);
		}
		scoreboard.sort(function(a, b) {
			return b.score - a.score;
		});
		let place = 0;
		scoreboard.forEach(entry => {
			place++;
			entry.place = place;
		});
		return scoreboard;
	}

	addPlayer(user) {
		if (user.id in this.players) {
			return [true, errors.alreadyjoined];
		} else if (this.options.slots.current < this.options.slots.value) {
			user.room = this.id;
			this.players[user.id] = user;
			this.options.slots.current++;
			return [false, errors.success];
		} else {
			return [true, errors.roomfull];
		}
	}

	removePlayer(user) {
		user.room = null;
		delete this.players[user.id];
		this.options.slots.current--;
	}

	addSpectator(user) {
		if (user.id in this.spectators) {
			return [true, errors.alreadyjoinedspectator];
		} else if (this.options.allowSpectators.value == false) {
			return [true, errors.nospectator];
		} else {
			user.room = this.id;
			this.spectators[user.id] = user;
			this.options.slots.spectators++;
			return [false, errors.success];
		}
	}

	removeSpectator(user) {
		user.room = null;
		delete this.spectators[user.id];
		this.options.slots.spectators--;
	}

	addMessage(author, type, content) {
		this.chatlog.push({
			author: author.name,
			authorcolor: author.color,
			type: type,
			content: content
		});
	}

	getChatlog(type) {
		if (type == "secret") return this.chatlog;
		else {
			let chatlog = [];
			this.chatlog.forEach(message => {
				if (message.type != "spectator" && message.type != "secret")
					chatlog.push(message);
			});
			return chatlog;
		}
	}
}
module.exports = Room;
