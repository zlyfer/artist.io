// jshint esversion: 6

// TODO: Custom word list.
// TODO: Choosable words.

// NOT TESTING:
// const fs = require("fs");
// const https = require("https");
// const options = {
//   key: fs.readFileSync("/etc/letsencrypt/live/medievo.de-0001/privkey.pem"),
//   cert: fs.readFileSync("/etc/letsencrypt/live/medievo.de-0001/cert.pem"),
//   ca: fs.readFileSync("/etc/letsencrypt/live/medievo.de-0001/chain.pem"),
//   rejectUnauthorized: false
// };
// const server = https.createServer(options);
// END

// TESTING: Server
const http = require("http");
const server = http.createServer();
// END

const fs = require("fs");
const hashes = require("jshashes");
const io = require("socket.io")(server);
const { colors } = require("../config/colors.json");
const notifications = require("../config/notifications.json");
const User = require("./classes/user.js");
const Room = require("./classes/room.js");

var rooms = {};
var users = {};
var tickIntervals = {};
var tickIntervals2 = {};

io.on("connection", (socket) => {
  socket.emit("connected");
  newConnection(socket);
  sendRoomList(socket);
  socket.on("checkJoinOrCreate", checkJoinOrCreate);
  socket.on("renameAndJoin", renameAndJoin);
  socket.on("renameAndSpectate", (a, b, c, d, e) => {
    renameAndJoin(a, b, c, d, e, true, socket);
  });
  socket.on("viewartgallery", viewartgallery);
  socket.on("sendMessage", sendMessage);
  socket.on("updateLobby", updateLobby);
  socket.on("startGame", startGame);
  socket.on("updateCanvas", updateCanvas);
  socket.on("disconnect", removeUser);
});

function viewartgallery(username, password, socket = this) {
  if (!checkUserExists(username)) socket.emit("toast", notifications.nouser);
  else if (login(username, password, socket, false)) {
    socket.emit("toast", notifications.login2);
    socket.emit("viewartgallery", username);
    // TODO: Send images.
    getUserImages(username).forEach((image, index) => {
      setTimeout(() => {
        socket.emit("art", image.word, image.data);
      }, index * 200);
    });
  } else socket.emit("toast", notifications.wronglogin2);
}

function getUserImages(username) {
  let images = [];
  let dir = fs.readdirSync(`users/${username}/gallery`);
  dir.forEach((file) => {
    if (file.endsWith(".json")) {
      let content = JSON.parse(fs.readFileSync(`users/${username}/gallery/${file}`));
      let word = content.word;
      let image = fs.readFileSync(`users/${username}/gallery/${file.replace(".json", ".png")}`);
      let data = new Buffer.from(image).toString("base64");
      images.push({ word, data });
    }
  });
  return images;
}

function newConnection(socket) {
  let user = new User(socket.id);
  users[user.id] = user;
  socket.emit("getUserColor", user.color);
  socket.emit("getUsername", user.name);
  socket.emit("getColors", genColors());
  sendOnlinePlayers();
}

function genColors() {
  let colorlist = [];
  for (let strength = 3; strength <= 9; strength += 2) {
    for (let color of colors) {
      colorlist.push(`${color}${strength}`);
    }
  }
  return colorlist;
}

function sendRoomList(socket) {
  // let user = users[socket.id];
  socket.emit("getRoomlist", rooms);
}

function updateRoom(room) {
  let data = {
    header: {},
    userlist: {},
    lobby: {},
  };
  data.header.name = room.name;
  data.header.gamestate = room.gamestate;
  data.header.time = room.options.drawTime.value - room.options.drawTime.current;
  data.header.slots = {};
  data.header.slots.current = room.options.slots.current;
  data.header.slots.value = room.options.slots.value;
  data.header.slots.spectators = room.options.slots.spectators;
  data.userlist.players = room.getPlayerList();
  data.lobby.options = room.options;
  data.lobby.dictionaries = room.dictionaries;
  io.in(room.id).emit("updateRoom", data);
  sendAllowEdit(room);
  io.emit("getRoomlist", rooms);
}

function sendAllowEdit(room) {
  let socket = io.sockets.connected[room.owner.id];
  socket.in(room.id).emit("allowEdit", false);
  socket.emit("allowEdit", true);
}

function checkJoinOrCreate(roomname) {
  this.emit("checkJoinOrCreate", roomExists(roomname));
}

function sendOnlinePlayers() {
  io.emit("getOnlinePlayers", Object.keys(users).length);
}

function checkUserExists(username) {
  return fs.existsSync(`users/${username}`);
}

function createUser(username, password) {
  fs.mkdirSync(`users/${username}`);
  fs.mkdirSync(`users/${username}/gallery`);
  fs.writeFileSync(
    `users/${username}/login.json`,
    JSON.stringify({
      username,
      password,
    })
  );
}

function login(username, password, socket, create) {
  let user = checkUserExists(username);
  if (!user && create) {
    if (password != new hashes.SHA256().hex("")) {
      createUser(username, password);
      socket.emit("toast", notifications.registerd);
    } else socket.emit("toast", notifications.notregistered);
    return true;
  } else {
    let content = JSON.parse(fs.readFileSync(`users/${username}/login.json`));
    if (content.password == password) {
      if (create) socket.emit("toast", notifications.login);
      return true;
    } else {
      if (create) socket.emit("toast", notifications.wronglogin);
      return false;
    }
  }
}

function renameAndJoin(username, password, usercolor, roomname, language, spec = false, socket = this) {
  let user = users[socket.id];
  if (login(username, password, socket, true)) {
    user.changeName(username);
    user.changeColor(usercolor);
    if (spec) {
      user.changeTitle("spectator");
    } else {
      user.changeTitle();
    }
    let room = roomExists(roomname);
    let error = false;
    if (room) {
      if (spec) {
        error = room.addSpectator(user);
      } else {
        error = room.addPlayer(user);
      }
    } else if (spec == false) {
      user.changeTitle("owner");
      room = new Room(roomname, user, language);
      rooms[room.id] = room;
      clearTickInterval(room);
      error = room.addPlayer(user);
    }
    if (error[0]) {
      socket.emit("toast", error[1]);
    } else {
      socket.join(room.id);
      socket.emit("joinedRoom");
      updateRoom(room);
      if (spec) {
        socket.join(`secret-${room.id}`);
        newMessage(room, user, "join", "is spectating now.");
      } else {
        socket.join(`normal-${room.id}`);
        newMessage(room, user, "join", "joined the room.");
      }
    }
  }
}

function roomExists(roomname) {
  let exists = false;
  for (let id of Object.keys(rooms)) {
    if (rooms[id].name == roomname) {
      exists = rooms[id];
    }
  }
  return exists;
}

function updateLobby(opts, dicts) {
  let user = users[this.id];
  let room = rooms[user.room];
  if (user.id == room.owner.id) {
    if (!jsonCompare(room.dictionaries, dicts)) {
      room.dictionaries = dicts;
    }
    if (!jsonCompare(room.options, opts)) {
      room.options = opts;
      room.applyOptions();
    }
    updateRoom(room);
  } else {
    this.emit("toast", notifications.notowner);
    updateRoom(room);
  }
}

function startGame() {
  let user = users[this.id];
  let room = rooms[user.room];
  let socket = io.sockets.connected[user.id];
  if (user.id == room.owner.id) {
    if (room.options.chooseWords.value == true) {
      room.genChoosableWords();
      io.in(room.id).emit("choosableWords", room.word.choosables, room.options.chooseTime.value);
      tickIntervals[room.id] = setInterval(function () {
        room.tickChoosableWord();
        io.in(room.id).emit("tickChooseWord", room.options.chooseTime.value - room.options.chooseTime.current);
      }, 1000);
      setTimeout(function () {
        clearTickInterval(room);
        roomStartGame(room);
      }, room.options.chooseTime.value * 1000);
    } else {
      if (room.startGame()) roomStartGame(room);
    }
  } else socket.emit("toast", notifications.notownerstart);
}

function roomStartGame(room) {
  clearTickInterval(room);
  setupTickInterval(room);
  io.in(room.id).emit("startGame");
  updateRoom(room);
}

function setupTickInterval(room) {
  // if (rooms[room.id]) {
  distRoles(room);
  sendArtist(room);
  tickIntervals[room.id] = setInterval(function () {
    let timeup = room.tick();
    if (timeup) {
      if (checkUserExists(users[room.artist.actual].name)) saveToGallery(room);
      clearTickInterval(room);
      io.in(room.id).emit("tickNextIn", room.options.waitTime.value - room.options.waitTime.current);
      let gameover = room.endRound();
      if (gameover) {
        io.in(room.id).emit("endGame", room.customEnd || "Time Up!", room.word.actual, room.genScoreboard());
        room.endGame();
        tickIntervals[room.id] = setInterval(function () {
          room.options.waitTime.current++;
          if (room.options.waitTime.current >= room.options.waitTime.value) {
            clearInterval(tickIntervals[room.id]);
            room.resetGame();
            io.in(room.id).emit("resetGame");
            updateRoom(room);
          }
          io.in(room.id).emit("tickNextIn", room.options.waitTime.value - room.options.waitTime.current);
        }, 1000);
      } else {
        io.in(room.id).emit("endRound", room.customEnd || "Time Up!", room.word.actual);
        tickIntervals[room.id] = setInterval(function () {
          room.options.waitTime.current++;
          if (room.options.waitTime.current >= room.options.waitTime.value) {
            clearInterval(tickIntervals[room.id]);

            if (room.options.chooseWords.value == true) {
              room.genChoosableWords();
              io.in(room.id).emit("choosableWords", room.word.choosables, room.options.chooseTime.value);
              tickIntervals2[room.id] = setInterval(function () {
                room.tickChoosableWord();
                io.in(room.id).emit("tickChooseWord", room.options.chooseTime.value - room.options.chooseTime.current);
              }, 1000);
              setTimeout(function () {
                clearTickInterval2(room);
                if (room.nextSemiRound()) {
                  roomNextRound(room);
                }
              }, room.options.chooseTime.value * 1000);
            } else {
              if (room.nextSemiRoundNonChooseableWords()) roomNextRound(room);
            }
          }
          io.in(room.id).emit("tickNextIn", room.options.waitTime.value - room.options.waitTime.current);
        }, 1000);
      }
    } else {
      sendWord(room);
    }
    updateRoom(room);
    io.in(room.id).emit("tickNextIn", room.options.waitTime.value - room.options.waitTime.current);
  }, 1000);
  // }
}

function roomNextRound(room) {
  io.in(room.id).emit("nextRound");
  setupTickInterval(room);
  updateRoom(room);
}

function sendArtist(room) {
  let socket = io.sockets.connected[room.artist.actual];
  socket.in(room.id).emit("artist", false);
  socket.emit("artist", true);
  sendWord(room);
}

function distRoles(room) {
  for (let player in room.players) {
    let socket = io.sockets.connected[room.players[player].id];
    socket.leave(`secret-${room.id}`);
    socket.join(`normal-${room.id}`);
  }
  let socket = io.sockets.connected[room.artist.actual];
  socket.leave(`normal-${room.id}`);
  socket.join(`secret-${room.id}`);
}

function sendWord(room) {
  let socket = io.sockets.connected[room.artist.actual];
  if (socket) {
    socket.in(`normal-${room.id}`).emit("word", room.word.hidden);
    if (room.options.showWordToSpectators.value) {
      socket.in(`secret-${room.id}`).emit("word", room.word.hidden);
    } else {
      socket.in(`secret-${room.id}`).emit("word", "Hidden To Spectators");
    }
    socket.emit("word", room.word.actual);
  }
}

function clearTickInterval(room) {
  clearInterval(tickIntervals[room.id]);
  tickIntervals[room.id] = null;
}
function clearTickInterval2(room) {
  clearInterval(tickIntervals2[room.id]);
  tickIntervals2[room.id] = null;
}

function saveToGallery(room) {
  let author = users[room.artist.actual].name;
  let word = room.word.actual;
  let image = room.canvas.replace(/^data:image\/\w+;base64,/, "");

  let imagename = new hashes.SHA256().hex(image);
  let imagedata = {
    word,
  };

  fs.writeFileSync(`users/${author}/gallery/${imagename}.png`, new Buffer.from(image, "base64"));
  fs.writeFileSync(`users/${author}/gallery/${imagename}.json`, JSON.stringify(imagedata));
}

function updateCanvas(data) {
  let user = users[this.id];
  let room = rooms[user.room];
  if (room) {
    if (room.artist.actual == user.id) {
      room.canvas = data;
      this.in(room.id).emit("updateCanvas", room.canvas);
    } else {
      this.emit("toast", notifications.notartist);
    }
  }
}

function removeUser() {
  let user = users[this.id];
  let room = rooms[user.room];
  if (room) {
    if (user.title == "spectator") {
      room.removeSpectator(user);
    } else {
      room.removePlayer(user);
    }
    newMessage(room, user, "leave", "left the room.");
    if (user.id == room.owner.id && Object.keys(room.players).length != 0) {
      let trnd = Math.floor(Math.random() * (Object.keys(room.players).length - 1));
      let newOwner = room.players[Object.keys(room.players)[trnd]];
      newMessage(room, newOwner, "system", "is now the new room owner.");
      room.owner = newOwner;
      // NOTE: Uncommented:
      // if (room.gamestate == "In Lobby") {
      room.owner.changeTitle("owner");
      // }
    }
    if (user.id == room.artist.actual && Object.keys(room.players).length == 1) {
      // TODO: Reset the game if only one player is left.
      io.in(room.id).emit("endRound", "Artist Left!", room.word.actual);
    } else if (user.id == room.artist.actual) {
      io.in(room.id).emit("endRound", "Artist Left!", room.word.actual);
    }
    if (Object.keys(room.players).length == 0) {
      for (let spectator in room.spectators) {
        let socket = io.sockets.connected[room.spectators[spectator].id];
        socket.emit("closeRoom", notifications.roomclosedspectator);
        user.room = null;
      }
      deleteRoom(room);
    } else {
      updateRoom(room);
    }
  }
  deleteUser(user);
  sendOnlinePlayers();
}

function deleteRoom(room) {
  clearTickInterval(room);
  delete rooms[room.id];
  io.emit("getRoomlist", rooms);
}

function deleteUser(user) {
  delete users[user.id];
}

function sendMessage(content) {
  let user = users[this.id];
  let room = rooms[user.room];
  let socket = io.sockets.connected[user.id];
  switch (user.title) {
    case "solver":
      newMessage(room, user, "secret", content);
      break;
    case "artist":
      newMessage(room, user, "secret", content);
      break;
    case "spectator":
      if (room.options.allowSpectatorChat.value) {
        if (room.options.showWordToSpectators.value) {
          newMessage(room, user, "secret", content);
        } else {
          newMessage(room, user, "spectator", content);
        }
      }
      break;
    case "guesser":
      if (content.toLowerCase() == room.word.actual.toLowerCase()) {
        room.solved(user);
        socket.leave(`normal-${room.id}`);
        socket.join(`secret-${room.id}`);
        newMessage(room, user, "guessed", "has guessed the word!");
        if (Object.keys(room.toScore).length >= Object.keys(room.players).length - 1) {
          // -1 because the artist is as a player but cannot guess
          room.customEnd = "Everyone guessed the word!";
        }
      } else {
        newMessage(room, user, "normal", content);
      }
      break;
    default:
      newMessage(room, user, "normal", content);
      break;
  }
  updateRoom(room);
}

function newMessage(room, author, type, content) {
  room.addMessage(author, type, content);
  io.in(`normal-${room.id}`).emit("getChatlog", room.getChatlog("normal"));
  io.in(`secret-${room.id}`).emit("getChatlog", room.getChatlog("secret"));
}

function jsonCompare(obj1, obj2) {
  if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
    return true;
  } else {
    return false;
  }
}

server.listen(3000, function () {
  console.log("Server started.");
});
