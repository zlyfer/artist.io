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
	socket.emit('connected');
	newConnection(socket);
	sendRoomlistSingle(socket);
	// socket.on('', () => ());
	socket.on('checkJoinOrCreate', checkJoinOrCreate);
	socket.on('renameAndJoin', renameAndJoin);
	socket.on('renameAndSpectate', (a, b, c, d) => {
		renameAndJoin(a, b, c, d, true, socket);
	});
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
	data.header.slots.spectators = room.options.slots.spectators;
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

function renameAndJoin(username, usercolor, roomname, language, spec = false, socket = this) {
	let user = users[socket.id];
	user.changeName(username);
	user.changeColor(usercolor);
	if (spec) {
		user.changeTitle('spectator');
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
		user.changeTitle('owner');
		room = new Room(roomname, user, language);
		rooms[room.id] = room;
		error = room.addPlayer(user);
	}
	if (error[0]) {
		socket.emit('toast', error[1]);
	} else {
		socket.join(room.id);
		socket.emit('joinedRoom');
		updateRoom(room);
		sendRoomlistAll();
		if (spec) {
			newMessage(room, user, 'join', 'is spectating now.');
		} else {
			newMessage(room, user, 'join', 'joined the room.');
		}
	}
}

function roomExists(roomname) {
	let exists = false;
	for (id of Object.keys(rooms)) {
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
		sendRoomlistAll();
		updateRoom(room);
	} else {
		this.emit('toast', errors['notowner']);
		updateRoom(room);
	}
}

function removeUser() {
	let user = users[this.id];
	let room = rooms[user.room];
	if (room) {
		let ownerID = room.owner.id;
		if (user.title == "spectator") {
			room.removeSpectator(user);
		} else {
			room.removePlayer(user);
		}
		newMessage(room, user, 'leave', 'left the room.');
		if (user.id == ownerID && Object.keys(room.players).length != 0) {
			let newOwner = room.players[Object.keys(room.players)[0]];
			newMessage(room, newOwner, 'system', 'is now the new room owner.');
			room.owner = newOwner;
			if (room.gamestate == "In Lobby") {
				room.owner.changeTitle('owner');
			}
		}
		if (Object.keys(room.players).length == 0) {
			for (let spectator in room.spectators) {
				let socket = io.sockets.connected[room.spectators[spectator].id];
				socket.emit('closeRoom', errors['roomclosedspectator']);
				user.room = null;
			}
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