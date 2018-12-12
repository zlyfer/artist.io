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

window.onload = function() {
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
}

function main_vue() {}

function main_socketio() {
	// NOT TESTING:
	// socket = io('https://zlyfer.net:3000', {
	// 	rejectUnauthorized: false
	// });
	// END

	// TESTING:
	// socket = io('http://localhost:3000');
	// END
}