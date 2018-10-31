var rpio = require('rpio');

class SoftwareSPI {
  constructor (options) {
    this.bits_per_word = 8;
    this.clock_phase = false;
    this.lsb_first = false;

    for (const [key, val] of Object.entries(options)) {
      switch (key) {
        case 'miso':
          rpio.open(val, rpio.INPUT);
          break;
        case 'mosi':
          rpio.open(val, rpio.OUTPUT, rpio.HIGH);
          break;
        case 'clock':
          rpio.open(val, rpio.OUTPUT, rpio.HIGH);
          break;
        case 'select':
          rpio.open(val, rpio.OUTPUT, rpio.HIGH);
          break;
        default:
          break;
      }
      this[key] = val;
    }
  }

  write(val) {
    if (this.hasOwnProperty('mosi')) {
      rpio.write(this.mosi, val ? rpio.HIGH : rpio.LOW);
    }
  }

  read() {
    if (this.hasOwnProperty('miso')) {
      return rpio.read(this.miso);
    }
    return 0;
  }

  clock_on() {
    if (this.hasOwnProperty('clock')) {
      rpio.write(this.clock, rpio.HIGH);
    }
  }

  clock_off() {
    if (this.hasOwnProperty('clock')) {
      rpio.write(this.clock, rpio.LOW);
    }
  }

  chip_select() {
    if (this.hasOwnProperty('select')) {
      rpio.write(this.select, rpio.LOW);
    }
  }

  chip_deselect() {
    if (this.hasOwnProperty('select')) {
      rpio.write(this.select, rpio.HIGH);
    }
  }

  transfer(txbuf, rxbuf, len) {
    var init_mask = 1 << (this.bits_per_word - 1);
    var shift = (el, n) => {return el >> n};

    if (this.lsb_first) {
      shift = (el, n) => {return el << n};
      init_mask = 1
    }

    this.chip_select();

    for (var i = 0;i < len;i++) {
      var write_word = txbuf[i];
      var mask = init_mask;
      var read_word = 0;

      for (var j = 0;j < this.bits_per_word;j++) {
        this.write(write_word & mask);
        this.clock_on();

        if (!this.clock_phase && this.read()) {
          read_word |= mask;
        }

        this.clock_off();

        if (this.clock_phase && this.read()) {
          read_word |= mask;
        }
        mask = shift(mask, 1);
      }

      rxbuf[i] = read_word;
    }

    this.chip_deselect();
  }
};

var soft_spi = new SoftwareSPI({
  select: 32,
  clock: 33,
  miso: 38,
  mosi: 40});

var tx = new Buffer([0x3, 0x0, 0x0, 0x0]);
var rx = new Buffer(4);
var out;
var i, j = 0;

for (i = 0; i < 128; i++, ++j) {
	tx[1] = i;
	soft_spi.transfer(tx, rx, 4);
	out = ((rx[2] << 1) | (rx[3] >> 7));
	process.stdout.write(out.toString(16) + ((j % 16 == 0) ? '\n' : ' '));
}