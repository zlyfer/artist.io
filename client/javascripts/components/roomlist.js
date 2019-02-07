// jshint esversion: 6
function main_roomlist() {
	vue_roomlist = new Vue({
		el: '#roomlist',
		data: {
			roomlist: []
		},
		methods: {
			select: function (id) {
				$('.roomlist-entry').removeClass('selected');
				$(`#${id}`).addClass('selected');
				let roomname = vue_roomlist.roomlist[id].name;
				$('#userform-roomname').val(roomname);
				socket.emit('checkJoinOrCreate', $('#userform-roomname').val());
				checkIfJoinable();
			}
		}
	});

	socket.on('getRoomlist', function (roomlist) {
		vue_roomlist.roomlist = roomlist;
		socket.emit('checkJoinOrCreate', $('#userform-roomname').val());
	});
}