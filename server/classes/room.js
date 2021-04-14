// jshint esversion: 9
const shortid = require("shortid");
const dictionaries = require("../../config/dictionaries.json").dictionaries;
const notifications = require("../../config/notifications.json");
class Room {
  constructor(name, owner, language) {
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
    this.id = shortid.generate();
    this.name = name;
    this.language = language;
    this.owner = owner;
    this.players = {};
    this.spectators = {};
    this.dictionaries = dictionaries[language];
    this.canvas = null;
    /*
    0: Lobby
    1: Game (xx/xx)
    */
    this.gamestate = {
      state: 0,
      text: "Lobby",
    };
  }
  // TODO: Add functions:
  addSpectator(user) {
    user.room = this.id;
    this.spectators[user.id] = user;
    this.options.slots.spectators++;
  }
  addPlayer(user) {
    user.room = this.id;
    this.players[user.id] = user;
    this.options.slots.current++;
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
  spectateble() {
    return this.options.allowSpectators.value;
  }
  userInRoom(user) {
    return user.id in this.spectators || user.id in this.players;
  }
  isFull() {
    return this.options.slots.current >= this.options.slots.value;
  }
  time() {
    return this.options.drawTime.value - this.options.drawTime.current;
  }
}
module.exports = Room;
