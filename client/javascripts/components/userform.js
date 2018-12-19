function main_userform() {
	vue_userform = new Vue({
		el: '#userform',
		data: {
			joinOrCreate: "Create Room"
		}
	});

	$('#userform-username').on('input', function() {
		checkIfJoinable();
	});
	$('#userform-roomname').on('input', function() {
		checkIfJoinable();
		socket.emit('checkJoinOrCreate', this.value);
	});
	$('#userform-join').on('click', function() {
		socket.emit('renameAndJoin', $('#userform-username').val(), $('#userform-roomname').val(), $('#userform-language').val());
	});

	socket.on('checkJoinOrCreate', function(joinOrCreate) {
		vue_userform.joinOrCreate = {
			true: "Join Room",
			false: "Create Room"
		} [joinOrCreate];
	});

}