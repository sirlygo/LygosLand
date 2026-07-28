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
    /* HOTSPOT — where the click actually happens inside the image.
       The arrow's tip is near the top-left of the GIF, so the image is drawn
       up and left of the pointer by this much. If clicks still feel off,
       nudge these two numbers; nothing else needs changing. */
    const HOT_X = 3;
    const HOT_Y = 2;

    /* A red dot marks the true click point so there's never any ambiguity. */
    const dot = document.createElement("div");
    dot.className = "bat-dot";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);

    const CLICKABLE = "a,button,input,select,textarea,label,summary,[role='button'],[tabindex]:not([tabindex='-1']),.card,.chip,.dropzone";
    const TEXTFIELD = "input:not([type='button']):not([type='submit']):not([type='file']):not([type='checkbox']):not([type='radio']),textarea,[contenteditable='true']";

    const probe = new Image();
    probe.onload = function () {
      document.documentElement.classList.add("bat-on");

      let queued = false, x = 0, y = 0, target = null;

      function paint() {
        queued = false;
        // Image is offset by the hotspot; the dot sits on the real point.
        bat.style.setProperty("--bat-x", (x - HOT_X) + "px");
        bat.style.setProperty("--bat-y", (y - HOT_Y) + "px");
        dot.style.setProperty("--dot-x", x + "px");
        dot.style.setProperty("--dot-y", y + "px");

        if (target) {
          // Over a text field, hand control back to the native I-beam.
          const isText = !!target.closest(TEXTFIELD);
          document.documentElement.classList.toggle("bat-text", isText);
          bat.classList.toggle("is-visible", !isText);
          dot.classList.toggle("is-visible", !isText);
          bat.classList.toggle("is-hot", !isText && !!target.closest(CLICKABLE));
        }
      }

      document.addEventListener("mousemove", function (e) {
        x = e.clientX; y = e.clientY;
        target = e.target;
        bat.classList.add("is-visible");
        dot.classList.add("is-visible");
        if (!queued) { queued = true; requestAnimationFrame(paint); }
      }, { passive: true });

      // Press feedback, so a click feels like it landed.
      document.addEventListener("mousedown", function () { bat.classList.add("is-down"); }, { passive: true });
      document.addEventListener("mouseup",   function () { bat.classList.remove("is-down"); }, { passive: true });

      document.addEventListener("mouseleave", function () {
        bat.classList.remove("is-visible");
        dot.classList.remove("is-visible");
      });
      window.addEventListener("blur", function () {
        bat.classList.remove("is-visible", "is-down");
        dot.classList.remove("is-visible");
      });

      // Keep it aligned while the page scrolls under a stationary pointer.
      window.addEventListener("scroll", function () {
        if (!queued) { queued = true; requestAnimationFrame(paint); }
      }, { passive: true });
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
