function main_cursor() {
	$('#canvas')[0].addEventListener('wheel', function(event) {
		if (event.deltaY < 0 && drawingCanvas.lineWidth < 98) {
			drawingCanvas.lineWidth += 2;
			drawingCanvas.setLineWidth(drawingCanvas.lineWidth);
			changeCursor();
		} else if (event.deltaY > 0 && drawingCanvas.lineWidth > 1) {
			drawingCanvas.lineWidth -= 2;
			drawingCanvas.setLineWidth(drawingCanvas.lineWidth);
			changeCursor();
		}
		event.returnValue = false;
	}, false);

	$('#canvas').on('mousemove', function(event) {
		if (drawingCanvas.tool == "zoom") {
			let pos = getMousePos($('#canvas')[0], event);
			let tx = 0;
			let ty = 0;
			pos.nx = pos.x + 60;
			pos.ny = pos.y + 60;
			pos.x -= 60;
			pos.y -= 60;
			if (pos.nx > 776) {
				pos.nx = 776;
				tx = 120 - (776 - pos.x);
			}
			if (pos.ny > 572) {
				pos.ny = 572;
				ty = 120 - (572 - pos.y);
			}
			if (pos.x < 0) {
				pos.x = 0;
				tx = 0;
			}
			if (pos.y < 0) {
				pos.y = 0;
				ty = 0;
			}
			let rawZoomData = $('#canvas')[0].getContext("2d").getImageData(pos.x, pos.y, pos.nx, pos.ny);
			let cursorContext = $('#cursor')[0].getContext("2d");
			cursorContext.clearRect(0, 0, 120, 120);
			cursorContext.putImageData(rawZoomData, tx, ty);
			cursorContext.drawImage($('#cursor')[0], 30, 30, 60, 60, 0, 0, 120, 120);
			changeCursor(false, cursorContext);
		} else if (drawingCanvas.tool == "extractor") {
			let pos = getMousePos($('#canvas')[0], event);
			if (event.buttons > 0)
				extractColor(pos);
		}
	});

	$('#canvas').on('click', function(event) {
		if (drawingCanvas.tool == "extractor") {
			let pos = getMousePos($('#canvas')[0], event);
			extractColor(pos);
		}
	});
}