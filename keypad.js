function GameBoyAdvanceKeypad() {
    this.KEYCODE_LEFT = 37;  // Arrow Left
    this.KEYCODE_UP = 38;    // Arrow Up
    this.KEYCODE_RIGHT = 39; // Arrow Right
    this.KEYCODE_DOWN = 40;  // Arrow Down
    this.KEYCODE_START = 13; // Enter
    this.KEYCODE_SELECT = 220; // Backslash (Change this if needed)
    this.KEYCODE_A = 90; // Z
    this.KEYCODE_B = 88; // X
    this.KEYCODE_L = 65; // A
    this.KEYCODE_R = 83; // S

    // Gamepad Button Mappings (Standard Layout)
    this.GAMEPAD_A = 0; // A -> Z
    this.GAMEPAD_B = 1; // B -> X
    this.GAMEPAD_X = 2;
    this.GAMEPAD_Y = 3;
    this.GAMEPAD_L = 4; // L -> A
    this.GAMEPAD_R = 5; // R -> S
    this.GAMEPAD_SELECT = 8; // Select -> Backspace
    this.GAMEPAD_START = 9; // Start -> Enter
    this.GAMEPAD_LEFT = 14; // D-Pad Left
    this.GAMEPAD_UP = 12;   // D-Pad Up
    this.GAMEPAD_RIGHT = 15;// D-Pad Right
    this.GAMEPAD_DOWN = 13; // D-Pad Down
    this.GAMEPAD_THRESHOLD = 0.2;

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
    
    // Start polling for gamepad input
    this.startPolling();
}

// **Keyboard Handler (Works)**
GameBoyAdvanceKeypad.prototype.keyboardHandler = function(e) {
    let toggle = 0;
    switch (e.keyCode) {
        case this.KEYCODE_START: toggle = this.START; break;
        case this.KEYCODE_SELECT: toggle = this.SELECT; break;
        case this.KEYCODE_A: toggle = this.A; break;
        case this.KEYCODE_B: toggle = this.B; break;
        case this.KEYCODE_L: toggle = this.L; break;
        case this.KEYCODE_R: toggle = this.R; break;
        case this.KEYCODE_UP: toggle = this.UP; break;
        case this.KEYCODE_RIGHT: toggle = this.RIGHT; break;
        case this.KEYCODE_DOWN: toggle = this.DOWN; break;
        case this.KEYCODE_LEFT: toggle = this.LEFT; break;
        default: return;
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

// **Gamepad Handler (Fixed to Work Properly)**
GameBoyAdvanceKeypad.prototype.gamepadHandler = function(gamepad) {
    let value = 0;

    if (gamepad.buttons[this.GAMEPAD_LEFT]?.pressed) value |= 1 << this.LEFT;
    if (gamepad.buttons[this.GAMEPAD_UP]?.pressed) value |= 1 << this.UP;
    if (gamepad.buttons[this.GAMEPAD_RIGHT]?.pressed) value |= 1 << this.RIGHT;
    if (gamepad.buttons[this.GAMEPAD_DOWN]?.pressed) value |= 1 << this.DOWN;
    if (gamepad.buttons[this.GAMEPAD_START]?.pressed) value |= 1 << this.START;
    if (gamepad.buttons[this.GAMEPAD_SELECT]?.pressed) value |= 1 << this.SELECT;
    if (gamepad.buttons[this.GAMEPAD_A]?.pressed) value |= 1 << this.A;
    if (gamepad.buttons[this.GAMEPAD_B]?.pressed) value |= 1 << this.B;
    if (gamepad.buttons[this.GAMEPAD_L]?.pressed) value |= 1 << this.L;
    if (gamepad.buttons[this.GAMEPAD_R]?.pressed) value |= 1 << this.R;

    this.currentDown = ~value & 0x3FF;
};

// **Gamepad Polling (Runs Every 50ms)**
GameBoyAdvanceKeypad.prototype.startPolling = function() {
    if (!navigator.getGamepads) {
        console.warn("Gamepad API not supported by this browser.");
        return;
    }

    setInterval(() => {
        let gamepads = navigator.getGamepads();
        if (gamepads && gamepads[0]) {
            this.gamepadHandler(gamepads[0]);
        }
    }, 50);
};

// **Register Keyboard Listeners**
GameBoyAdvanceKeypad.prototype.registerHandlers = function() {
    window.addEventListener("keydown", this.keyboardHandler.bind(this), true);
    window.addEventListener("keyup", this.keyboardHandler.bind(this), true);
};

// Initialize the keypad
window.addEventListener("load", function() {
    let keypad = new GameBoyAdvanceKeypad();
    keypad.registerHandlers();
});
