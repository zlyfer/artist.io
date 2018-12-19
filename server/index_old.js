// TODO: Fixed artist queue.

// TODO: Display score changes upon round end.
// TODO: Add custom word list.
// TODO: Add more options.
// TODO: Make CSS more responsive.
// TODO: Player can choose their color?
// TODO: REFRACTOR.
// TODO: Cookies? (name, color, language, custom word list)

var schedule = require('node-schedule');
var io = require('socket.io')(server);
var {
	dictionaries
} = require('../config/dictionaries.json');
var {
	colorPalette
} = require('../config/colorPalette.json');
var User = require('./classes/user.js')
var Room = require('./classes/room.js')
var rooms = {};
var users = {};

io.on('connection', socket => {
	users[socket.id] = new User(socket.id);
	socket.emit('send_user', users[socket.id]);
	io.emit('send_roomlist', rooms);

	socket.on('test', data => {
		socket.emit('test', rooms);
	});
	socket.on('update_user', user => {
		users[user.id] = user;
		socket.emit('send_user', users[user.id])
	});
	socket.on('check_room', roomname => {
		let exists = false;
		let lang = null;
		for (let room in rooms) {
			if (rooms[room].name == roomname) {
				exists = true;
				lang = rooms[room].language;
			}
		}
		if (exists) {
			socket.emit('checked_room', exists, lang);
		} else {
			socket.emit('checked_room', exists, null);
		}
	});
	socket.on('check_creator', user => {
		let isCreator = false;
		if (rooms[user.room].creator == user.id) {
			isCreator = true;
		}
		socket.emit('checked_creator', isCreator);
	});
	socket.on('join_room', data => {
		let already_joined = false;
		for (let room in rooms) {
			if (data.user.id in rooms[room].players) {
				already_joined = true;
			}
		}
		if (already_joined == false) {
			if (!(data.room in rooms)) {
				rooms[data.room] = new Room(data.room, data.user.id, data.lang);
				for (let i = 0; i < Object.keys(dictionaries[data.lang]).length; i++) {
					rooms[data.room].toggleDictionary(Object.keys(dictionaries[data.lang])[i]);
				}
			}
			let user = rooms[data.room].joinPlayer(data.user);
			if (user) {
				let newMSG = {
					"author": user,
					"message": "joined the game.",
					"type": "join",
					"to": "all"
				};
				io.in(user.room).emit('new_message', newMSG);
				rooms[user.room].addMessage(newMSG);
				users[user.id] = user;
				socket.join(data.room);
				io.in(data.room).emit('update_room', rooms[data.room]);
				io.emit('send_roomlist', rooms);
				socket.emit('send_user', users[user.id]);
				socket.emit('room_joined', users[user.id], dictionaries[rooms[user.room].language], colorPalette, rooms[user.room].dictionaries);
				if (rooms[data.room].gamestate != "Lobby") {
					socket.emit('apply_artist', rooms[data.room].artist);
					socket.emit('update_canvas', rooms[data.room].canvas);
					socket.emit('start_game', rooms[data.room]);
				} else {
					socket.to(data.room).emit('request_options', rooms[data.room].creator);
				}
			} else {
				socket.emit('error_message', "You can't join this room, because it's either full or you already joined it!");
			}
		} else {
			socket.emit('error_message', "You can't join this room, because you already joined a room!");
		}
	});
	socket.on('send_message', data => {
		if (
			data.author.id != rooms[data.author.room].artist &&
			data.message.toUpperCase() == rooms[data.author.room].currentWord.toUpperCase() &&
			rooms[data.author.room].guessedIt.includes(data.author.id) == false
		) {
			let score = Math.floor((rooms[data.author.room].timer / (rooms[data.author.room].maxTimer / 100)) - ((rooms[data.author.room].guessedIt.length)));
			rooms[data.author.room].scores[data.author.id] = score;
			rooms[data.author.room].guessedIt.push(data.author.id);
			users[data.author.id].guessedIt = true;
			socket.emit('send_user', users[data.author.id]);
			let newMSG = {
				"author": data.author,
				"message": "guessed the word!",
				"type": "guess",
				"to": "all"
			};
			rooms[data.author.room].addMessage(newMSG);
			io.in(data.author.room).emit('new_message', newMSG);
			checkRoundEnd(data.author.room);
		} else if (
			rooms[data.author.room].guessedIt.includes(data.author.id) ||
			rooms[data.author.room].artist == data.author.id
		) {
			let newMSG = {
				"author": data.author,
				"message": data.message,
				"type": "secret",
				"to": "guessed"
			};
			rooms[data.author.room].addMessage(newMSG);
			io.in(data.author.room).emit('new_message', newMSG);
		} else {
			rooms[data.author.room].addMessage(data);
			io.in(data.author.room).emit('new_message', data);
		}
	});
	socket.on('canvas_changed', data => {
		rooms[data.room].canvas = data.canvas;
		socket.to(data.room).emit('update_canvas', rooms[data.room].canvas);
	});
	socket.on('update_options', (user, options) => {
		if (rooms[user.room].creator = user.id) {
			socket.to(user.room).emit('update_options', options);
			rooms[user.room].applyDictionaries(options.dictionaries.enabled);
			io.emit('send_roomlist', rooms);
		}
	});
	socket.on('start_game', (user, options) => {
		if (rooms[user.room]) {
			rooms[user.room].startRound(options);
			roomNextRound(rooms[user.room]);
		}
	});
	// socket.on('event', (args) => {
	// 	io.emit('event', args)
	// });
	socket.on('request_usernumber', () => {
		if (rooms[users[socket.id].room]) {
			socket.emit('requested_usernumber', Object.keys(rooms[users[socket.id].room].players).length);
		}
	});
	socket.on('disconnect', () => {
		if (users[socket.id].room) {
			let roomname = users[socket.id].room;
			rooms[roomname].removePlayer(socket.id);
			let newMSG = {
				"author": users[socket.id],
				"message": "left the game.",
				"type": "leave",
				"to": "all"
			};
			io.in(roomname).emit('new_message', newMSG);
			rooms[roomname].addMessage(newMSG);
			if (rooms[roomname].slots.used == 0) {
				if (rooms[roomname].scheduleJob) {
					rooms[roomname].scheduleJob.cancel();
				}
				delete rooms[roomname];
			} else {
				if (socket.id == rooms[roomname].artist) {
					rooms[roomname].endReason = "The Artist Left!";
					semiRoomNextRound(roomname);
				} else {
					checkRoundEnd(roomname);
				}
				io.in(roomname).emit('update_room', rooms[roomname]);
			}
		}
		delete users[socket.id];
	});
});

function semiRoomNextRound(room) {
	if (rooms[room]) {
		for (let id in rooms[room].scores) {
			users[id].score += rooms[room].scores[id];
		}
		for (let player in rooms[room].players) {
			rooms[room].players[player].guessedIt = false;
		}
		io.in(room).emit('update_room', rooms[room]);
		rooms[room].checkNextRound();
		if (rooms[room].gamestate != "End Game") {
			io.in(room).emit('end_round', rooms[room]);
			rooms[room].endRound();
		} else {
			io.in(room).emit('end_round', rooms[room]);
			rooms[room].endRound();
			io.emit('send_roomlist', rooms);
		}
		setTimeout(function() {
			if (rooms[room]) {
				if (rooms[room].gamestate != "End Game" && rooms[room].gamestate != "Lobby") {
					rooms[room].nextRound();
					roomNextRound(rooms[room]);
				} else if (rooms[room].gamestate != "Lobby") {
					rooms[room].nextGame();
					rooms[room].nextRound();
					roomNextRound(rooms[room]);
				}
			}
		}, 8000);
	}
}

function roomNextRound(room) {
	io.in(room.name).emit('update_canvas', rooms[room.name].canvas);
	io.in(room.name).emit('apply_artist', rooms[room.name].artist);
	io.in(room.name).emit('start_game', rooms[room.name]);
	io.in(room.name).emit('update_room', rooms[room.name]);
	io.emit('send_roomlist', rooms);
	rooms[room.name].scheduleJob = schedule.scheduleJob('*/1 * * * * *', function() {
		rooms[room.name].tick();
		io.in(room.name).emit('tick', rooms[room.name].timer);
		io.in(room.name).emit('update_room', rooms[room.name]);
		if (room.timer == 0) {
			rooms[room.name].endReason = "Time Up!";
			semiRoomNextRound(room.name);
		}
	});
}

function checkRoundEnd(roomname) {
	if (
		rooms[roomname].guessedIt.length >= Object.keys(rooms[roomname].players).length - 1 &&
		rooms[roomname].gamestate != "Lobby"
	) {
		if (rooms[roomname].artistScore) {
			rooms[roomname].scores[rooms[roomname].artist] = (rooms[roomname].guessedIt.length * (100 / (Object.keys(rooms[roomname].players).length - 1)));
		}
		rooms[roomname].endReason = "Everyone Guessed The Word!";
		semiRoomNextRound(roomname);
	}
}