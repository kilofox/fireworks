ig.module(
	'game.main'
	)
	.requires(
		'impact.game',
		'impact.image',
		'impact.input'
		)
	.defines(function() {
		Firework = ig.Game.extend({
			width: 0,
			height: 0,
			bits: 10000,
			bitPx: [],
			bitPy: [],
			bitVx: [],
			bitVy: [],
			bitSx: [],
			bitSy: [],
			bitL: [],
			bitF: [],
			bitW: [],
			bitC: [],
			bitMax: 150,
			mx: 50,
			my: 50,
			pixelsData: [],
			soundOn: true,
			bg: new ig.Image('media/yanhua.jpg'),
			explodeSound: new ig.Sound('media/explode.ogg'),
			shootSound: new ig.Sound('media/shoot.ogg'),

			init: function() {
				this.width = ig.system.width;
				this.height = 270;

				for (var j = 0; j < this.bits; j++) {
					this.bitF[j] = 0;
				}

				ig.music.add('media/xqx.ogg');
				ig.input.bind(ig.KEY.MOUSE1, 'shoot');
				ig.input.bind(ig.KEY.MOUSE2, 'shoot2');
			},

			update: function() {
				if (ig.input.pressed('shoot') | ig.input.pressed('shoot2')) {
					ig.music.play();

					if (ig.input.mouse.y > this.height) {
						return;
					}

					var r = parseInt((Math.random() * 256)),
						g = parseInt((Math.random() * 256)),
						b = parseInt((Math.random() * 256)),
						c = b << 16 | g << 8 | r;
					var count = 0;

					for (var i = 0; i < this.bits; i++) {
						if (this.bitF[i] !== 0) {
							continue;
						}

						this.bitPx[i] = ig.input.mouse.x;
						this.bitPy[i] = ig.input.mouse.y;

						var rad = Math.random() * Math.PI * 2;
						var dis = Math.random();

						this.bitVx[i] = Math.cos(rad) * dis;
						this.bitVy[i] = Math.sin(rad) * dis;
						this.bitL[i] = parseInt(Math.random() * 100) + 100;
						this.bitW[i] = parseInt(Math.random() * 3);
						this.bitC[i] = c;
						this.bitSx[i] = ig.input.mouse.x;
						this.bitSy[i] = this.height - 5;
						this.bitF[i] = 2;

						if (++count === this.bitMax) {
							break;
						}
					}

					if (this.soundOn) {
						this.shootSound.play();
					}
				}
			},

			draw: function() {
				this.bg.draw(0, 270);

				const ctx = ig.system.context;
				const pixels = this.width * this.height;
				var img = ctx.createImageData(this.width, this.height);

				for (var i = 0; i < pixels; i++) {
					var cd = this.pixelsData[i];
					var rd = this.pixelsData[i + 1];
					var ld = this.pixelsData[i + this.width];
					var lrd = this.pixelsData[i + this.width + 1];
					var cc = (cd & 0xff0000) >> 16
					var rcBx = ((((rd & 0xff0000) >> 16) - cc) * this.mx >> 8) + cc;
					cc = (cd & 0xff00) >> 8;
					var rcGx = ((((rd & 0xff00) >> 8) - cc) * this.mx >> 8) + cc;
					cc = cd & 0xff;
					var rcRx = (((rd & 0xff) - cc) * this.mx >> 8) + cc;
					cc = (ld & 0xff0000) >> 16;
					var lrcBx = ((((lrd & 0xff0000) >> 16) - cc) * this.mx >> 8) + cc;
					cc = (ld & 0xff00) >> 8;
					var lrcGx = ((((lrd & 0xff00) >> 8) - cc) * this.mx >> 8) + cc;
					cc = ld & 0xff;
					var lrcRx = (((lrd & 0xff) - cc) * this.mx >> 8) + cc;
					var lrcBy = ((lrcBx - rcBx) * this.my >> 8) + rcBx;
					var lrcGy = ((lrcGx - rcGx) * this.my >> 8) + rcGx;
					var lrcRy = ((lrcRx - rcRx) * this.my >> 8) + rcRx;
					this.pixelsData[i] = lrcBy << 16 | lrcGy << 8 | lrcRy
				}

				this.rend();

				for (var j = 0; j < pixels; j++) {
					img.data[j * 4] = this.pixelsData[j] & 0xff;
					img.data[j * 4 + 1] = this.pixelsData[j] >> 8 & 0xff;
					img.data[j * 4 + 2] = this.pixelsData[j] >> 16 & 0xff;
					img.data[j * 4 + 3] = 0xff;
				}

				ctx.putImageData(img, 0, 0);
			},

			rend: function() {
				var explode = false;

				for (var i = 0; i < this.bits; i++) {
					switch (this.bitF[i]) {
						case 1:
							this.bitVy[i] += Math.random() / 50;
							this.bitPx[i] += this.bitVx[i];
							this.bitPy[i] += this.bitVy[i];
							this.bitL[i]--;
							if (this.bitL[i] === 0 || this.bitPx[i] < 0 || this.bitPy[i] < 0 || this.bitPx[i] > this.width || this.bitPy[i] > this.height - 3) {
								this.bitC[i] = 0x000000;
								this.bitF[i] = 0;
							} else if (this.bitW[i] === 0) {
								if (Math.random() < 0.5) {
									this.bitSet(parseInt(this.bitPx[i]), parseInt(this.bitPy[i]), -1);
								}
							} else {
								this.bitSet(parseInt(this.bitPx[i]), parseInt(this.bitPy[i]), this.bitC[i]);
							}
							break;
						case 2:
							this.bitSy[i] -= 5;
							if (this.bitSy[i] <= this.bitPy[i]) {
								this.bitF[i] = 1;
								explode = true;
							}
							if (parseInt(Math.random() * 20) === 0) {
								var x = parseInt(Math.random() * 2),
									y = parseInt(Math.random() * 5);
								this.bitSet(this.bitSx[i] + x, this.bitSy[i] + y, -1);
							}
							break;
					}
				}

				if (explode && this.soundOn) {
					this.explodeSound.play();
				}
			},

			bitSet: function(index, rows, value) {
				this.pixelsData[index + rows * this.width] = value;
			}
		});

		ig.main('#canvas', Firework, 60, 800, 507, 1);
	});
