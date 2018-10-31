var spi_soft = require('./lib/spi_soft');

spi_soft.begin({
    select: 32,
    clock: 33,
    miso: 38,
    mosi: 40}
    );

var tx = new Buffer([0x3, 0x0, 0x0, 0x0]);
var rx = new Buffer(4);
var out;
var i, j = 0;

for (i = 0; i < 128; i++, ++j) {
	tx[1] = i;
	spi_soft.transfer(tx, rx, 4);
	out = ((rx[2] << 1) | (rx[3] >> 7));
	process.stdout.write(out.toString(16) + ((j % 16 == 0) ? '\n' : ' '));
}