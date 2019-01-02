var
	vue_cursor,
	vue_credits,
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
	main_credits();
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

	socket.on('displayError', error => {
		console.log(error);
	});
	socket.on('joinedRoom', () => {
		$('#userform').removeClass('slideInLeft');
		$('#roomlist').removeClass('slideInRight');
		$('.welcome').addClass('zoomOut');
		setTimeout(function() {
			$('.welcome').css('display', 'none');
			$('.pre').css('display', 'block');
		}, 250);
	});
	socket.on('updateRoom', data => {
		vue_header.name = data.header.name;
		vue_header.gamestate = data.header.gamestate;
		vue_header.word = data.header.word;
		vue_header.time = data.header.time;
		vue_header.slots.current = data.header.slots.current;
		vue_header.slots.value = data.header.slots.value;
		vue_userlist.userlist = data.userlist.players;
		vue_lobby.options = data.lobby.options;
		vue_lobby.dictionaries = data.lobby.dictionaries;
		vue_lobby.allowEdit = data.lobby.allowEdit;
	});
}