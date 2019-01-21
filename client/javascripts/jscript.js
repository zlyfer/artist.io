// FIXME: When server restart and page not reloaded just 'soft' resetted, upon creating a room as previously not room-owner error message gets displayed: cannot change settings
// TODO: Reset every component
// TODO: add/remove classes of components and display/don't display them
var
	vue_cursor,
	vue_userform,
	vue_roomlist,
	vue_header,
	vue_userlist,
	vue_lobby,
	vue_canvas,
	vue_results,
	vue_drawingTools,
	vue_drawingToolsDisabled,
	vue_chatlog,
	vue_newmessage;

var
	drawingCanvas,
	userlistTimeout;

$(document).ready(function() {
	main_vue();
	main_socketio();

	main_cursor();
	main_userform();
	main_roomlist();
	main_header();
	main_userlist();
	main_lobby();
	main_canvas();
	main_results();
	main_drawingTools();
	main_drawingToolsDisabled();
	main_chatlog();
	main_newmessage();
});

function main_vue() {
	// vue_ = new Vue({
	// 	el: '#',
	// 	data: {
	//
	// 	},
	// 	methods: {
	//
	// 	}
	// });
}

function main_socketio() {
	// NOT TESTING:
	// socket = io('https://zlyfer.net:3000', {
	// 	rejectUnauthorized: false
	// });
	// END

	// TESTING:
	socket = io('http://localhost:3000');
	// END
	socket.on('connected', () => {
		$('#connecting').css('display', 'none');
		showWelcome();
	});
	socket.on('toast', (message) => {
		toastr[message.type](message.content);
	});
	socket.on('joinedRoom', () => {
		showLobby();
	});
	socket.on('closeRoom', (message) => {
		toastr[message.type](message.content);
		showWelcome();
	});
	socket.on('updateRoom', data => {
		clearTimeout(userlistTimeout);
		vue_header.name = data.header.name;
		vue_header.gamestate = data.header.gamestate;
		vue_header.time = data.header.time;
		vue_header.slots.current = data.header.slots.current;
		vue_header.slots.value = data.header.slots.value;
		vue_header.slots.spectators = data.header.slots.spectators;
		if (jsonCompare(data.userlist.players, vue_userlist.userlist) == false) {
			for (let user of vue_userlist.userlist) {
				if (JSON.stringify(data.userlist.players).includes(user.id) == false) {
					$(`#${user.id}`).removeClass('zoomInLeft');
					$(`#${user.id}`).addClass('zoomOutLeft');
				}
			}
		}
		vue_lobby.options = data.lobby.options;
		vue_lobby.dictionaries = data.lobby.dictionaries;
		userlistTimeout = setTimeout(function() {
			$('.userlist-entry').removeClass('zoomOutLeft');
			vue_userlist.userlist = data.userlist.players;
			vue_lobby.checkStart();
		}, 1000);
	});
	socket.on('artist', (artist) => {
		if (artist) {
			drawingCanvas.enableDrawingMode();
			$('#drawingToolsDisabled').css('display', 'none');
		} else {
			drawingCanvas.disableDrawingMode();
			$('#drawingToolsDisabled').css('display', 'block');
		}
	});
	socket.on('startGame', () => {
		$('#lobby').removeClass('zoomIn');
		$('#lobby').addClass('slideOutRight');
		$('#canvas').css('display', 'block');
	});
	socket.on('nextRound', () => {
		// TODO: update everything
	});
	socket.on('endRound', (reason, scores) => {
		// TODO: update everything
	});
	socket.on('endGame', (reason, scores) => {
		// TODO: update everything
	});
	socket.on('resetGame', () => {
		// TODO: update everything
	});
}

function showWelcome() {
	vue_userlist.userlist = [];
	$('#userform').removeClass('slideOutLeft');
	$('#roomlist').removeClass('slideOutRight');
	$('#userform').addClass('slideInLeft');
	$('#roomlist').addClass('slideInRight');
	setTimeout(function() {
		$('.welcome').css('display', 'block');
		$('.pre').css('display', 'none');
	}, 500);
	$('#canvas').css('display', 'none');
	drawingCanvas.clear();
}

function showLobby() {
	$('#userform').removeClass('slideInLeft');
	$('#roomlist').removeClass('slideInRight');
	$('#userform').addClass('slideOutLeft');
	$('#roomlist').addClass('slideOutRight');
	setTimeout(function() {
		$('.welcome').css('display', 'none');
		$('.pre').css('display', 'block');
	}, 500);
}

function jsonCompare(obj1, obj2) {
	if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
		return true;
	} else {
		return false;
	}
}

function getRGB(cssString) {
	let rgb = cssString.replace('rgb(', '').replace(')', '').split(',');
	rgb[0] = parseInt(rgb[0]);
	rgb[1] = parseInt(rgb[1]);
	rgb[2] = parseInt(rgb[2]);
	return rgb;
}