var socket;
var user;
var canvas;

var pregame_frames,
	room_input,
	username_input,
	join_input,
	roomlist;
var game_frames,
	header,
	userlist,
	lobby,
	start_game,
	game,
	chat,
	chatlog,
	newmessage;

window.onload = function() {
	pregame_frames = document.getElementsByClassName('pregame');
	room_input = document.getElementById('room');
	username_input = document.getElementById('username');
	join_input = document.getElementById('join');
	roomlist = document.getElementById('roomlist');

	game_frames = document.getElementsByClassName('game');
	header = document.getElementById('header');
	userlist = document.getElementById('userlist');
	lobby = document.getElementById('lobby');
	start_game = document.getElementById('start_game');
	game = document.getElementById('game');
	chat = document.getElementById('chat');
	chatlog = document.getElementById('chatlog');
	newmessage = document.getElementById('newmessage');

	inputObserver();
	join();
	startGame();
	sendMessage();

	// socket = io('http://localhost:3000');
	socket = io('http://zlyfer.net:3000');
	initcfd();

	socket.on('error_message', err_msg => {
		console.log(err_msg);
	});
	// socket.on('event', args => {
	// 	socket.emit('event', args);
	// });
	socket.on('start_game', room => {
		lobby.style.display = "none";
		game.style.display = "block";
	});
	socket.on('new_message', data => {
		addChatmessage(data.user, data.message);
	});
	socket.on('update_room', room => {
		changeRoomHeader(room);
		for (let i = userlist.children.length; i > 0; i--) {
			userlist.lastChild.remove();
		}
		for (let player in room.players) {
			addPlayer(room.players[player], room.artists);
		}
	});
	socket.on('send_user', newuser => {
		user = newuser;
	});
	socket.on('send_roomlist', rl => {
		for (let i = roomlist.children.length; i > 0; i--) {
			roomlist.lastChild.remove();
		}
		for (let room in rl) {
			addRoomlistEntry(rl[room]);
		}
	});
	socket.on('checked_room', exists => {
		if (exists == true) {
			join_input.value = "Join Room!";
		} else {
			join_input.value = "Create Room!";
		}
	});
	socket.on('checked_creator', isCreator => {
		if (!isCreator) {
			for (let i = 0; i < lobby.children.length; i++) {
				if (lobby.children[i].tagName == "INPUT") {
					lobby.children[i].disabled = true;
				}
			}
		}
	});
	socket.on('room_joined', isCreator => {
		for (let i = 0; i < pregame_frames.length; i++) {
			pregame_frames[i].style.display = "none";
		}
		for (let i = 0; i < game_frames.length; i++) {
			game_frames[i].style.display = "block";
		}
		checkIfCreator();
	});
}

function inputObserver() {
	username_input.oninput = function() {
		checkJoinable();
	}
	room_input.oninput = function() {
		checkJoinable();
	}
}

function join() {
	join_input.onclick = function() {
		user.name = username_input.value;
		socket.emit('update_user', user);
		let room = room_input.value;
		socket.emit('join_room', {
			user,
			room
		});
	}
}

function startGame() {
	start_game.onclick = function() {
		socket.emit('start_game', user);
	}
}

function sendMessage() {
	newmessage.addEventListener('keydown', function(e) {
		if (e.keyCode == 13) {
			socket.emit('send_message', {
				"user": user,
				"message": this.value
			});
			this.value = "";
		}
	})
}

function checkJoinable() {
	let username = username_input.value;
	let roomname = room_input.value;
	if (roomname != "") {
		socket.emit('check_room', roomname);
	}
	if (username != "" && roomname != "") {
		join_input.disabled = false;
	} else {
		join_input.disabled = true;
	}
}

function checkIfCreator() {
	socket.emit('check_creator', user);
}

function addRoomlistEntry(room) {
	let roomlist_entry = document.createElement('div');
	roomlist_entry.className = "roomlist_entry";
	roomlist_entry.onclick = function() {
		room_input.value = room.name;
		for (let i = 0; i < roomlist.children.length; i++) {
			let r = roomlist.children[i];
			if (r.className.includes("selected")) {
				r.className = "roomlist_entry";
			}
		}
		this.className += " selected";
		checkJoinable();
	}

	let name = document.createElement('div');
	name.className = "name";
	let namespan = document.createElement('span');
	namespan.innerHTML = room.name;
	name.append(namespan);

	let players = document.createElement('div');
	players.className = "players";
	let playersspan = document.createElement('span');
	playersspan.innerHTML = genUserlistString(room);
	players.append(playersspan);

	let gamestate = document.createElement('div');
	gamestate.className = "gamestate";
	let gamestatespan = document.createElement('span');
	gamestatespan.innerHTML = room.gamestate;
	gamestate.append(gamestatespan);

	let slots = document.createElement('div');
	slots.className = "slots";
	let slotsspan = document.createElement('span');
	slotsspan.innerHTML = genSlotsString(room);
	slots.append(slotsspan);

	roomlist_entry.append(name);
	roomlist_entry.append(players);
	roomlist_entry.append(gamestate);
	roomlist_entry.append(slots);
	roomlist.append(roomlist_entry);
}

function genUserlistString(room) {
	let userlistString = "";
	for (let player in room.players) {
		userlistString += `, ${room.players[player].name}`;
	}
	userlistString = userlistString.substr(2);
	return userlistString;
}

function genSlotsString(room) {
	let slotsString = `${room.slots.used}/${room.slots.available}`;
	return slotsString;
}

function transmitCfdData(cfd) {
	if (user.artist) {
		let cfd_data = cfd.save();
		socket.emit('canvas_changed', {
			"room": user.room,
			"canvas": cfd_data
		});
	}
}

function changeRoomHeader(room) {
	let roomheader = header.children[0];
	let players_string = 'Player';
	let player_count = 0;
	for (let _ in room.players) {
		player_count++;
	}
	if (player_count > 1) {
		players_string += 's';
	}
	roomheader.innerHTML = `${room.name} - ${player_count} ${players_string} - ${room.slots.used}/${room.slots.available}`;
}

function addPlayer(player, artists) {
	let userlistentry = document.createElement('div');
	userlistentry.className = "userlistentry";
	userlistentry.style.backgroundColor = player.color;

	let username = document.createElement('div');
	username.className = "username";
	let usernamespan = document.createElement('span');
	usernamespan.innerHTML = "";
	if (player.artist) {
		usernamespan.innerHTML = "✦";
	} else if (artists.includes(player.id)) {
		usernamespan.innerHTML = "✧";
	}
	usernamespan.innerHTML += player.name;
	if (player.id == user.id) {
		usernamespan.innerHTML += " (You)";
		usernamespan.style.fontWeight = "bold";
	}

	let score = document.createElement('div');
	score.className = "score";
	let scorespan = document.createElement('span');
	scorespan.innerHTML = player.score;

	username.append(usernamespan);
	score.append(scorespan);
	userlistentry.append(username);
	userlistentry.append(score);
	userlist.append(userlistentry);
}

function addChatmessage(sender, message) {
	let chatmessage = document.createElement('div');
	chatmessage.className = "chatmessage";
	let author = document.createElement('div');
	author.className = "author";
	let authorspan = document.createElement('span');
	authorspan.innerHTML = sender.name;
	authorspan.style.color = sender.color;
	let content = document.createElement('div');
	content.className = "content";
	let contentspan = document.createElement('span');
	contentspan.innerHTML = message;

	author.append(authorspan);
	content.append(contentspan);
	chatmessage.append(author);
	chatmessage.append(content);
	chatlog.append(chatmessage);
}