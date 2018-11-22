function initcfd() {
	cfd = new CanvasFreeDrawing({
		elementId: 'game',
		width: 776,
		height: 572
	});

	cfd.setLineWidth(5);
	cfd.setStrokeColor([0, 0, 0]);
	cfd.setBackground([238, 238, 238]);

	cfd.on({
		event: 'redraw',
		counter: 0
	}, () => {
		transmitCfdData(cfd);
	});

	socket.on('update_canvas', (canvas) => {
		cfd.restore(canvas);
	});
	socket.on('apply_artist', (artist) => {
		cfd.clear();
		if (user.id == artist) {
			cfd.enableDrawingMode();
		} else {
			cfd.disableDrawingMode();
		}
	});
}