// jshint esversion: 6
function main_lobby() {
	vue_lobby = new Vue({
		el: '#lobby',
		data: {
			options: {},
			dictionaries: [],
			allowEdit: false
		},
		methods: {
			updateLobby(check = true) {
				if (check) {
					for (let opt in this.options) {
						let option = this.options[opt];
						// Check if number is in range:
						if (option.type == 'number') {
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
						// Check if text length is in range:
						if (option.type == 'text') {
							if (option.value.length > option.max) {
								option.value = option.value.substr(0, 16);
							} else if (option.value.length < option.min) {
								option.value = 'Unnamed';
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
					this.checkStart();
				}
				socket.emit('updateLobby', vue_lobby.options, vue_lobby.dictionaries);
			},
			checkStart() {
				// Check if at least one dictionary is selected:
				let one = false;
				for (let dict in this.dictionaries) {
					let dictionary = this.dictionaries[dict];
					if (dictionary.activated == true)
						one = true;
				}
				// Check if at least 2 non-spectators are there.
				let players = 0;
				for (let i = 0; i < vue_userlist.userlist.length; i++) {
					if (vue_userlist.userlist[i].title != 'spectator')
						players++;
				}
				if (one == false || players < 2) {
					$('#lobby-start').prop('disabled', true);
				} else {
					$('#lobby-start').prop('disabled', false);
				}
			}
		},
		watch: {
			allowEdit: function (oldVal, newVal) {
				if (newVal != oldVal) {
					Vue.nextTick(function () {
						vue_lobby.updateLobby();
					});
				}
			}
		}
	});

	$('#lobby-start').on('click', function () {
		socket.emit('startGame');
	});

	socket.on('allowEdit', (allowEdit) => {
		vue_lobby.allowEdit = allowEdit;
	});
}