// NOT TESTING:
// var fs = require('fs');
// var https = require('https');
// var options = {
// 	key: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/privkey.pem'),
// 	cert: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/cert.pem'),
// 	ca: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/chain.pem'),
// 	rejectUnauthorized: false
// }
// var server = https.createServer(options);
// END

// TESTING:
var http = require('http');
var server = http.createServer();
// END

var schedule = require('node-schedule');
var io = require('socket.io')(server);
var dictionaries = require('../config/dictionaries.json')["dictionaries"];
var errors = require('../config/errors.json');
var User = require('./classes/user.js')
var Room = require('./classes/room.js')
var rooms = {};
var users = {};

io.on('connection', socket => {
	newConnection(socket);
	sendRoomlistSingle(socket);
	// socket.on('', () => ());
	socket.on('checkJoinOrCreate', checkJoinOrCreate);
	socket.on('renameAndJoin', renameAndJoin);
	socket.on('sendMessage', sendMessage);
	socket.on('updateLobby', updateLobby);
	socket.on('disconnect', removeUser);
});

function newConnection(socket) {
	let user = new User(socket.id);
	users[user.id] = user;
	socket.emit('getUserColor', user.color);
	sendOnlinePlayers();
}

function sendRoomlistSingle(socket) {
	let user = users[socket.id];
	socket.emit('getRoomlist', rooms);
}

function sendRoomlistAll() {
	io.emit('getRoomlist', rooms);
}

function updateRoom(room) {
	let data = {
		header: {},
		userlist: {},
		lobby: {}
	};
	data.header.name = room.name;
	data.header.gamestate = room.gamestate;
	data.header.word = room.getHint(); // TODO: hint for all except artist
	data.header.time = room.options.drawTime.value;
	data.header.slots = {};
	data.header.slots.current = room.options.slots.current;
	data.header.slots.value = room.options.slots.value;
	data.userlist.players = room.getPlayerList();
	data.lobby.options = room.options;
	data.lobby.dictionaries = room.dictionaries;
	data.lobby.allowEdit = false;
	let socket = io.sockets.connected[room.owner.id];
	socket.in(room.id).emit('updateRoom', data);
	data.lobby.allowEdit = true;
	socket.emit('updateRoom', data);
};

function checkJoinOrCreate(roomname) {
	let exists = false;
	if (roomExists(roomname)) {
		exists = true;
	}
	this.emit('checkJoinOrCreate', exists);
}

function sendOnlinePlayers() {
	io.emit('getOnlinePlayers', Object.keys(users).length);
}

function renameAndJoin(username, usercolor, roomname, language) {
	let user = users[this.id];
	user.changeName(username);
	user.changeColor(usercolor);
	let room = roomExists(roomname);
	let error = false;
	if (room) {
		error = room.addPlayer(user);
	} else {
		room = new Room(roomname, user, language);
		rooms[room.id] = room;
		error = room.addPlayer(user);
	}
	if (error[0]) {
		this.emit('displayError', error[1]);
	} else {
		this.join(room.id);
		this.emit('joinedRoom');
		updateRoom(room);
		sendRoomlistAll();
		newMessage(room, user, 'join', 'joined the lobby.');
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
		if (!jsonCompare(room.options, opts)) {
			room.options = opts;
		}
		if (!jsonCompare(room.dictionaries, dicts)) {
			room.dictionaries = dicts;
		}
		updateRoom(room);
	} else {
		this.emit('displayError', errors['11']);
	}
}

function removeUser() {
	let user = users[this.id];
	if (user.room) {
		let room = rooms[user.room];
		let ownerID = room.owner.id;
		room.removePlayer(user);
		newMessage(room, user, 'leave', 'left the lobby.');
		if (user.id == ownerID && room.getPlayerList().length != 0) {
			let newOwner = room.players[room.getPlayerList()[0].id]
			newMessage(room, newOwner, 'system', 'is now the new lobby owner.');
			room.owner = newOwner;
		}
		if (room.getPlayerList().length == 0) {
			deleteRoom(room);
		} else {
			updateRoom(room);
		}
		sendRoomlistAll();
	}
	deleteUser(user);
	sendOnlinePlayers();
}

function deleteRoom(room) {
	delete rooms[room.id];
}

function deleteUser(user) {
	delete users[user.id];
}

function sendMessage(content) {
	let user = users[this.id];
	let room = rooms[user.room];
	newMessage(room, user, 'normal', content);
}

function newMessage(room, author, type, content) {
	room.addMessage(author, type, content);
	io.in(room.id).emit('getChatlog', room.chatlog);
}

function jsonCompare(obj1, obj2) {
	if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
		return true;
	} else {
		return false;
	}
}

server.listen(3000, function() {
	console.log("Server started.");
});