var rpio = require('rpio');

function spi_soft() {
}

module.exports = new spi_soft;

var info = {
    bits_per_word: 8,
    clock_phase: false,
    lsb_first: false
}

spi_soft.prototype.begin = function (options)
{
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
      info[key] = val;
    }
}

function write(val)
{
    if (info.hasOwnProperty('mosi')) {
        rpio.write(info.mosi, val ? rpio.HIGH : rpio.LOW);
    }
}

function read()
{
    if (info.hasOwnProperty('miso')) {
        return rpio.read(info.miso);
    }
    return 0;
}

function clock_on()
{
    if (info.hasOwnProperty('clock')) {
        rpio.write(info.clock, rpio.HIGH);
    }
}

function clock_off()
{
    if (info.hasOwnProperty('clock')) {
        rpio.write(info.clock, rpio.LOW);
    }
}

function chip_select()
{
    if (info.hasOwnProperty('select')) {
        rpio.write(info.select, rpio.LOW);
    }
}

function chip_deselect()
{
    if (info.hasOwnProperty('select')) {
        rpio.write(info.select, rpio.HIGH);
    }
}

spi_soft.prototype.transfer = function(txbuf, rxbuf, len)
{
    var init_mask = 1 << (info.bits_per_word - 1);
    var shift = (el, n) => {return el >> n};

    if (info.lsb_first) {
        shift = (el, n) => {return el << n};
        init_mask = 1
    }

    chip_select();

    for (var i = 0;i < len;i++) {
        var write_word = txbuf[i];
        var mask = init_mask;
        var read_word = 0;

        for (var j = 0;j < info.bits_per_word;j++) {
            write(write_word & mask);
            clock_on();

            if (!info.clock_phase && read()) {
                read_word |= mask;
            }

            clock_off();

            if (info.clock_phase && read()) {
                read_word |= mask;
            }
            mask = shift(mask, 1);
        }

        rxbuf[i] = read_word;
    }

    chip_deselect();
}