var errors = require('../../config/errors.json');
class User {
	constructor(id) {
		this.id = id;
		this.name = "Unnamed";
		this.score = 0;
		this.room = null;
		this.color = Math.floor(Math.random() * 315);
	}
	changeName(username) {
		this.name = username;
	}
	changeColor(usercolor) {
		this.color = usercolor;
	}
}
module.exports = User;