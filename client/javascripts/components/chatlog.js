// jshint esversion: 6
function main_chatlog() {
	vue_chatlog = new Vue({
		el: "#chatlog",
		data: {
			chatlog: []
		},
		methods: {}
	});

	socket.on("getChatlog", function(chatlog) {
		vue_chatlog.chatlog = chatlog;
		$("#chatlog")[0].scrollTo({
			top: $("#chatlog")[0].scrollHeight,
			left: 0,
			behavior: "smooth"
		});
	});
}
