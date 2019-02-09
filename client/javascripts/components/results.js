// jshint esversion: 6
function main_results() {
	vue_results = new Vue({
		el: "#results",
		data: {
			final: false,
			message: "",
			nextIn: 0,
			word: "",
			scoreboard: []
		}
	});

	socket.on("tickNextIn", nextIn => {
		vue_results.nextIn = nextIn;
	});
}
