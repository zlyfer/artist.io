function main_header() {
	vue_header = new Vue({
		el: '#header',
		data: {
			name: "",
			gamestate: "",
			word: "",
			time: 0,
			slots: {
				current: 0,
				value: 0
			}
		},
		methods: {

		}
	});
}