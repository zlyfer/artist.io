function main_drawingTools() {
	vue_drawingTools = new Vue({
		el: '#drawingTools',
		data: {
			colors: []
		},
		methods: {
			select(color) {
				$(`.color-source`).removeClass('active');
				$(`#color-${color}`).addClass('active');
				let rgb = getRGB($(`#color-${color}`).css('background-color'));
				drawingCanvas.enableDrawingMode();
				drawingCanvas.setStrokeColor(rgb);
				drawingCanvas.configBucketTool({
					color: rgb
				});
				drawingCanvas.lcolor = rgb;
				changeCursor();
			},
			hover(event, color) {
				if (event.buttons > 0)
					this.select(color);
			}
		}
	});

	$('#pencil').on('click', () => {
		if (drawingCanvas.isBucketToolEnabled)
			drawingCanvas.toggleBucketTool();
		drawingCanvas.enableDrawingMode();
		drawingCanvas.setStrokeColor(drawingCanvas.lcolor);
		toogleTool('pencil');
	});
	$('#eraser').on('click', () => {
		if (drawingCanvas.isBucketToolEnabled)
			drawingCanvas.toggleBucketTool();
		drawingCanvas.enableDrawingMode();
		drawingCanvas.setStrokeColor(drawingCanvas.backgroundColor);
		toogleTool('eraser');
	});
	$('#extractor').on('click', () => {
		if (drawingCanvas.isBucketToolEnabled)
			drawingCanvas.toggleBucketTool();
		drawingCanvas.disableDrawingMode();
		toogleTool('extractor');
	});
	$('#zoom').on('click', () => {
		if (drawingCanvas.isBucketToolEnabled)
			drawingCanvas.toggleBucketTool();
		drawingCanvas.disableDrawingMode();
		toogleTool('zoom');
	});
	$('#bucket').on('click', () => {
		drawingCanvas.enableDrawingMode();
		if (!drawingCanvas.isBucketToolEnabled) {
			drawingCanvas.toggleBucketTool();
			toogleTool('bucket');
		}
	});
	$('#clear').on('click', () => {
		drawingCanvas.clear();
		socket.emit('updateCanvas', drawingCanvas.save());
	});
	$('#undo').on('click', () => {
		drawingCanvas.undo();
		socket.emit('updateCanvas', drawingCanvas.save());
	});
	$('#redo').on('click', () => {
		drawingCanvas.redo();
		socket.emit('updateCanvas', drawingCanvas.save());
	});

	function toogleTool(tool) {
		$('.tools').removeClass('active');
		$(`#${tool}`).addClass('active');
		drawingCanvas.tool = tool;
		changeCursor();
	}

	socket.on('getColors', color => {
		vue_drawingTools.colors = color;
	});
}