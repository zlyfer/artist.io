function main_userlist() {
	vue_userlist = new Vue({
		el: '#userlist',
		data: {
			userlist: []
		},
		methods: {
			fixTextColor: function() {
				$('.userlist-entry').each(function() {
					// Get background-color
					let rgb = getRGB($(`#${this.id}`).css('background-color'));
					// Calculate luminescence
					for (val in rgb) {
						val /= 255;
						if (val <= 0.03928) {
							val /= 12.92;
						} else {
							val = Math.pow(((val + 0.055) / 1.055), 2.4);
						}
					}
					let luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
					// Change color of text
					if (luma / 255 < 0.44) {
						$(`#${this.id}`).css('color', "var(--grey1)");
					} else {
						$(`#${this.id}`).css('color', "var(--grey9)");
					}
				});
			}
		},
		updated() {
			this.fixTextColor();
		}
	});
}