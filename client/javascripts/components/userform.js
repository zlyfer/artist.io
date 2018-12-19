function main_userform() {
	vue_userform = new Vue({
		el: '#userform',
		data: {
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
		socket.emit('renameAndJoin', $('#userform-username').val(), $('#userform-roomname').val(), $('#userform-language').val());
	});

	socket.on('checkJoinOrCreate', function(joinOrCreate) {
		vue_userform.joinOrCreate = {
			true: "Join Room",
			false: "Create Room"
		} [joinOrCreate];
	});
	socket.on('getUserColor', function(color) {
		vue_userform.userColor = color;
		$('#userform-color').css('--userColor', color);
	});

}