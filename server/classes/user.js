var colorPalette = require('../../config/colorPalette.json')["colorPalette"];
var errors = require('../../config/errors.json');
class User {
	constructor(id) {
		this.id = id;
		this.name = "Unnamed";
		this.score = 0;
		this.room = null;
		this.color = this.genColor();
	}
	genColor() {
		return colorPalette[colorPalette.length * Math.random() << 0];
	}
	changeName(username) {
		let oldname = this.name
		this.name = username;
	}
}
module.exports = User;