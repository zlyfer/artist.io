function main_userform() {
	vue_userform = new Vue({
		el: '#userform',
		data: {
			onlinePlayers: 0,
			joinOrCreate: "Create Room",
			username: "Unnamed",
			userColor: 0
		}
	});

	$('#userform-username').on('input', function() {
		checkIfJoinable();
	});
	$('#userform-roomname').on('input', function() {
		checkIfJoinable();
		socket.emit('checkJoinOrCreate', this.value);
	});
	$('#userform-color').on('input', function() {
		$('#userform-color').css('--userColor', this.value);
	})
	$('#userform-join').on('click', function() {
		socket.emit('renameAndJoin', $('#userform-username').val(), $('#userform-color').val(), $('#userform-roomname').val(), $('#userform-language').val());
	});

	socket.on('getUserColor', function(userColor) {
		vue_userform.userColor = userColor;
		$('#userform-color').css('--userColor', userColor);
	});
	socket.on('getOnlinePlayers', function(onlinePlayers) {
		vue_userform.onlinePlayers = onlinePlayers;
	});
	socket.on('checkJoinOrCreate', function(joinOrCreate) { // FIXME: username- and color gets resetted upon input of roomname.
		if (joinOrCreate) {
			vue_userform.joinOrCreate = "Join Room";
		} else {
			vue_userform.joinOrCreate = "Create Room";
		}
	});
}

function checkIfJoinable() {
	if ($('#userform-username').val() != "" && $('#userform-roomname').val() != "") {
		$('#userform-join').prop('disabled', false);
	} else {
		$('#userform-join').prop('disabled', true);
	}
}