function main_header() {
	vue_header = new Vue({
		el: '#header',
		data: {
			room: {
				name: "Unnamed",
				time: {
					used: 0,
					left: 0,
					available: 0
				},
				slots: {
					used: 0,
					left: 0,
					available: 0
				},
				word: {
					word: "",
					hint: ""
				}
			}
		},
		methods: {

		}
	});
}