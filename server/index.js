// jshint esversion: 9

const fs = require("fs");
const protocol = require("http");
// const protocol = require("https");
const hashes = require("jshashes");

let options = {};
// options = {
//   key: fs.readFileSync("/etc/letsencrypt/live/medievo.de-0001/privkey.pem"),
//   cert: fs.readFileSync("/etc/letsencrypt/live/medievo.de-0001/cert.pem"),
//   ca: fs.readFileSync("/etc/letsencrypt/live/medievo.de-0001/chain.pem"),
//   rejectUnauthorized: false,
// };
const server = protocol.createServer(options);
const io = require("socket.io")(server);

const Room = require("./classes/room.js");
const User = require("./classes/user.js");
const { colors } = require("../config/colors.json");
const notifications = require("../config/notifications.json");

var rooms = {};
var users = {};
var tickIntervals = {};

io.on("connection", (socket) => {
  let userInfos = addConnection(socket);
  socket.emit("connected");
  socket.emit("getUser", userInfos);
  socket.emit("getRoomlist", rooms);

  socket.on("checkJoinOrCreate", function (roomname) {
    this.emit("checkJoinOrCreate", roomExists(roomname));
  });
  socket.on("renameAndJoin", renameAndJoin);
  socket.on("renameAndSpectate", (a, b, c, d, e) => {
    renameAndJoin(a, b, c, d, e, true, socket);
  });
  socket.on("viewartgallery", viewartgallery);
  socket.on("disconnect", removeUser);
});

function removeUser() {
  let user = users[this.id];
  let room = rooms[user.room];

  io.emit("getOnlinePlayers", Object.keys(users).length);
  io.emit("getRoomlist", room);
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

function viewartgallery(username, password, socket = this) {
  if (!checkUserExists(username)) socket.emit("toast", notifications.nouser);
  else if (login(username, password, socket, false)) {
    socket.emit("toast", notifications.login2);
    socket.emit("viewartgallery", username);
    getUserImages(username).forEach((image, index) => {
      setTimeout(() => {
        socket.emit("art", image.word, image.data);
      }, index * 200);
    });
  } else socket.emit("toast", notifications.wronglogin2);
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

function sendAllowEdit(room) {
  let socket = io.sockets.connected[room.owner.id];
  socket.in(room.id).emit("allowEdit", false);
  socket.emit("allowEdit", true);
}

function updateRoom(room) {
  let data = {
    header: {},
    userlist: {},
    lobby: {},
  };
  data.header.name = room.name;
  data.header.gamestate = room.gamestate.text;
  data.header.time = room.time();
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

function sendMessage(room, user, type, text) {
  let message = {
    user: user.name,
    color: user.color,
    text: text,
    type: type,
  };
  if (type == "join" || type == "leave" || type == "guessed" || type == "newowner") {
    io.in(room.id).emit("message", message);
  }
}

function renameAndJoin(username, password, usercolor, roomname, language, spec = false, socket = this) {
  let user = users[socket.id];
  if (login(username, password, socket, true)) {
    user.changeName(username);
    user.changeColor(usercolor);

    let room = roomExists(roomname);
    if (room && spec && !room.userInRoom(user)) {
      if (room.spectateble() && !room.userInRoom(user)) {
        user.changeTitle("spectator");
        room.addSpectator(user);
        socket.join(room.id);
        socket.join(`${room.id}_spectators`);
        socket.emit("joinedRoom");
        updateRoom(room);
        sendMessage(room, user, "join", "is spectating now.");
      }
    } else if (room && !spec && !room.userInRoom(user) && !room.isFull()) {
      user.changeTitle("waiting");
      room.addPlayer(user);
      socket.join(room.id);
      socket.emit("joinedRoom");
      updateRoom(room);
      sendMessage(room, user, "join", "joined the room.");
    } else if (!room && !spec) {
      user.changeTitle("waiting");
      user.becomeOwner();
      room = new Room(roomname, user, language);
      rooms[room.id] = room;
      room.addPlayer(user);
      socket.join(room.id);
      socket.emit("joinedRoom");
      updateRoom(room);
      sendMessage(room, user, "join", "created the room.");
    } else if (room && spec && room.userInRoom(user)) socket.emit("toast", notifications.alreadyjoinedspectator);
    else if (room && !spec && room.userInRoom(user) && !room.isFull())
      socket.emit("toast", notifications.alreadyjoined);
    else if (room && !spec && !room.userInRoom(user) && room.isFull()) socket.emit("toast", notifications.roomfull);
    else if (room && !spec && room.userInRoom(user) && room.isFull()) {
      socket.emit("toast", notifications.alreadyjoined);
      socket.emit("toast", notifications.roomfull);
    } else socket.emit("toast", notifications.unknownerror);
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

function genColors() {
  let colorlist = [];
  for (let strength = 3; strength <= 9; strength += 2) {
    for (let color of colors) {
      colorlist.push(`${color}${strength}`);
    }
  }
  return colorlist;
}

function addConnection(socket) {
  let user = new User(socket.id);
  users[user.id] = user;
  io.emit("getOnlinePlayers", Object.keys(users).length);
  return { name: user.name, color: user.color };
}

server.listen(3000, function () {
  console.log("Server started.");
});
