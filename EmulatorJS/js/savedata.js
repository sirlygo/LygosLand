
function SRAMSavedata(size) {
    if (!size || size <= 0) {
        throw new Error("Invalid SRAM size provided.");
    }
    MemoryView.call(this, new ArrayBuffer(size), 0);
    this.writePending = false;
}

SRAMSavedata.prototype = Object.create(MemoryView.prototype);

SRAMSavedata.prototype.store8 = function(offset, value) {
    try {
        this.view.setInt8(offset, value);
        this.writePending = true;
    } catch (error) {
        console.error("SRAM store8 error:", error);
    }
};

SRAMSavedata.prototype.store16 = function(offset, value) {
    try {
        if (offset % 2 !== 0) {
            throw new Error("Unaligned memory access in store16!");
        }
        this.view.setInt16(offset, value, true);
        this.writePending = true;
    } catch (error) {
        console.error("SRAM store16 error:", error);
    }
};

SRAMSavedata.prototype.store32 = function(offset, value) {
    try {
        if (offset % 4 !== 0) {
            throw new Error("Unaligned memory access in store32!");
        }
        this.view.setInt32(offset, value, true);
        this.writePending = true;
    } catch (error) {
        console.error("SRAM store32 error:", error);
    }
};
