var spi_soft = require('./lib/spi_soft');

spi_soft.begin({
    select: 13,
    clock: 15,
    miso: 16,
    mosi: 18}
    );

var tx = new Buffer([0xc0, 0xa7, 0xff, 0xaa, 0x5a, 0xac, 0x43, 0x77, 0x88, 0x99]);
var rx1 = new Buffer(16);
var rx2 = new Buffer(16);
var i, j = 0;

/*
for (i = 0; i < 2; i++, ++j) {
	tx[1] = i;
    spi_soft.transfer(tx, rx, 2);

    console.log(rx);
}
*/
//spi_soft.transfer(tx, rx1, 8);
tx[0] = 0x40;
spi_soft.transfer(tx, rx2, 12);
console.log(rx1);
console.log(rx2);