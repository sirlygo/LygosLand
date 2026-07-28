/* Lygo's Land — shared behaviour. Loaded on every page. */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     Bat cursor.
     The old version set `cursor: none` on everything up front, so a failed
     GIF or a touch device left you with no pointer at all. Now we only hide
     the system cursor after the image has actually loaded, and only for
     fine pointers.
     ---------------------------------------------------------------------- */
  const bat = document.getElementById("bat");

  /* Guarded: everything in this file shares one scope, so an exception here
     would also take out the sound toggle further down. */
  const mq = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)")
    : { matches: false };
  const finePointer = mq.matches;

  if (bat && finePointer) {
    const probe = new Image();
    probe.onload = function () {
      document.documentElement.classList.add("bat-on");

      let queued = false, x = 0, y = 0;
      document.addEventListener("mousemove", function (e) {
        x = e.clientX; y = e.clientY;
        bat.classList.add("is-visible");
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {          // don't thrash layout
          bat.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";
          queued = false;
        });
      });
      document.addEventListener("mouseleave", function () {
        bat.classList.remove("is-visible");
      });
    };
    probe.src = "bat-animated-arrow.gif";
  }

  /* ----------------------------------------------------------------------
     Ambient sound toggle. Icon shows the current state; label says what the
     click will do.
     ---------------------------------------------------------------------- */
  const toggle = document.getElementById("soundToggle");
  const audio  = document.getElementById("ambience");

  if (toggle && audio) {
    toggle.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().then(function () {
          toggle.textContent = "🔊";
          toggle.setAttribute("aria-pressed", "true");
          toggle.setAttribute("aria-label", "Turn ambient sound off");
        }).catch(function () {
          toggle.setAttribute("aria-label", "Sound unavailable");
          toggle.title = "Your browser blocked playback.";
        });
      } else {
        audio.pause();
        toggle.textContent = "🔇";
        toggle.setAttribute("aria-pressed", "false");
        toggle.setAttribute("aria-label", "Turn ambient sound on");
      }
    });
  }
})();
