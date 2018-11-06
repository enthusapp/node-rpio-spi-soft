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

    chip_deselect();
    clock_off();
}

function set_gpio(pin, val)
{
    if (info.hasOwnProperty(pin)) {
        rpio.write(info[pin], val ? rpio.HIGH : rpio.LOW);
    }
}

function write(val)
{
    set_gpio('mosi', val);
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
    set_gpio('clock', 1);
}

function clock_off()
{
    set_gpio('clock', 0);
}

function chip_select()
{
    set_gpio('select', 0);
}

function chip_deselect()
{
    set_gpio('select', 1);
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