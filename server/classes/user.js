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
		let oldname = this.name
		this.name = username;
	}
}
module.exports = User;