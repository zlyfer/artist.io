var uuid = require('uuid');
var dictionaries = require('../../config/dictionaries.json')['dictionaries'];
var errors = require('../../config/errors.json');
var User = require('./user.js')
class Room {
	constructor(name, owner, language) {
		this.name = name;
		this.id = uuid();
		this.owner = owner;
		this.language = language;
		this.gamestate = 'In Lobby';
		this.word = '';
		this.chatlog = [];
		this.players = {};
		this.dictionaries = dictionaries[this.language];
		this.options = {
			slots: {
				name: 'Max. Players',
				id: 'maxplayers',
				min: 2,
				max: 99,
				type: 'number',
				value: 10,
				current: 0
			},
			drawTime: {
				name: 'Draw Time',
				id: 'drawtime',
				min: 30,
				max: 900,
				type: 'number',
				value: 60,
				current: 0
			},
			rounds: {
				name: 'Max. Rounds',
				id: 'maxrounds',
				min: 1,
				max: 99,
				type: 'number',
				value: 10,
				current: 0
			},
			artistScore: {
				name: 'Artist Score',
				id: 'artistscore',
				type: 'toggle',
				value: true
			},
			showHints: {
				name: 'Show Hints',
				id: 'showhints',
				type: 'toggle',
				value: true
			}
		}
	}

	getPlayerList() {
		let playerList = [];
		for (let player of Object.keys(this.players)) {
			playerList.push(this.players[player]);
		}
		return playerList;
	}

	// getDictionaryList() {
	// 	let dictionaryList = [];
	// 	for (let dictionary of Object.keys(this.dictionaries)) {
	// 		dictionaryList.push(this.dictionaries[dictionary]);
	// 	}
	// 	return dictionaryList;
	// }

	getHint() {
		// TODO!
		return this.word;
	}

	addPlayer(user) {
		if (user.id in this.players) {
			console.log(errors['01'], `${user.id} => ${this.id}`);
			return [true, errors['01']];
		} else if (this.options.slots.current < this.options.slots.value) {
			user.room = this.id;
			this.players[user.id] = user;
			this.options.slots.current++;
			return [false];
		} else {
			console.log(errors['02'], `${user.id} => ${this.id}`);
			return [true, errors['02']];
		}
	}

	removePlayer(user) {
		delete this.players[user.id];
		this.options.slots.current--;
	}

	addMessage(author, type, content) {
		this.chatlog.push({
			author: author.name,
			authorcolor: author.color,
			type: type,
			content: content
		});
	}
}
module.exports = Room;