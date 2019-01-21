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
var {
	dictionaries
} = require('../config/dictionaries.json');
var {
	colors
} = require('../config/colors.json');
var errors = require('../config/errors.json');
var User = require('./classes/user.js')
var Room = require('./classes/room.js')
var rooms = {};
var users = {};
var tickIntervals = {};

io.on('connection', socket => {
	socket.emit('connected');
	newConnection(socket);
	sendRoomList(socket);
	// socket.on('', () => ());
	socket.on('checkJoinOrCreate', checkJoinOrCreate);
	socket.on('renameAndJoin', renameAndJoin);
	socket.on('renameAndSpectate', (a, b, c, d) => {
		renameAndJoin(a, b, c, d, true, socket);
	});
	socket.on('sendMessage', sendMessage);
	socket.on('updateLobby', updateLobby);
	socket.on('startGame', startGame);
	socket.on('updateCanvas', updateCanvas);
	socket.on('disconnect', removeUser);
});

function newConnection(socket) {
	let user = new User(socket.id);
	users[user.id] = user;
	socket.emit('getUserColor', user.color);
	socket.emit('getUsername', user.name);
	socket.emit('getColors', genColors());
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
	let user = users[socket.id];
	socket.emit('getRoomlist', rooms);
}

function updateRoom(room) {
	let data = {
		header: {},
		userlist: {},
		lobby: {}
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
	io.in(room.id).emit('updateRoom', data);
	sendAllowEdit(room);
	io.emit('getRoomlist', rooms);
};

function sendAllowEdit(room) {
	let socket = io.sockets.connected[room.owner.id];
	socket.in(room.id).emit('allowEdit', false);
	socket.emit('allowEdit', true);
}

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
		clearTickInterval(room);
		error = room.addPlayer(user);
	}
	if (error[0]) {
		socket.emit('toast', error[1]);
	} else {
		socket.join(room.id);
		socket.emit('joinedRoom');
		updateRoom(room);
		if (spec) {
			socket.join(`spectators-${room.id}`);
			newMessage(room, user, 'join', 'is spectating now.');
		} else {
			socket.join(`players-${room.id}`);
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
		updateRoom(room);
	} else {
		this.emit('toast', errors['notowner']);
		updateRoom(room);
	}
}

function startGame() {
	let user = users[this.id];
	let room = rooms[user.room];
	if (user.id == room.owner.id) {
		let startable = room.startGame();
		if (startable) {
			clearTickInterval(room);
			setupTickInterval(room);
			io.in(room.id).emit('startGame');
		}
		updateRoom(room);
	}
}

function setupTickInterval(room) {
	// if (rooms[room.id]) {
	sendArtist(room);
	tickIntervals[room.id] = setInterval(function() {
		let timeup = room.tick();
		if (timeup) {
			clearTickInterval(room);
			// TODO: Reveal word to everyone when round is over.
			let gameover = room.endRound();
			if (gameover) {
				room.endGame();
				io.in(room.id).emit('endGame', room.customEnd || 'Time Up!', room.players);
				setTimeout(function() {
					room.resetGame();
					io.in(room.id).emit('resetGame');
					updateRoom(room);
				}, (room.options.waitTime.value * 1000));
			} else {
				io.in(room.id).emit('endRound', room.customEnd || 'Time Up!', room.players);
				setTimeout(function() {
					let startable = room.nextRound();
					if (startable) {
						io.in(room.id).emit('nextRound');
						setupTickInterval(room);
						updateRoom(room);
					}
				}, (room.options.waitTime.value * 1000));
			}
		} else {
			sendWord(room);
		}
		updateRoom(room);
	}, 1000);
	// }
}

function sendArtist(room) {
	let socket = io.sockets.connected[room.artist.actual];
	socket.in(room.id).emit('artist', false);
	socket.emit('artist', true);
	sendWord(room);
}

function sendWord(room) {
	let socket = io.sockets.connected[room.artist.actual];
	socket.in(`players-${room.id}`).emit('word', room.word.hidden);
	if (room.options.showWordToSpectators.value) {
		socket.in(`spectators-${room.id}`).emit('word', room.word.hidden);
	} else {
		socket.in(`spectators-${room.id}`).emit('word', 'Hidden To Spectators');
	}
	socket.emit('word', room.word.actual);
}


function clearTickInterval(room) {
	clearInterval(tickIntervals[room.id]);
	tickIntervals[room.id] = null;
}

function updateCanvas(data) {
	let user = users[this.id];
	let room = rooms[user.room];
	if (room) {
		if (room.artist.actual == user.id) {
			room.canvas = data;
			this.in(room.id).emit('updateCanvas', room.canvas);
		} else {
			this.emit('toast', errors['notartist']);
		}
	}
}

function removeUser() {
	let user = users[this.id];
	let room = rooms[user.room];
	if (room) {
		let ownerID = room.owner.id; // NOTE: Is an extra variable needed?
		if (user.title == 'spectator') {
			room.removeSpectator(user);
		} else {
			room.removePlayer(user);
		}
		newMessage(room, user, 'leave', 'left the room.');
		if (user.id == ownerID && Object.keys(room.players).length != 0) {
			let newOwner = room.players[Object.keys(room.players)[0]]; // IDEA: Pick random instead of first in the list.
			newMessage(room, newOwner, 'system', 'is now the new room owner.');
			room.owner = newOwner;
			if (room.gamestate == 'In Lobby') {
				room.owner.changeTitle('owner');
			}
		}
		if (user.id == room.artist.actual && Object.keys(room.players).length == 1) {
			room.customEnd = 'More than one non-spectator is needed to play!';
		} else if (user.id == room.artist.actual) {
			room.customEnd = 'The artist left the game!';
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
	}
	deleteUser(user);
	sendOnlinePlayers();
}

function deleteRoom(room) {
	clearTickInterval(room);
	delete rooms[room.id];
	io.emit('getRoomlist', rooms);
}

function deleteUser(user) {
	delete users[user.id];
}

function sendMessage(content) {
	// TODO: secret messages to non-guesser, all guessed
	let user = users[this.id];
	let room = rooms[user.room];
	switch (user.title) {
		case 'solver':
			newMessage(room, user, 'secret', content);
			break;
		case 'artist':
			newMessage(room, user, 'secret', content);
			break;
		case 'spectator':
			if (room.options.allowSpectatorChat.value) {
				if (room.options.showWordToSpectators.value) {
					newMessage(room, user, 'secret', content);
				} else {
					newMessage(room, user, 'spectator', content);
				}
			}
			break;
		case 'guesser':
			if (content == room.word.actual) {
				room.solved(user);
				newMessage(room, user, 'guessed', 'has guessed the word!');
				// newMessage(room, user, 'secret', content); // NOTE: Is this really needed?
				if (Object.keys(room.toScore).length >= Object.keys(room.players).length - 1) { // -1 because the artist counts as a player but cannot guess
					room.customEnd = 'Everyone guessed the word!';
				}
			} else {
				newMessage(room, user, 'normal', content);
			}

			break;
	}
	updateRoom(room);
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