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
	// vue_header = new Vue({
	// 	el: '#id',
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
	socket.on('joinedRoom', room => {
		$('.welcome').css('display', 'none');
		$('.pre').css('display', 'block');
		updateRoom(room);
	});
	socket.on('updateRoom', room => {
		updateRoom(room);
	});
}

function checkIfJoinable() {
	if ($('#userform-username').val() != "" && $('#userform-roomname').val() != "") {
		$('#userform-join').prop('disabled', false);
	} else {
		$('#userform-join').prop('disabled', true);
	}
}

function updateRoom(room) {
	vue_header.room = room;
	vue_userlist.userlist = room.playerList;
}