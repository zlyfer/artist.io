class User {
	constructor(id) {
		this.id = id;
		this.name = id;
		this.room = null;
		this.color = this.genColor();
		this.score = 0;
		this.artist = false;
	}
	genColor() {
		return "#FF0000";
	}
}
module.exports = User;