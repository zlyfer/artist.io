function main_lobby() {
	vue_lobby = new Vue({
		el: '#lobby',
		data: {
			options: {},
			dictionaries: [],
			allowEdit: false
		},
		methods: {
			updateLobby(event, check = true) {
				if (check) {
					for (opt in this.options) {
						let option = this.options[opt];
						// Check if number is in range:
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
						// Check if value is one of the available options:
						// if (option.type == "select") {} // Vue changes the value back automatically if alterd.
						// Check if text length is in range:
						if (option.type == "text") {
							if (option.value.length > option.max) {
								option.value = option.value.substr(0, 16);
							} else if (option.value.length < option.min) {
								option.value = "Unnamed";
							}
						}
						// Check dependency:
						if (option.dependencies != false) {
							let disabled = false;
							for (let dependency of option.dependencies) {
								if (
									$(`#option-${dependency.name}`).val() != dependency.value &&
									$(`#option-${dependency.name}`).prop('checked') != dependency.value
								) {
									disabled = true;
								}
							}
							option.disabled = disabled;
						}
					}
					// Check if at least one dictionary is selected:
					let one = false;
					for (let dict in this.dictionaries) {
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
				}
				socket.emit('updateLobby', vue_lobby.options, vue_lobby.dictionaries);
			}
		}
	});
}