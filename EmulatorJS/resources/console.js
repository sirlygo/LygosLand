
if (typeof usePrefix === 'undefined') { var usePrefix = false; }
if (typeof leading === 'undefined') { var leading = ''; }

function logMessage(message) {
    if (usePrefix) {
        console.log(leading + message);
    } else {
        console.log(message);
    }
}
