function initcfd() {
	const cfd = new CanvasFreeDrawing({
		elementId: 'game',
		width: 776,
		height: 572
	});

	cfd.setLineWidth(3);
	cfd.setStrokeColor([0, 0, 0]);
	cfd.setBackground([238, 238, 238]);

	cfd.on({
		event: 'redraw'
	}, () => {
		transmitCfdData(cfd);
	});

	socket.on('update_canvas', (canvas) => {
		if (canvas) {
			cfd.restore(canvas);
		}
	});
	socket.on('apply_artist', (artist) => {
		if (user.id == artist) {
			cfd.enableDrawingMode();
		} else {
			cfd.disableDrawingMode();
		}
	});
}