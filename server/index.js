// NOT TESTING:
var fs = require('fs');
var https = require('https');
var options = {
	key: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/chain.pem'),
	rejectUnauthorized: false
}
var server = https.createServer(options);
// END

// TESTING:
// var http = require('http');
// var server = http.createServer();
// END

var schedule = require('node-schedule');
var io = require('socket.io')(server);
var {
	dictionaries
} = require('../config/dictionaries.json');
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
			}
			let user = rooms[data.room].joinPlayer(data.user);
			if (user) {
				users[user.id] = user;
				socket.join(data.room);
				io.in(data.room).emit('update_room', rooms[data.room]);
				io.emit('send_roomlist', rooms);
				socket.emit('send_user', users[user.id]);
				socket.emit('room_joined', users[user.id], dictionaries[rooms[user.room].language]);
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
			data.user.id != rooms[data.user.room].artist &&
			data.message == rooms[data.user.room].currentWord &&
			rooms[data.user.room].guessedIt.includes(data.user.id) == false
		) {
			rooms[data.user.room].guessedIt.push(data.user.id);
			users[data.user.id].score += Math.floor(((rooms[data.user.room].timer / (rooms[data.user.room].maxTimer / 100)) * rooms[data.user.room].currentWord.length) / 10);
			if (
				rooms[data.user.room].guessedIt.length >= Object.keys(rooms[data.user.room].players).length - 1 &&
				rooms[data.user.room].gamestate != "Lobby"
			) {
				semiRoomNextRound(rooms[data.user.room].name);
			}
		} else {
			rooms[data.user.room].addMessage(data.user.id, data.message);
			io.in(data.user.room).emit('new_message', data);
		}
		io.in(data.user.room).emit('update_room', rooms[data.user.room]);
	});
	socket.on('canvas_changed', data => {
		rooms[data.room].canvas = data.canvas;
		socket.to(data.room).emit('update_canvas', rooms[data.room].canvas);
	});
	socket.on('update_options', (user, options) => {
		if (rooms[user.room].creator = user.id) {
			socket.to(user.room).emit('update_options', options);
		}
	});
	socket.on('start_game', (user, options) => {
		rooms[user.room].startRound(options);
		roomNextRound(rooms[user.room]);
	});
	// socket.on('event', (args) => {
	// 	io.emit('event', args)
	// });
	socket.on('request_usernumber', () => {
		socket.emit('requested_usernumber', Object.keys(rooms[users[socket.id].room].players).length);
	});
	socket.on('disconnect', () => {
		if (users[socket.id].room) {
			rooms[users[socket.id].room].removePlayer(socket.id);
			if (rooms[users[socket.id].room].slots.used == 0) {
				if (rooms[users[socket.id].room].scheduleJob) {
					rooms[users[socket.id].room].scheduleJob.cancel();
				}
				delete rooms[users[socket.id].room];
			} else {
				if (socket.id == rooms[users[socket.id].room].artist) {
					semiRoomNextRound(users[socket.id].room);
				}
				io.in(users[socket.id].room).emit('update_room', rooms[users[socket.id].room]);
			}
		}
		delete users[socket.id];
	});
});

function roomNextRound(room) {
	io.in(room.name).emit('update_canvas', rooms[room.name].canvas);
	io.in(room.name).emit('apply_artist', rooms[room.name].artist);
	io.in(room.name).emit('start_game', rooms[room.name]);
	io.in(room.name).emit('update_room', rooms[room.name]);
	io.emit('send_roomlist', rooms);
	rooms[room.name].scheduleJob = schedule.scheduleJob('*/1 * * * * *', function() {
		rooms[room.name].tick();
		io.in(room.name).emit('tick', rooms[room.name].timer);
		if (room.timer == 0) {
			io.in(room.name).emit('end_round', rooms[room.name]);
		}
	});
}

function semiRoomNextRound(room) {
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
			if (rooms[room].gamestate != "End Game") {
				rooms[room].nextRound();
				roomNextRound(rooms[room]);
			} else {
				rooms[room].nextGame();
				rooms[room].nextRound();
				roomNextRound(rooms[room]);
			}
		}
	}, 8000);
}

server.listen(3000);