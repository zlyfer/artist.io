function initcfd() {
	bucketToolTolerance = 1;
	pencilWidth = 5;
	lastcolor = [33, 33, 33];
	selColor = [33, 33, 33];

	cfd = new CanvasFreeDrawing({
		elementId: 'game',
		width: 776,
		height: 572,
		maxSnapshots: 999,
		setLineWidth: pencilWidth,
		strokeColor: selColor,
		backgroundColor: [238, 238, 238]
	});

	cfd.configBucketTool({
		color: [33, 33, 33],
		tolerance: bucketToolTolerance
	})

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
	undo.onclick = () => {
		cfd.undo();
		transmitCfdData(cfd);
		// toogleTool("clear");
	}
	redo.onclick = () => {
		cfd.redo();
		transmitCfdData(cfd);
		// toogleTool("clear");
	}

	function toogleTool(tool) {
		let tools = document.getElementsByClassName('tools');
		for (let i = 0; i < tools.length; i++) {
			tools[i].className = tools[i].className.replace(" active", "");
		}
		let tool_active = document.getElementById(tool);
		tool_active.className += " active";
	}

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