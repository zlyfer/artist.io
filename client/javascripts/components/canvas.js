// jshint esversion: 6
function main_canvas() {
	drawingCanvas = new CanvasFreeDrawing({
		elementId: 'canvas',
		width: 776,
		height: 572,
		maxSnapshots: 999,
		setLineWidth: 5,
		strokeColor: [33, 33, 33],
		backgroundColor: [238, 238, 238]
	});
	drawingCanvas.configBucketTool({
		color: [33, 33, 33],
		tolerance: 1
	});

	drawingCanvas.tool = 'pencil';
	drawingCanvas.lcolor = drawingCanvas.strokeColor;
	drawingCanvas.bucketToolTolerance = drawingCanvas.bucketToolTolerance;

	drawingCanvas.on({
		event: 'redraw',
		counter: 0
	}, () => {
		socket.emit('updateCanvas', drawingCanvas.save());
	});

	drawingCanvas.disableDrawingMode();

	socket.on('updateCanvas', data => {
		drawingCanvas.restore(data);
	});
}