function main_lobby() {
	vue_lobby = new Vue({
		el: '#lobby',
		data: {
			options: {},
			dictionaries: [],
			allowEdit: false
		},
		methods: {
			updateLobby(event) {
				for (opt in this.options) {
					let option = this.options[opt];
					if (option.type == "number") {
						let num = parseInt(option.value);
						if (num != option.value) {
							option.value = option.min;
						} else {
							if (option.value < option.min) {
								option.value = option.min;
							} else if (option.value > option.max) {
								option.value = option.max;
							}
						}
					}
				}
				let one = false;
				for (dict in this.dictionaries) {
					let dictionary = this.dictionaries[dict];
					if (dictionary.activated == true) {
						one = true;
					}
				}
				if (one == false) {
					$('#lobby-start').prop('disabled', true);
				} else {
					$('#lobby-start').prop('disabled', false);
				}
				socket.emit('updateLobby', vue_lobby.options, vue_lobby.dictionaries);
			}
		}
	});
}