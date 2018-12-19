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
	socket.on('disconnect', removeUser);
});

function newConnection(socket) {
	let user = new User(socket.id);
	users[user.id] = user;
	socket.emit('getUserColor', user.color);
}

function sendRoomlistSingle(socket) {
	let user = users[socket.id];
	socket.emit('getRoomlist', rooms);
}

function sendRoomlistAll() {
	io.emit('getRoomlist', rooms);
}

function updateRoom(room) {
	io.in(room.id).emit('updateRoom', room); // TODO: Make use of!
};

function checkJoinOrCreate(roomname) {
	let exists = false;
	if (roomExists(roomname)) {
		exists = true;
	}
	this.emit('checkJoinOrCreate', exists);
}

function renameAndJoin(username, roomname, language) {
	let user = users[this.id];
	user.changeName(username);
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
		this.emit('joinedRoom', room);
		updateRoom(room);
		sendRoomlistAll();
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

function removeUser() {
	let user = users[this.id];
	if (user.room) {
		let room = rooms[user.room];
		room.removePlayer(user);
		if (Object.keys(room.players).length == 0) {
			deleteRoom(room);
		}
		sendRoomlistAll();
	}
}

function deleteRoom(room) {
	delete rooms[room.id];
}

server.listen(3000, function() {
	console.log("Server started.");
});