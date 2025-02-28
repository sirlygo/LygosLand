class GamepadHandler {
    constructor() {
        this.buttonLabels = {
            0: 'BUTTON_1', // A -> Z
            1: 'BUTTON_2', // B -> X
            4: 'LEFT_TOP_SHOULDER',  // L -> A
            5: 'RIGHT_TOP_SHOULDER', // R -> S
            8: 'SELECT',  // Select -> Backspace
            9: 'START',   // Start -> Enter
            12: 'DPAD_UP',    // Up Arrow
            13: 'DPAD_DOWN',  // Down Arrow
            14: 'DPAD_LEFT',  // Left Arrow
            15: 'DPAD_RIGHT', // Right Arrow
        };

        this.keyMap = {
            "BUTTON_1": "z",
            "BUTTON_2": "x",
            "LEFT_TOP_SHOULDER": "a",
            "RIGHT_TOP_SHOULDER": "s",
            "START": "Enter",
            "SELECT": "Backspace",
            "DPAD_UP": "ArrowUp",
            "DPAD_DOWN": "ArrowDown",
            "DPAD_LEFT": "ArrowLeft",
            "DPAD_RIGHT": "ArrowRight"
        };

        this.loop();
    }

    getGamepads() {
        return navigator.getGamepads ? navigator.getGamepads() : [];
    }

    loop() {
        this.updateGamepadState();
        setTimeout(this.loop.bind(this), 10);
    }

    updateGamepadState() {
        const gamepads = Array.from(this.getGamepads());
        gamepads.forEach((gamepad) => {
            if (!gamepad) return;
            gamepad.buttons.forEach((button, index) => {
                if (button.pressed) {
                    this.sendKeyPress(this.getButtonLabel(index), "keydown");
                } else {
                    this.sendKeyPress(this.getButtonLabel(index), "keyup");
                }
            });
        });
    }

    sendKeyPress(buttonLabel, type) {
        if (!this.keyMap[buttonLabel]) return;
        const keyEvent = new KeyboardEvent(type, { key: this.keyMap[buttonLabel] });
        document.dispatchEvent(keyEvent);
    }

    getButtonLabel(index) {
        return this.buttonLabels[index] || `GAMEPAD_${index}`;
    }
}

window.GamepadHandler = GamepadHandler;
