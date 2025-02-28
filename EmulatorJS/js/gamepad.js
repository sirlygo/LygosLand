
class GamepadHandler {
    constructor() {
        this.gamepads = {};
        this.polling = false;
        this.keyMap = {
            0: 'z',  // Button A -> Z key
            1: 'x',  // Button B -> X key
            2: 'c',  // Button X -> C key
            3: 'v',  // Button Y -> V key
            4: 'a',  // Left Bumper -> A key
            5: 's',  // Right Bumper -> S key
            6: 'Backspace', // Select -> Backspace
            7: 'Enter', // Start -> Enter
            8: ' ',  // Spacebar -> Jump
            9: 'Shift',  // Right Trigger -> Shift key
            12: 'ArrowUp',  // D-Pad Up
            13: 'ArrowDown', // D-Pad Down
            14: 'ArrowLeft', // D-Pad Left
            15: 'ArrowRight' // D-Pad Right
        };
        this.startPolling();
    }

    startPolling() {
        if (!navigator.getGamepads) {
            console.warn("Gamepad API not supported by this browser.");
            return;
        }

        this.polling = true;
        this.loop();
    }

    loop() {
        if (!this.polling) return;

        this.updateGamepadState();
        requestAnimationFrame(() => this.loop());
    }

    updateGamepadState() {
        const gamepads = navigator.getGamepads();
        if (!gamepads) return;

        [...gamepads].forEach((gamepad) => {
            if (!gamepad) return;

            gamepad.buttons.forEach((button, index) => {
                if (button.pressed) {
                    this.sendKeyPress(index);
                }
            });
        });
    }

    sendKeyPress(index) {
        try {
            if (this.keyMap[index]) {
                let keyEvent = new KeyboardEvent("keydown", { key: this.keyMap[index] });
                document.dispatchEvent(keyEvent);
                console.log(`✅ Gamepad button ${index} pressed -> Sending key: ${this.keyMap[index]}`);
            } else {
                console.warn(`⚠️ Unmapped gamepad button pressed: ${index}`);
            }
        } catch (error) {
            console.error("❌ SecurityError: Gamepad input could not send key event.", error);
        }
    }
}

window.addEventListener("load", () => {
    console.log("🎮 Initializing GamepadHandler...");
    new GamepadHandler();
});
