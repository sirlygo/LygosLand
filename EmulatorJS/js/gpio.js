
function GameBoyAdvanceGPIO(core, rom) {
    if (!core || !rom) {
        throw new Error("GameBoyAdvanceGPIO requires valid core and rom instances.");
    }
    this.core = core;
    this.rom = rom;
    this.readWrite = 0;
    this.direction = 0;
    this.device = new GameBoyAdvanceRTC(this);
}

GameBoyAdvanceGPIO.prototype.store16 = function(offset, value) {
    try {
        switch (offset) {
            case 0xC4:
                this.device.setPins(value & 0xF);
                break;
            case 0xC6:
                this.direction = value & 0xF;
                this.device.setDirection(this.direction);
                break;
            case 0xC8:
                this.readWrite = value & 1;
                break;
            default:
                throw new Error('Invalid offset passed to GPIO: ' + offset.toString(16));
        }
    } catch (error) {
        console.error("GPIO Error:", error);
    }
};

GameBoyAdvanceGPIO.prototype.outputPins = function(nybble) {
    try {
        if (this.readWrite) {
            let old = this.rom.view.getUint16(0xC4, true);
            old &= this.direction;
            this.rom.view.setUint16(0xC4, old | (nybble & ~this.direction & 0xF), true);
        }
    } catch (error) {
        console.error("GPIO outputPins error:", error);
    }
};
