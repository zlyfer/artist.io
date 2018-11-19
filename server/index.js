// var express = require('express');
// var app = express();
var fs = require('fs');
var https = require('https');

var server = https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/zlyfer.net/chain.pem'),
	rejectUnauthorized: false
});
var io = require('socket.io')(server);
// var path = require('path');

var User = require('./classes/user.js')
var Room = require('./classes/room.js')
var rooms = {};
var users = {};

// app.use(express.static(path.join(__dirname, 'website')));
//
// app.get('/', (req, res) => {
// 	res.sendFile(`${__dirname}/website/index.html`);
// });

io.on('connection', socket => {
	users[socket.id] = new User(socket.id);
	socket.emit('send_user', users[socket.id]);
	io.emit('send_roomlist', rooms);

	socket.on('update_user', user => {
		users[user.id] = user;
		socket.emit('send_user', users[user.id])
	});
	socket.on('check_room', roomname => {
		let exists = false;
		for (let room in rooms) {
			if (rooms[room].name == roomname) {
				exists = true;
			}
		}
		socket.emit('checked_room', exists);
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
				rooms[data.room] = new Room(data.room, data.user.id);
			}
			let user = rooms[data.room].joinPlayer(data.user);
			if (user) {
				users[user.id] = user;
				socket.join(data.room);
				io.in(data.room).emit('update_room', rooms[data.room]);
				io.emit('send_roomlist', rooms);
				socket.emit('send_user', users[user.id]);
				socket.emit('room_joined', users[user.id]);
				if (rooms[data.room].gamestate != "Lobby") {
					socket.emit('start_game', rooms[data.room]);
					socket.emit('update_canvas', rooms[data.room].canvas);
					socket.emit('apply_artist', rooms[data.room].artist);
				}
			} else {
				socket.emit('error_message', "You can't join this room, because it's either full or you already joined it!");
			}
		} else {
			socket.emit('error_message', "You can't join this room, because you already joined a room!");
		}
	});
	socket.on('send_message', data => {
		rooms[data.user.room].addMessage(data.user.id, data.message);
		io.in(data.user.room).emit('new_message', data);
		io.in(data.user.room).emit('update_room', rooms[data.user.room]);
	});
	socket.on('canvas_changed', data => {
		rooms[data.room].canvas = data.canvas;
		socket.to(data.room).emit('update_canvas', rooms[data.room].canvas);
	});
	socket.on('start_game', (user) => {
		rooms[user.room].nextArtist();
		rooms[user.room].gamestate = "In Game";
		socket.emit('send_user', rooms[user.room].players[user.id]);
		io.in(user.room).emit('start_game', rooms[user.room]);
		io.in(user.room).emit('update_room', rooms[user.room]);
		io.in(user.room).emit('apply_artist', rooms[user.room].artist);
		io.emit('send_roomlist', rooms);
	});
	// socket.on('event', (args) => {
	// 	io.emit('event', args)
	// });
	socket.on('disconnect', () => {
		if (users[socket.id].room) {
			rooms[users[socket.id].room].removePlayer(socket.id);
			if (rooms[users[socket.id].room].slots.used == 0) {
				delete rooms[users[socket.id].room];
			} else {
				io.in(users[socket.id].room).emit('update_room', rooms[users[socket.id].room]);
			}
		}
		delete users[socket.id];
	});
});

// http.listen(8001, () => {
// 	console.log("Server listening.");
// });
server.listen(3000, function() {
	console.log(this);
});