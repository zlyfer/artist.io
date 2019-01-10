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
		vue_header.name = data.header.name;
		vue_header.gamestate = data.header.gamestate;
		vue_header.word = data.header.word;
		vue_header.time = data.header.time;
		vue_header.slots.current = data.header.slots.current;
		vue_header.slots.value = data.header.slots.value;
		vue_header.slots.spectators = data.header.slots.spectators;
		// START IDEA: Transition for userlist entry that leaves the room. Maybe find a better vue-native solution?
		if (jsonCompare(data.userlist.players, vue_userlist.userlist) == false) {
			for (let user of vue_userlist.userlist) {
				if (JSON.stringify(data.userlist.players).includes(user.id) == false) {
					$(`#${user.id}`).removeClass('zoomInLeft');
					$(`#${user.id}`).addClass('zoomOutLeft');
				}
			}
		}
		setTimeout(function() {
			$('.userlist-entry').removeClass('zoomOutLeft');
			vue_userlist.userlist = data.userlist.players;
		}, 1000);
		// END
		vue_lobby.options = data.lobby.options;
		vue_lobby.dictionaries = data.lobby.dictionaries;
		vue_lobby.allowEdit = data.lobby.allowEdit;
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