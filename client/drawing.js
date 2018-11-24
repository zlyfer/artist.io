function initcfd() {
	cfd = new CanvasFreeDrawing({
		elementId: 'game',
		width: 776,
		height: 572
	});

	bucketToolTolerance = 50;

	pencil.onclick = () => {
		if (cfd.isBucketToolEnabled) {
			cfd.toggleBucketTool();
		}
		cfd.setStrokeColor(lastcolor);
		toogleTool("pencil");
	}
	eraser.onclick = () => {
		if (cfd.isBucketToolEnabled) {
			cfd.toggleBucketTool();
		}
		cfd.setStrokeColor([238, 238, 238]);
		toogleTool("eraser");
	}
	bucket.onclick = () => {
		if (!cfd.isBucketToolEnabled) {
			cfd.toggleBucketTool();
			toogleTool("bucket");
		}
	}
	clear.onclick = () => {
		cfd.clear();
		transmitCfdData(cfd);
		// toogleTool("clear");
	}

	function toogleTool(tool) {
		let tools = document.getElementsByClassName('tools');
		for (let i = 0; i < tools.length; i++) {
			tools[i].className = "tools";
		}
		let tool_active = document.getElementById(tool);
		tool_active.className = "tools active";
	}

	cfd.setLineWidth(5);
	cfd.setStrokeColor([0, 0, 0]);
	cfd.configBucketTool({
		color: [0, 0, 0],
		tolerance: bucketToolTolerance
	})
	cfd.setBackground([238, 238, 238]);

	cfd.on({
		event: 'redraw',
		counter: 0
	}, () => {
		console.log("test");
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