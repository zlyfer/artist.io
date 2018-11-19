var User = require('./user.js')
class Room {
	constructor(name, creator) {
		this.name = name;
		this.players = {};
		this.chat = [];
		this.canvas = null;
		this.artist = null;
		this.artists = [];
		this.creator = creator;
		this.gamestate = "Lobby";
		this.round = 0;
		this.slots = {
			"used": 0,
			"available": 5
		}
	}
	joinPlayer(user) {
		if (this.slots.used == this.slots.available || user.id in this.players) {
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
	addMessage(author, message) {
		this.chat.push({
			"author": author,
			"message": message
		});
	}
	nextArtist() {
		let keys = Object.keys(this.players);
		let a;
		if (keys.length == this.artists.length) {
			this.artists = [];
		}
		do {
			a = this.players[keys[keys.length * Math.random() << 0]];
		} while (this.artists.includes(a.id))
		this.artists.push(a.id);
		this.artist = a.id;
		a.artist = true;
		return this.players;
	}
}
module.exports = Room;