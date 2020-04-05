// jshint esversion: 6
const errors = require("../../config/errors.json");
class User {
	constructor(id) {
		this.id = id;
		this.name = `Unnamed${Math.floor(1000 + Math.random() * 9000)}`;
		this.score = 0;
		this.room = null;
		this.color = Math.floor(Math.random() * 315);
		this.title = "default";
		this.titleicon = "clock";
		// artist: <i class="fas fa-paint-brush"></i>
		// spectator: <i class="fas fa-eye"></i>
		// guesser: <i class="fas fa-question-circle"></i>
		// solver: <i class="fas fa-check-circle"></i>
		// owner: <i class="fas fa-crown"></i>
		// default (aka 'waiter'): <i class="fas fa-clock"></i>
	}
	changeName(username) {
		this.name = username;
	}
	changeColor(usercolor) {
		this.color = usercolor;
	}
	changeTitle(title) {
		this.title = title;
		switch (title) {
			case "artist":
				this.titleicon = "paint-brush";
				break;
			case "spectator":
				this.titleicon = "eye";
				break;
			case "guesser":
				this.titleicon = "question-circle";
				break;
			case "solver":
				this.titleicon = "check-circle";
				break;
			case "owner":
				this.titleicon = "crown";
				break;
			default:
				this.titleicon = "clock";
				break;
		}
	}
}
module.exports = User;
