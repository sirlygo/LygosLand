
function GameBoyAdvanceKeypad() {
    this.KEYCODE_LEFT = 37;
    this.KEYCODE_UP = 38;
    this.KEYCODE_RIGHT = 39;
    this.KEYCODE_DOWN = 40;
    this.KEYCODE_START = 8;  // Swapped: Start is now Backspace
    this.KEYCODE_BACKSPACE = 13;  // Swapped: Backspace is now Enter
    this.KEYCODE_SELECT = 220;
    this.KEYCODE_A = 90; // Z for A button
    this.KEYCODE_B = 88; // X for B button
    this.KEYCODE_L = 65; // A for L button
    this.KEYCODE_R = 83; // S for R button
    this.KEYCODE_JUMP = 32; // Spacebar for Jump

    this.A = 0;
    this.B = 1;
    this.SELECT = 2;
    this.START = 3;
    this.RIGHT = 4;
    this.LEFT = 5;
    this.UP = 6;
    this.DOWN = 7;
    this.R = 8;
    this.L = 9;

    this.currentDown = 0x03FF;
    this.eatInput = false;
}

GameBoyAdvanceKeypad.prototype.keyboardHandler = function(e) {
    console.log("Key pressed:", e.keyCode);

    let toggle = 0;

    switch (e.keyCode) {
        case this.KEYCODE_START:
            console.log("Start button (Backspace) detected");
            toggle = this.START;
            break;
        case this.KEYCODE_BACKSPACE:
            console.log("Backspace (Enter) detected");
            toggle = this.SELECT;
            break;
        case this.KEYCODE_JUMP:
            console.log("Jump button (Spacebar) detected");
            toggle = this.A;
            break;
        case this.KEYCODE_SELECT:
            console.log("Select button detected");
            toggle = this.SELECT;
            break;
        case this.KEYCODE_A:
            console.log("A button detected");
            toggle = this.A;
            break;
        case this.KEYCODE_B:
            console.log("B button detected");
            toggle = this.B;
            break;
        case this.KEYCODE_L:
            console.log("L button detected");
            toggle = this.L;
            break;
        case this.KEYCODE_R:
            console.log("R button detected");
            toggle = this.R;
            break;
        case this.KEYCODE_UP:
            console.log("Up detected");
            toggle = this.UP;
            break;
        case this.KEYCODE_RIGHT:
            console.log("Right detected");
            toggle = this.RIGHT;
            break;
        case this.KEYCODE_DOWN:
            console.log("Down detected");
            toggle = this.DOWN;
            break;
        case this.KEYCODE_LEFT:
            console.log("Left detected");
            toggle = this.LEFT;
            break;
        default:
            console.log("Unmapped key detected:", e.keyCode);
            return;
    }

    toggle = 1 << toggle;

    if (e.type == "keydown") {
        this.currentDown &= ~toggle;
    } else {
        this.currentDown |= toggle;
    }

    if (this.eatInput) {
        e.preventDefault();
    }
};

GameBoyAdvanceKeypad.prototype.registerHandlers = function() {
    window.addEventListener("keydown", this.keyboardHandler.bind(this), true);
    window.addEventListener("keyup", this.keyboardHandler.bind(this), true);
};

window.addEventListener("load", function() {
    let keypad = new GameBoyAdvanceKeypad();
    keypad.registerHandlers();
});
