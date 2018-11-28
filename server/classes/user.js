var {
	colorPalette
} = require('../../config/colorPalette.json');
class User {
	constructor(id) {
		this.id = id;
		this.name = id;
		this.room = null;
		this.color = this.genColor();
		this.score = 0;
		this.artist = false;
		this.guessedIt = false;
	}
	genColor() {
		return colorPalette[colorPalette.length * Math.random() << 0];
	}
}
module.exports = User;