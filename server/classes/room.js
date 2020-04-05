// jshint esversion: 6
const shortid = require("shortid");
const dictionaries = require("../../config/dictionaries.json").dictionaries;
const notifications = require("../../config/notifications.json");
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
    this.canvas = null;
    this.gamestate = "In Lobby";
    this.customEnd = null;
    this.toScore = {};
    this.word = {
      actual: "",
      hidden: "",
      revealed: [],
      used: [],
      choosables: [],
    };
    this.artist = {
      actual: null,
      used: [],
    };
    this.options = {
      roomName: {
        id: "roomName",
        name: "Room Name",
        description: "The name of the room.",
        type: "text",
        min: 1,
        max: 16,
        value: name,
        dependencies: false,
        disabled: false,
      },
      roomLang: {
        id: "roomLang",
        name: "Room Language",
        description: "The room language. Affects the dictionaries.",
        type: "select",
        list: Object.keys(dictionaries),
        value: language,
        dependencies: false,
        disabled: false,
      },
      slots: {
        id: "slots",
        name: "Max. Players",
        description: "How many players/spectators can join the room.",
        type: "number",
        min: 2,
        max: 99,
        value: 10,
        current: 0,
        spectators: 0,
        dependencies: false,
        disabled: false,
      },
      drawTime: {
        id: "drawTime",
        name: "Draw Time",
        description: "The amount of seconds you can draw.",
        type: "number",
        min: 30,
        max: 900,
        value: 90,
        current: 0,
        dependencies: false,
        disabled: false,
      },
      rounds: {
        id: "rounds",
        name: "Max. Rounds",
        description: "How many rounds each game has.",
        type: "number",
        min: 1,
        max: 99,
        value: 10,
        current: 0,
        dependencies: false,
        disabled: false,
      },
      waitTime: {
        id: "waitTime",
        name: "Wait Time",
        description: "How many seconds between the rounds.",
        type: "number",
        min: 1,
        max: 60,
        value: 5,
        current: 0,
        dependencies: false,
        disabled: false,
      },
      multiWords: {
        id: "multiWords",
        name: "Allow Used Words",
        description: "Allow words that were already picked.",
        type: "toggle",
        value: false,
        dependencies: false,
        disabled: false,
      },
      chooseWords: {
        id: "chooseWords",
        name: "Choose Words",
        description: "Let the artist choose which word he has to draw.",
        type: "toggle",
        value: false,
        dependencies: false,
        disabled: true,
      },
      wordsCount: {
        id: "wordsCount",
        name: "Choosable Words",
        description: "How many words the artist can choose from.",
        type: "select",
        list: [2, 3, 4, 5],
        value: 3,
        dependencies: [
          {
            name: "chooseWords",
            value: true,
          },
        ],
        disabled: false,
      },
      chooseTime: {
        id: "chooseTime",
        name: "Time To Choose",
        description: "How many seconds the artist has time to choose a word.",
        type: "number",
        min: 3,
        max: 60,
        value: 8,
        current: 0,
        dependencies: [
          {
            name: "chooseWords",
            value: true,
          },
        ],
        disabled: false,
      },
      artistScore: {
        id: "artistScore",
        name: "Artist Score",
        description: "Give points to the artist too.",
        type: "toggle",
        value: true,
        dependencies: false,
        disabled: false,
      },
      showHints: {
        id: "showHints",
        name: "Show Hints",
        description: "Reveal some parts of the word during the round.",
        type: "toggle",
        value: true,
        dependencies: false,
        disabled: false,
      },
      hintLevel: {
        id: "hintLevel",
        name: "Max. Hints",
        description: "How much percentage of the word to reveal during each round.",
        type: "select",
        list: ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%"],
        value: "20%",
        dependencies: [
          {
            name: "showHints",
            value: true,
          },
        ],
        disabled: false,
      },
      showSpecials: {
        id: "showSpecials",
        name: "Show Special Characters",
        description: "Show all special characters right of the beginning.",
        type: "toggle",
        value: true,
        dependencies: [
          {
            name: "showHints",
            value: true,
          },
        ],
        disabled: true,
      },
      allowSpectators: {
        id: "allowSpectators",
        name: "Allow Spectators",
        description: "Allow people to spectate the room.",
        type: "toggle",
        value: true,
        dependencies: false,
        disabled: false,
      },
      allowSpectatorChat: {
        id: "allowSpectatorChat",
        name: "Allow Spectator Chat",
        description: "Allow spectators to chat in their seperate text channel.",
        type: "toggle",
        value: false,
        dependencies: [
          {
            name: "allowSpectators",
            value: true,
          },
        ],
        disabled: false,
      },
      showWordToSpectators: {
        id: "showWordToSpectators",
        name: "Show Word To Spectators",
        description: "Reveal the whole word to spectators.",
        type: "toggle",
        value: false,
        dependencies: [
          {
            name: "allowSpectators",
            value: true,
          },
        ],
        disabled: false,
      },
    };
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

  startGame() {
    this.updateGamestate();
    this.pickWord();
    return this.nextSemiRound();
  }

  endRound() {
    for (let player in this.players) {
      if (this.toScore[player]) this.players[player].score += this.toScore[player];
    }
    this.options.drawTime.current = 0;
    this.options.waitTime.current = 0;
    if (this.options.rounds.current > this.options.rounds.value) {
      return true;
    }
    return false;
  }

  nextSemiRoundNonChooseableWords() {
    this.pickWord();
    return this.nextSemiRound();
  }

  nextSemiRound() {
    for (let player in this.players) this.players[player].changeTitle("guesser");
    this.word.revealed = [];
    this.customEnd = null;
    let doNextRound = this.pickArtist();
    if (doNextRound) {
      return this.nextRound();
    }
    return true;
  }

  nextRound() {
    if (Object.keys(this.players).length <= 1) {
      return false;
    }
    this.updateGamestate();
    return true;
  }

  endGame() {
    this.gamestate = "End Game";
    this.word.actual = "";
    this.options.rounds.current = 0;
    this.word.used = [];
    this.artist = {
      actual: null,
      used: [],
    };
    for (var player in this.players) {
      this.players[player].score = 0;
    }
  }

  resetGame() {
    this.gamestate = "In Lobby";
  }

  updateGamestate() {
    this.options.rounds.current++;
    this.gamestate = `In Game (${this.options.rounds.current}/${this.options.rounds.value})`;
  }

  tickChoosableWord() {
    this.options.chooseTime.current++;
  }

  tick() {
    this.options.drawTime.current++;
    if (this.options.drawTime.current > this.options.drawTime.value || this.customEnd != null) {
      return true;
    }
    this.genHidden();
    return false;
  }

  pickArtist() {
    let artistlist = Object.keys(this.players);
    artistlist = artistlist.filter((player) => this.artist.used.includes(player) == false);
    let selartist = artistlist[Math.floor(Math.random() * artistlist.length)];
    if (this.artist.used.length == Object.keys(this.players).length || selartist == undefined) {
      this.artist.used = [];
      this.pickArtist();
      return true;
    }
    this.artist.used.push(selartist);
    this.artist.actual = selartist;
    this.players[selartist].changeTitle("artist");
    return false;
  }

  getWordList(filter) {
    let wordlist = [];
    for (let dict of this.dictionaries) {
      if (dict.activated) wordlist = wordlist.concat(dict.words);
    }
    if (filter) wordlist = wordlist.filter((word) => filter.includes(word) == false);
    return wordlist;
  }

  genChoosableWords() {
    this.word.choosables.push("TEST1");
    this.word.choosables.push("TEST2");
    this.word.choosables.push("TEST3");
  }

  pickWord() {
    let wordlist = this.getWordList();
    if (this.options.multiWords.value == false) wordlist = this.getWordList(this.word.used);
    let selword = wordlist[Math.floor(Math.random() * wordlist.length)];
    if (this.word.used.length == this.getWordList().length || selword == undefined) {
      this.word.used = [];
      this.pickWord();
      return;
    }
    this.word.used.push(selword);
    this.word.actual = selword;
  }

  genHidden() {
    // Fill this.word.revealed:
    let hintlevel = 0;
    if (this.options.showHints.value)
      hintlevel = parseInt(this.options.hintLevel.value.substr(0, this.options.hintLevel.value.length - 1));
    let wordprogress = this.options.drawTime.current / (this.options.drawTime.value / 100);
    let maxreveal = Math.ceil(hintlevel * (this.word.actual.length / 100));
    // Thanks to: https://gist.github.com/AugustMiller/85b54d49493bb71ba81e
    let toreveal = Math.ceil(((wordprogress - 0) * (maxreveal - 0)) / (100 - 0) + 0);
    for (let i = 0; i < toreveal - this.word.revealed.length; i++) {
      let nextreveal = 0;
      do {
        nextreveal = Math.floor(Math.random() * this.word.actual.length - 1);
      } while (this.word.revealed.includes(nextreveal) || this.word.actual[nextreveal] == " ");
      this.word.revealed.push(nextreveal);
    }
    // Generate hint based on this.word.revealed:
    this.word.hidden = "";
    for (let i = 0; i < this.word.actual.length; i++) {
      if (this.word.actual[i] === " ") {
        this.word.hidden += " ";
      } else {
        if (this.word.revealed.includes(i)) {
          this.word.hidden += this.word.actual[i];
        } else {
          this.word.hidden += "";
        }
        // if (i < this.word.actual.length - 1) this.word.hidden += "-";
      }
    }
    return this.word.hidden;
  }

  solved(user) {
    user.changeTitle("solver");
    let score = 1; // Calculate a proper score.
    this.toScore[user.id] = score;
  }

  genScoreboard() {
    let scoreboard = [];
    for (let ply in this.players) {
      let player = this.players[ply];
      let entry = {
        name: player.name,
        score: player.score,
      };
      scoreboard.push(entry);
    }
    scoreboard.sort(function (a, b) {
      return b.score - a.score;
    });
    let place = 0;
    scoreboard.forEach((entry) => {
      place++;
      entry.place = place;
    });
    return scoreboard;
  }

  addPlayer(user) {
    if (user.id in this.players) {
      return [true, notifications.alreadyjoined];
    } else if (this.options.slots.current < this.options.slots.value) {
      user.room = this.id;
      this.players[user.id] = user;
      this.options.slots.current++;
      return [false, notifications.success];
    } else {
      return [true, notifications.roomfull];
    }
  }

  removePlayer(user) {
    user.room = null;
    delete this.players[user.id];
    this.options.slots.current--;
  }

  addSpectator(user) {
    if (user.id in this.spectators) {
      return [true, notifications.alreadyjoinedspectator];
    } else if (this.options.allowSpectators.value == false) {
      return [true, notifications.nospectator];
    } else {
      user.room = this.id;
      this.spectators[user.id] = user;
      this.options.slots.spectators++;
      return [false, notifications.success];
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
      content: content,
    });
  }

  getChatlog(type) {
    if (type == "secret") return this.chatlog;
    else {
      let chatlog = [];
      this.chatlog.forEach((message) => {
        if (message.type != "spectator" && message.type != "secret") chatlog.push(message);
      });
      return chatlog;
    }
  }
}
module.exports = Room;
