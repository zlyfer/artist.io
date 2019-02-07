// jshint esversion: 6
function main_userform() {
	vue_userform = new Vue({
		el: '#userform',
		data: {
			onlinePlayers: 0,
			username: 'Unnamed',
			userColor: 0,
			joinOrCreate: 'Create Room'
		}
	});

	$('#userform-username').on('input', function () {
		checkIfJoinable();
	});
	$('#userform-roomname').on('input', function () {
		checkIfJoinable();
		$('.roomlist-entry').removeClass('selected');
		socket.emit('checkJoinOrCreate', this.value);
	});
	$('#userform-color').on('input', function () {
		$('#userform-color').css('--userColor', this.value);
	});
	$('#userform-join').on('click', function () {
		socket.emit('renameAndJoin', $('#userform-username').val(), $('#userform-color').val(), $('#userform-roomname').val(), $('#userform-language').val());
	});
	$('#userform-spectate').on('click', function () {
		socket.emit('renameAndSpectate', $('#userform-username').val(), $('#userform-color').val(), $('#userform-roomname').val(), $('#userform-language').val());
	});
	$('.userform-enter2continue').on('keypress', function (event) {
		if (event.keyCode == 13) {
			socket.emit('renameAndJoin', $('#userform-username').val(), $('#userform-color').val(), $('#userform-roomname').val(), $('#userform-language').val());
		}
	});

	socket.on('getUserColor', function (userColor) {
		vue_userform.userColor = userColor;
		$('#userform-color').css('--userColor', userColor);
	});
	socket.on('getUsername', function (username) {
		vue_userform.username = username;
	});
	socket.on('getOnlinePlayers', function (onlinePlayers) {
		vue_userform.onlinePlayers = onlinePlayers;
	});
	socket.on('checkJoinOrCreate', function (joinOrCreate) {
		if (joinOrCreate) {
			vue_userform.joinOrCreate = 'Join Room';
			$('#userform-spectate').prop('disabled', false);
			$('#userform-language').prop('disabled', true);
		} else {
			vue_userform.joinOrCreate = 'Create Room';
			$('#userform-spectate').prop('disabled', true);
			$('#userform-language').prop('disabled', false);
		}
	});
}

function checkIfJoinable() {
	if ($('#userform-username').val() != '' && $('#userform-roomname').val() != '') {
		$('#userform-join').prop('disabled', false);
	} else {
		$('#userform-join').prop('disabled', true);
	}
}