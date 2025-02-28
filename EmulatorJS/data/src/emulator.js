
if (typeof Emulator === 'undefined') { var Emulator = {}; }
if (typeof Module === 'undefined') { var Module = {}; }

Module.onRuntimeInitialized = function() {
    console.log('Emulator initialized successfully.');
};
