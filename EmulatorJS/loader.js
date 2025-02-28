
if (typeof loadScripts === 'undefined') { var loadScripts = function() {}; }
if (typeof scriptList === 'undefined') { var scriptList = []; }

function loadEmulatorScripts() {
    for (var i = 0; i < scriptList.length; i++) {
        var script = document.createElement('script');
        script.src = scriptList[i];
        document.head.appendChild(script);
    }
}
