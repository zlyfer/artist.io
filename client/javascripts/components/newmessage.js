function main_newmessage() {
	$('#newmessage-send').on('click', function() {
		sendMessage();
	});
	$('#newmessage-text').on('keypress', function(event) {
		if (event.keyCode == 13) {
			sendMessage();
		}
	});
}

function sendMessage() {
	let content = $('#newmessage-text').val();
	if (content != '') {
		socket.emit('sendMessage', content);
		$('#newmessage-text').val('');
	}
}