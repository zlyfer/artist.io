// jshint esversion: 6
// BUG: Cursor not updating, when click-dragging the mouse. EDIT: Only sometimes?
var vue_cursor,
	vue_userform,
	vue_roomlist,
	vue_header,
	vue_userlist,
	vue_lobby,
	vue_canvas,
	vue_results,
	vue_drawingTools,
	vue_drawingToolsDisabled,
	vue_chatlog,
	vue_newmessage;

var drawingCanvas, userlistTimeout;
var reset = false;

$(document).ready(function() {
	main_vue();
	main_socketio();

	main_cursor();
	main_userform();
	main_roomlist();
	main_header();
	main_userlist();
	main_lobby();
	main_canvas();
	main_results();
	main_drawingTools();
	main_drawingToolsDisabled();
	main_chatlog();
	main_newmessage();
});

function main_vue() {
	// vue_ = new Vue({
	// 	el: '#',
	// 	data: {
	//
	// 	},
	// 	methods: {
	//
	// 	}
	// });
}

function main_socketio() {
	// NOT TESTING:
	socket = io("https://zlyfer.net:3000", {
		rejectUnauthorized: false
	});
	// END

	// TESTING: Client
	// socket = io("http://localhost:3000");
	// END

	socket.on("connected", () => {
		if (reset) location.reload();
		reset = true;
		$("#connecting").css("display", "none");
		showWelcome();
	});
	socket.on("toast", message => {
		toastr[message.type](message.content);
	});
	socket.on("joinedRoom", () => {
		showLobby();
	});
	socket.on("closeRoom", message => {
		toastr[message.type](message.content);
		showWelcome();
	});
	socket.on("updateRoom", data => {
		clearTimeout(userlistTimeout);
		vue_header.name = data.header.name;
		vue_header.gamestate = data.header.gamestate;
		vue_header.time = data.header.time;
		vue_header.slots.current = data.header.slots.current;
		vue_header.slots.value = data.header.slots.value;
		vue_header.slots.spectators = data.header.slots.spectators;
		if (jsonCompare(data.userlist.players, vue_userlist.userlist) == false) {
			for (let user of vue_userlist.userlist) {
				if (JSON.stringify(data.userlist.players).includes(user.id) == false) {
					$(`#${user.id}`).removeClass("zoomInLeft");
					$(`#${user.id}`).addClass("zoomOutLeft");
				}
			}
		}
		vue_lobby.options = data.lobby.options;
		vue_lobby.dictionaries = data.lobby.dictionaries;
		userlistTimeout = setTimeout(function() {
			$(".userlist-entry").removeClass("zoomOutLeft");
			vue_userlist.userlist = data.userlist.players;
			vue_lobby.checkStart();
		}, 1000);
	});
	socket.on("artist", artist => {
		console.log("test", artist);
		if (artist) {
			drawingCanvas.enableDrawingMode();
			$("#drawingToolsDisabled").css("display", "none");
			changeCursor();
		} else {
			drawingCanvas.disableDrawingMode();
			$("#drawingToolsDisabled").css("display", "block");
			drawingCanvas.tool = "notartist";
			changeCursor();
		}
	});
	socket.on("startGame", () => {
		$("#lobby").removeClass("zoomIn");
		$("#lobby").addClass("zoomOut");
		$("#canvas").css("display", "block");
	});
	socket.on("nextRound", () => {
		$("#results").css("display", "none");
		drawingCanvas.clear();
	});
	socket.on("endRound", (message, word) => {
		$("#results").css("display", "block");
		vue_results.final = false;
		vue_results.message = message;
		vue_results.word = word;
	});
	socket.on("endGame", (message, word, scoreboard) => {
		$("#results").css("display", "block");
		vue_results.final = true;
		vue_results.message = message;
		vue_results.word = word;
		vue_results.scoreboard = scoreboard;
	});
	socket.on("resetGame", () => {
		$("#lobby").removeClass("zoomOut");
		$("#lobby").addClass("zoomIn");
		$("#canvas").css("display", "none");
		$("#results").css("display", "none");
		$("#drawingToolsDisabled").css("display", "block");
		drawingCanvas.clear();
	});
}

function showWelcome() {
	vue_userlist.userlist = [];
	$("#userform").removeClass("slideOutLeft");
	$("#roomlist").removeClass("slideOutRight");
	$("#userform").addClass("slideInLeft");
	$("#roomlist").addClass("slideInRight");
	setTimeout(function() {
		$(".welcome").css("display", "block");
		$(".pre").css("display", "none");
	}, 500);
	$("#canvas").css("display", "none");
	drawingCanvas.clear();
}

function showLobby() {
	$("#userform").removeClass("slideInLeft");
	$("#roomlist").removeClass("slideInRight");
	$("#userform").addClass("slideOutLeft");
	$("#roomlist").addClass("slideOutRight");
	setTimeout(function() {
		$(".welcome").css("display", "none");
		$(".pre").css("display", "block");
	}, 500);
}

function jsonCompare(obj1, obj2) {
	if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
		return true;
	} else {
		return false;
	}
}

function getRGB(cssString) {
	let rgb = cssString
		.replace("rgb(", "")
		.replace(")", "")
		.split(",");
	rgb[0] = parseInt(rgb[0]);
	rgb[1] = parseInt(rgb[1]);
	rgb[2] = parseInt(rgb[2]);
	return rgb;
}

function changeCursor(
	clear = true,
	context = $("#cursor")[0].getContext("2d")
) {
	let size = drawingCanvas.lineWidth;
	let color = drawingCanvas.strokeColor;
	if (clear) context.clearRect(0, 0, 120, 120);

	switch (drawingCanvas.tool) {
		case "pencil":
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = "#000000";
			context.arc(60, 60, size / 2 + 10, 0, 2 * Math.PI);
			context.stroke();
			context.closePath();

			context.beginPath();
			context.lineWidth = 5;
			context.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			context.arc(60, 60, size / 2 + 5, 0, 2 * Math.PI);
			context.stroke();
			context.closePath();

			if (size > 9) {
				context.beginPath();
				context.lineWidth = 1;
				context.strokeStyle = "#000000";
				context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.22)`;
				context.arc(60, 60, size / 2, 0, 2 * Math.PI);
				context.fill();
				context.stroke();
				context.closePath();
			}
			break;
		case "eraser":
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = "#000000";
			context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.22)`;
			context.arc(60, 60, size / 2, 0, 2 * Math.PI);
			context.fill();
			context.stroke();
			context.closePath();
			break;
		case "extractor":
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = "#000000";
			context.moveTo(60, 55);
			context.lineTo(60, 65);
			context.moveTo(55, 60);
			context.lineTo(65, 60);
			context.stroke();
			context.closePath();

			context.beginPath();
			context.lineWidth = 5;
			context.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			context.arc(60, 60, 20 + 5, 0, 2 * Math.PI);
			context.stroke();
			context.closePath();

			context.beginPath();
			context.lineWidth = 3;
			context.strokeStyle = "#FFFFFF";
			context.arc(60, 60, 22 + 5, 0, 2 * Math.PI);
			context.stroke();
			context.closePath();
			break;
		case "bucket":
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = "#FFFFFF";
			context.moveTo(60, 55);
			context.lineTo(60, 65);
			context.moveTo(55, 60);
			context.lineTo(65, 60);
			context.stroke();
			context.closePath();

			context.beginPath();
			context.lineWidth = 5;
			context.strokeStyle = "#000000";
			context.arc(60, 60, 20 + 5, 0, 2 * Math.PI);
			context.stroke();
			context.closePath();

			context.beginPath();
			context.lineWidth = 3;
			context.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			context.arc(60, 60, 22 + 5, 0, 2 * Math.PI);
			context.stroke();
			context.closePath();
			break;
		case "zoom":
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = "#000000";
			context.rect(0, 0, 120, 120);
			context.stroke();
			context.closePath();
			break;
		case "notartist":
			context.beginPath();
			context.lineWidth = 5;
			context.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			context.arc(60, 60, size / 2 + 10, 0, 2 * Math.PI);
			context.stroke();
			context.closePath();
			break;
	}
	$("#canvas").css("cursor", `url(${$("#cursor")[0].toDataURL()}) 60 60, auto`);
}

// Thanks to: https://stackoverflow.com/a/17130415
function getMousePos(canvas, evt) {
	let rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function extractColor(pos) {
	let pixel = $("#canvas")[0]
		.getContext("2d")
		.getImageData(pos.x, pos.y, 1, 1).data;
	let rgb = [pixel[0], pixel[1], pixel[2]];
	drawingCanvas.setStrokeColor(rgb);
	drawingCanvas.configBucketTool({
		color: rgb
	});
	drawingCanvas.lcolor = rgb;
	$(`.color-source`).removeClass("active");
	changeCursor();
}
