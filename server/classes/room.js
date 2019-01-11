var shortid = require('shortid');
var dictionaries = require('../../config/dictionaries.json')['dictionaries'];
var errors = require('../../config/errors.json');
var User = require('./user.js')
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
		this.word = '';
		this.gamestate = 'In Lobby';
		this.options = {
			roomName: {
				id: 'roomName',
				name: "Room Name",
				type: "text",
				min: 1,
				max: 16,
				value: name,
				dependencies: false,
				disabled: false
			},
			roomLang: {
				id: 'roomLang',
				name: "Room Language",
				type: "select",
				list: Object.keys(dictionaries),
				value: language,
				dependencies: false,
				disabled: false
			},
			slots: {
				id: 'slots',
				name: 'Max. Players',
				min: 2,
				max: 99,
				type: 'number',
				value: 10,
				current: 0,
				spectators: 0,
				dependencies: false,
				disabled: false
			},
			drawTime: {
				id: 'drawTime',
				name: 'Draw Time',
				min: 30,
				max: 900,
				type: 'number',
				value: 60,
				current: 0,
				dependencies: false,
				disabled: false
			},
			rounds: {
				id: 'rounds',
				name: 'Max. Rounds',
				min: 1,
				max: 99,
				type: 'number',
				value: 10,
				current: 0,
				dependencies: false,
				disabled: false
			},
			artistScore: {
				id: 'artistScore',
				name: 'Artist Score',
				type: 'toggle',
				value: true,
				dependencies: false,
				disabled: false
			},
			showHints: {
				id: 'showHints',
				name: 'Show Hints',
				type: 'toggle',
				value: true,
				dependencies: false,
				disabled: false
			},
			allowSpectators: {
				id: 'allowSpectators',
				name: 'Allow Spectators',
				type: 'toggle',
				value: true,
				dependencies: false,
				disabled: false
			},
			allowSpectatorChat: {
				id: 'allowSpectatorChat',
				name: 'Allow Spectator Chat',
				type: 'toggle',
				value: false,
				dependencies: [{
					name: 'allowSpectators',
					value: true
				}],
				disabled: false
			},
			showWordToSpectators: {
				id: 'showWordToSpectators',
				name: 'Show Word To Spectators',
				type: 'toggle',
				value: false,
				dependencies: [{
					name: 'allowSpectators',
					value: true
				}],
				disabled: false
			}
		}
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
			return [true, errors['alreadyjoined']];
		} else if (this.options.slots.current < this.options.slots.value) {
			user.room = this.id;
			this.players[user.id] = user;
			this.options.slots.current++;
			return [false, errors['success']];
		} else {
			return [true, errors['roomfull']];
		}
	}

	removePlayer(user) {
		user.room = null;
		delete this.players[user.id];
		this.options.slots.current--;
	}
	addSpectator(user) {
		if (user.id in this.spectators) {
			return [true, errors['alreadyjoinedspectator']];
		} else if (this.options.allowSpectators.value == false) {
			return [true, errors['nospectator']];
		} else {
			user.room = this.id;
			this.spectators[user.id] = user;
			this.options.slots.spectators++;
			return [false, errors['success']];
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
}
module.exports = Room;