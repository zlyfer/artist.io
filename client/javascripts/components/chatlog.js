function main_chatlog() {
	vue_chatlog = new Vue({
		el: '#chatlog',
		data: {
			chatlog: []
		},
		methods: {

		}
	});

	socket.on('getChatlog', function(chatlog) {
		vue_chatlog.chatlog = chatlog;
	});
}