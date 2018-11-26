var socket;
var user;
var cfd;
var lastcolor;
var selColor;
var bucketToolTolerance;
var pencilWidth;

var pregame_frames,
	room_input,
	username_input,
	language_input,
	join_input,
	roomlist,
	game_frames,
	userlist,
	results,
	results_nextround_span,
	results_word_span,
	lobby,
	lobby_maxplayers,
	lobby_timer,
	lobby_maxrounds,
	lobby_dictionaries,
	roomname,
	roomgamestate,
	roomplayercount,
	roomword,
	roomtimer,
	start_game,
	game,
	chat,
	chatlog,
	newmessage,
	currentColor,
	colorsContainer,
	pencil,
	eraser,
	bucket,
	clear,
	undo,
	redo;

window.onload = function() {
	pregame_frames = document.getElementsByClassName('pregame');
	room_input = document.getElementById('room');
	username_input = document.getElementById('username');
	language_input = document.getElementById('language');
	join_input = document.getElementById('join');
	roomlist = document.getElementById('roomlist');

	game_frames = document.getElementsByClassName('game');
	userlist = document.getElementById('userlist');
	results = document.getElementById('results');
	results_nextround_span = document.getElementById('results_nextround_span');
	results_word_span = document.getElementById('results_word_span');
	lobby = document.getElementById('lobby');
	lobby_maxplayers = document.getElementById('lobby_maxplayers');
	lobby_timer = document.getElementById('lobby_timer');
	lobby_maxrounds = document.getElementById('lobby_maxrounds');
	lobby_dictionaries = document.getElementById('lobby_dictionaries');
	roomname = document.getElementById('roomname');
	roomgamestate = document.getElementById('roomgamestate');
	roomplayercount = document.getElementById('roomplayercount');
	roomword = document.getElementById('roomword');
	roomtimer = document.getElementById('roomtimer');
	drawingTools_disabled = document.getElementById('drawingTools_disabled');
	start_game = document.getElementById('start_game');
	game = document.getElementById('game');
	chat = document.getElementById('chat');
	chatlog = document.getElementById('chatlog');
	newmessage = document.getElementById('newmessage');
	currentColor = document.getElementById('currentColor');
	colorsContainer = document.getElementById('colorsContainer');
	pencil = document.getElementById('pencil');
	eraser = document.getElementById('eraser');
	bucket = document.getElementById('bucket');
	clear = document.getElementById('clear');
	undo = document.getElementById('undo');
	redo = document.getElementById('redo');

	game.addEventListener('wheel', function(e) {
		if (e.deltaY < 0 && pencilWidth < 98) {
			pencilWidth += 2;
			cfd.setLineWidth(pencilWidth);
			changeCursor(pencilWidth, selColor);
		} else if (e.deltaY > 0 && pencilWidth > 6) {
			pencilWidth -= 2;
			cfd.setLineWidth(pencilWidth);
			changeCursor(pencilWidth, selColor);
		}
		e.returnValue = false;
	}, false);
	// game.addEventListener('DOMMouseScroll', function(e) {
	// 	e.returnValue = false;
	// }, false);
	// game.addEventListener('mousewheel', function(e) {
	// 	e.returnValue = false;
	// }, false);

	inputObserver();
	join();
	startGame();
	sendMessage();
	optionsObserver();

	// NOT TESTING:
	socket = io('https://zlyfer.net:3000', {
		rejectUnauthorized: false
	});
	// END

	// TESTING:
	// socket = io('http://localhost:3000');
	// END

	initcfd();

	socket.on('test', data => {
		console.log(data);
	});
	socket.on('error_message', err_msg => {
		console.log(err_msg);
	});
	// socket.on('event', args => {
	// 	socket.emit('event', args);
	// });
	socket.on('requested_usernumber', number => {
		checkIfStartable(false);
		if (number < 2) {
			start_game.disabled = true;
		}
	});
	socket.on('tick', timer => {
		roomtimer.innerHTML = "Time: " + timer;
	})
	socket.on('update_options', options => {
		lobby_maxplayers.value = options.maxPlayers;
		lobby_timer.value = options.drawTime;
		lobby_maxrounds.value = options.maxRounds;
		options.dictionaries.enabled.forEach(dict => {
			document.getElementById(`dict_input_${dict}`).checked = true;
		})
		options.dictionaries.disabled.forEach(dict => {
			document.getElementById(`dict_input_${dict}`).checked = false;
		})
	});
	socket.on('request_options', creator => {
		if (user.id == creator) {
			socket.emit('update_options', user, {
				"maxPlayers": lobby_maxplayers.value,
				"drawTime": lobby_timer.value,
				"maxRounds": lobby_maxrounds.value,
				"dictionaries": getDictionaries()
			});
		}
	});
	socket.on('start_game', room => {
		results.style.display = "none";
		results_nextround_span.innerHTML = `Next artist in 7 seconds..`;
		user = room.players[user.id]
		lobby.style.display = "none";
		game.style.display = "block";
		changeCursor(pencilWidth, selColor);
		changeRoomHeader(room);
		cfd.snapshots = [];
	});
	socket.on('end_round', room => {
		results.style.display = "block";
		cfd.disableDrawingMode();
		results_word_span.innerHTML = `The word was: ${room.currentWord}`;
		let seconds = 6;
		let timer = setInterval(() => {
			results_nextround_span.innerHTML = `Next artist in ${seconds} seconds..`;
			seconds--;
		}, 1000);
		setTimeout(() => {
			clearInterval(timer);
		}, 7000);
	});
	socket.on('end_game', room => {

	});
	socket.on('new_message', data => {
		addChatmessage(data.user, data.message);
		chatlog.scrollTo({
			top: chatlog.scrollHeight,
			left: 0,
			behavior: 'smooth'
		});
	});
	socket.on('update_room', room => {
		checkIfStartable();
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
	socket.on('checked_room', (exists, lang) => {
		if (exists) {
			join_input.value = "Join Room!";
			language_input.value = lang;
			language_input.disabled = true;
		} else {
			join_input.value = "Create Room!";
			language_input.disabled = false;
		}
	});
	socket.on('checked_creator', isCreator => {
		if (!isCreator) {
			lobby_maxplayers.disabled = true;
			lobby_timer.disabled = true;
			lobby_maxrounds.disabled = true;
			start_game.disabled = true;
			for (let i = 0; i < lobby_dictionaries.children.length; i++) {
				if (lobby_dictionaries.children[i].children[1]) {
					lobby_dictionaries.children[i].children[1].disabled = true;
				}
			}
		}
	});
	socket.on('room_joined', (isCreator, dictionaries, colorPalette, enabledDictionaries) => {
		genColors(colorPalette);
		for (let i = 0; i < pregame_frames.length; i++) {
			pregame_frames[i].style.display = "none";
		}
		for (let i = 0; i < game_frames.length; i++) {
			game_frames[i].style.display = "block";
		}
		addDictionaries(dictionaries, enabledDictionaries);
		checkIfCreator();
	});
}

function test(data) {
	socket.emit('test', data);
}

function inputObserver() {
	username_input.oninput = function() {
		checkIfJoinable();
	}
	room_input.oninput = function() {
		checkIfJoinable();
	}
}

function optionsObserver() {
	let number_inputs = {
		"lobby_maxplayers": {
			"input": lobby_maxplayers,
			"min": 2,
			"max": 99
		},
		"lobby_timer": {
			"input": lobby_timer,
			"min": 2,
			"max": 300
		},
		"lobby_maxrounds": {
			"input": lobby_maxrounds,
			"min": 2,
			"max": 10
		}
	};
	for (let input in number_inputs) {
		number_inputs[input].input.onchange = function() {
			let numbertest = parseInt(this.value);
			if (numbertest) {
				if (numbertest < number_inputs[input].min) {
					this.value = number_inputs[input].min;
				}
				if (numbertest > number_inputs[input].max) {
					this.value = number_inputs[input].max;
				}
				this.value = parseInt(this.value);
			} else if (this.value != "") {
				this.value = number_inputs[input].min;
			}
			checkIfStartable();
			socket.emit('update_options', user, {
				"maxPlayers": lobby_maxplayers.value,
				"drawTime": lobby_timer.value,
				"maxRounds": lobby_maxrounds.value,
				"dictionaries": getDictionaries()
			});
		}
	}
}

function join() {
	join_input.onclick = function() {
		user.name = username_input.value;
		socket.emit('update_user', user);
		let room = room_input.value;
		let lang = language_input.value;
		socket.emit('join_room', {
			user,
			room,
			lang
		});
	}
}

function startGame() {
	start_game.onclick = function() {
		let options = {
			"maxPlayers": lobby_maxplayers.value,
			"drawTime": lobby_timer.value,
			"maxRounds": lobby_maxrounds.value,
			"dictionaries": getDictionaries().enabled
		}
		socket.emit('start_game', user, options);
	}
}

function sendMessage() {
	newmessage.addEventListener('keydown', function(e) {
		if (e.keyCode == 13 && this.value != "") {
			socket.emit('send_message', {
				"user": user,
				"message": this.value
			});
			this.value = "";
		}
	})
}

function checkIfJoinable() {
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

function checkIfStartable(request_usernumber = true) {
	start_game.disabled = false;
	if (getDictionaries().enabled.length == 0) {
		start_game.disabled = true;
	}
	if (
		parseInt(lobby_maxplayers.value) != lobby_maxplayers.value ||
		parseInt(lobby_timer.value) != lobby_timer.value ||
		parseInt(lobby_maxrounds.value) != lobby_maxrounds.value
	) {
		start_game.disabled = true;
	}
	if (request_usernumber) {
		socket.emit('request_usernumber');
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
		checkIfJoinable();
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
	roomname.innerHTML = `Room Name: ${room.name}`;
	roomgamestate.innerHTML = `${room.gamestate}`;
	roomtimer.innerHTML = `Time: ${room.timer}`;
	if (user.artist) {
		drawingTools_disabled.style.display = "none";
		roomword.innerHTML = `Word: ${room.currentWord}`;
	} else {
		drawingTools_disabled.style.display = "block";
		let underscores = "";
		for (let i = 0; i < room.currentWord.length; i++) {
			underscores += "_ ";
		}
		roomword.innerHTML = `Word: ${underscores}`;
	}
	let players_string = 'Player';
	if (room.slots.used > 1) {
		players_string += 's';
	}
	roomplayercount.innerHTML = `${players_string}: ${room.slots.used}/${room.slots.available}`;
}

function addPlayer(player, artists) {
	let userlistentry = document.createElement('div');
	userlistentry.className = "userlistentry";
	userlistentry.style.backgroundColor = `var(--${player.color.bg}5)`;

	let usernamepre = document.createElement('div');
	usernamepre.className = "usernamepre";
	let usernameprespan = document.createElement('span');
	if (player.artist) {
		usernameprespan.style.color = `var(--grey${player.color.fg})`;
		usernameprespan.innerHTML = '<i class="fas fa-circle"></i>';
	} else if (artists.includes(player.id)) {
		usernameprespan.style.color = `var(--${player.color.bg}7)`;
		usernameprespan.innerHTML = '<i class="fas fa-circle"></i>';
	} else {
		usernameprespan.style.color = `var(--${player.color.bg}9)`;
		usernameprespan.innerHTML = '<i class="far fa-circle"></i>';
	}

	let username = document.createElement('div');
	username.className = "username";
	let usernamespan = document.createElement('span');
	usernamespan.innerHTML = player.name;
	usernamespan.style.color = `var(--grey${player.color.fg})`;
	if (player.id == user.id) {
		// usernamespan.innerHTML += " (You)";
		usernamespan.style.fontWeight = "bold";
	}

	let score = document.createElement('div');
	score.className = "score";
	let scorespan = document.createElement('span');
	scorespan.innerHTML = player.score;
	scorespan.style.color = `var(--grey${player.color.fg})`;

	usernamepre.append(usernameprespan);
	username.append(usernamespan);
	score.append(scorespan);
	userlistentry.append(usernamepre);
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
	authorspan.style.color = `var(--${sender.color.bg}9)`;
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

function addDictionaries(dictionaries, enabledDictionaries) {
	let first = true;
	for (let dict in dictionaries) {
		if (first) {
			state = "first";
		} else {
			state = "second";
		}
		first = !first;
		let option_container = document.createElement('div');
		option_container.className = "option_container " + state;
		let option_description = document.createElement('span');
		option_description.className = "option_description";
		option_description.innerHTML = dict;
		let option_input = document.createElement('input');
		option_input.className = "option_input";
		option_input.id = "dict_input_" + dict;
		if (enabledDictionaries.includes(dict)) {
			option_input.checked = true;
		}
		option_input.type = "checkbox";
		option_input.onchange = function() {
			checkIfStartable();
			socket.emit('update_options', user, {
				"maxPlayers": lobby_maxplayers.value,
				"drawTime": lobby_timer.value,
				"maxRounds": lobby_maxrounds.value,
				"dictionaries": getDictionaries()
			});
		}

		option_container.append(option_description);
		option_container.append(option_input);
		lobby_dictionaries.append(option_container);
	}
}

function getDictionaries() {
	let dicts = {
		"enabled": [],
		"disabled": []
	};
	let dictname, isset;
	for (let i = 0; i < lobby_dictionaries.children.length; i++) {
		if (lobby_dictionaries.children[i].className.includes("option_container")) {

			for (let j = 0; j < lobby_dictionaries.children[i].children.length; j++) {

				if (lobby_dictionaries.children[i].children[j].className.includes("option_description")) {
					dictname = lobby_dictionaries.children[i].children[j].innerHTML;
				}

				if (lobby_dictionaries.children[i].children[j].className.includes("option_input")) {
					isset = lobby_dictionaries.children[i].children[j].checked;
				}
			}
			if (isset) {
				dicts.enabled.push(dictname);
			} else {
				dicts.disabled.push(dictname);
			}
		}
	}
	return dicts;
}

function genColors(colorPalette) {
	for (let strength = 3; strength <= 9; strength += 2) {
		colorPalette.forEach((entry) => {
			color = entry.bg;
			let colorSource = document.createElement('div');
			colorSource.className = "colorSource";
			colorSource.id = `${color}${strength}`;
			colorSource.style.backgroundColor = `var(--${color}${strength})`;
			colorSource.addEventListener('click', function() {
				currentColor.style.backgroundColor = `var(--${this.id})`;
				selColor = window.getComputedStyle(this, null).getPropertyValue("background-color");
				selColor = selColor.substr(4, selColor.length - 5);
				selColor = selColor.split(", ");
				lastcolor = selColor;
				changeCursor(pencilWidth, selColor);
				cfd.setStrokeColor(selColor);
				cfd.configBucketTool({
					color: selColor,
					tolerance: bucketToolTolerance
				})
			});
			colorSource.addEventListener('mouseover', function(event) {
				if (event.buttons == 1) {
					currentColor.style.backgroundColor = `var(--${this.id})`;
					selColor = window.getComputedStyle(this, null).getPropertyValue("background-color");
					selColor = selColor.substr(4, selColor.length - 5);
					selColor = selColor.split(", ");
					lastcolor = selColor;
					changeCursor(pencilWidth, selColor);
					cfd.setStrokeColor(selColor);
					cfd.configBucketTool({
						color: selColor,
						tolerance: bucketToolTolerance
					})
				}
			});
			colorsContainer.append(colorSource);
		});
	}
}

function changeCursor(size, color) {
	let cursorCanvas = document.getElementById("cursorCanvas");
	let context = cursorCanvas.getContext("2d");
	context.clearRect(0, 0, 110, 110);
	context.beginPath();
	context.lineWidth = 5;
	context.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
	context.arc(55, 55, (size / 2) - 2, 0, 2 * Math.PI);
	context.stroke();
	context.closePath();
	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = "#000";
	if (size > 8) {
		context.arc(55, 55, (size / 2) - 4, 0, 2 * Math.PI);
	}
	context.stroke();
	context.closePath();
	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = "#000";
	context.arc(55, 55, (size / 2) + 1, 0, 2 * Math.PI);
	context.stroke();
	context.closePath();

	game.style.cursor = `url(${cursorCanvas.toDataURL()}) 50 50, auto`;
}