// jshint esversion: 9
const notifications = require("../../config/notifications.json");
class User {
  constructor(id) {
    this.id = id;
    this.owner = false;
    this.name = `Unnamed${Math.floor(1000 + Math.random() * 9000)}`;
    this.score = 0;
    this.room = null;
    this.color = Math.floor(Math.random() * 315);
    this.title = "waiting";
    this.titleicon = "clock";
    // artist: <i class="fas fa-paint-brush"></i>
    // spectator: <i class="fas fa-eye"></i>
    // guesser: <i class="fas fa-question-circle"></i>
    // solver: <i class="fas fa-check-circle"></i>
    // owner: <i class="fas fa-crown"></i>
    // waiting: <i class="fas fa-clock"></i>
  }
  changeName(username) {
    this.name = username;
  }
  changeColor(usercolor) {
    this.color = usercolor;
  }
  changeTitle(title) {
    this.title = title;
    let titleicons = {
      artist: "paint-brush",
      spectator: "eye",
      guesser: "question-circle",
      solver: "check-circle",
      waiting: "clock",
    };
    this.titleicon = titleicons[title];
  }
  becomeOwner() {
    this.owner = true;
  }
}
module.exports = User;
