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
				drawingCanvas.setStrokeColor(rgb);
				drawingCanvas.configBucketTool({
					color: rgb
				});
				drawingCanvas.lcolor = rgb;
			},
			hover(event, color) {
				if (event.buttons == 1)
					this.select(color);
			}
		}
	});

	$('#pencil').on('click', () => {
		if (drawingCanvas.isBucketToolEnabled)
			drawingCanvas.toggleBucketTool();
		drawingCanvas.setStrokeColor(drawingCanvas.lcolor);
		toogleTool('pencil');
	});

	$('#eraser').on('click', () => {
		if (drawingCanvas.isBucketToolEnabled)
			drawingCanvas.toggleBucketTool();
		drawingCanvas.setStrokeColor(drawingCanvas.backgroundColor);
		toogleTool('eraser');
	});

	$('#bucket').on('click', () => {
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
	}

	socket.on('getColors', color => {
		vue_drawingTools.colors = color;
	});
}