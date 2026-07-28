/* Lygo's Land — profile store.
   Loaded on every page, before site.js. Exposes window.Lygo.

   Profiles are local to this browser. No accounts, no server, no passwords —
   they exist so more than one person can use the same machine without
   scrambling each other's recently-played list.
*/
window.Lygo = (function () {
  "use strict";

  const KEY = "lygosland.profiles.v1";
  const MAX_RECENT = 8;

  const AVATARS = ["\u259A", "\u25A0", "\u25CF", "\u25C6", "\u2605", "\u2620", "\u259B", "\u259E"];
  const ACCENTS = [
    { id: "phosphor", label: "Phosphor", hex: "#00ff41", dim: "#0e8f38" },
    { id: "amber",    label: "Amber",    hex: "#ffb000", dim: "#9a6a00" },
    { id: "cyan",     label: "Cyan",     hex: "#00e5ff", dim: "#068191" },
    { id: "violet",   label: "Violet",   hex: "#b26bff", dim: "#653a94" },
    { id: "blood",    label: "Blood",    hex: "#ff4d4d", dim: "#992e2e" }
  ];

  function blank() { return { activeId: null, profiles: [] }; }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.profiles)) return blank();
      return data;
    } catch (e) {
      return blank();          // corrupt or storage blocked — start clean
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;            // private mode; the session still works
    }
  }

  function list()   { return read().profiles; }
  function active() {
    const d = read();
    return d.profiles.find(p => p.id === d.activeId) || null;
  }

  function create(name, avatar, accent) {
    const d = read();
    const clean = String(name || "").trim().slice(0, 24);
    if (!clean) return { ok: false, error: "Give the profile a name." };
    if (d.profiles.some(p => p.name.toLowerCase() === clean.toLowerCase())) {
      return { ok: false, error: "There's already a profile called " + clean + "." };
    }
    if (d.profiles.length >= 8) {
      return { ok: false, error: "Eight profiles is the limit. Delete one first." };
    }
    const p = {
      id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: clean,
      avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
      accent: ACCENTS.some(a => a.id === accent) ? accent : "phosphor",
      created: Date.now(),
      plays: 0,
      recent: []
    };
    d.profiles.push(p);
    d.activeId = p.id;
    write(d);
    return { ok: true, profile: p };
  }

  function update(id, fields) {
    const d = read();
    const p = d.profiles.find(x => x.id === id);
    if (!p) return { ok: false, error: "That profile is gone." };
    if (fields.name !== undefined) {
      const clean = String(fields.name).trim().slice(0, 24);
      if (!clean) return { ok: false, error: "A profile needs a name." };
      if (d.profiles.some(x => x.id !== id && x.name.toLowerCase() === clean.toLowerCase())) {
        return { ok: false, error: "That name is taken." };
      }
      p.name = clean;
    }
    if (fields.avatar && AVATARS.includes(fields.avatar)) p.avatar = fields.avatar;
    if (fields.accent && ACCENTS.some(a => a.id === fields.accent)) p.accent = fields.accent;
    write(d);
    return { ok: true, profile: p };
  }

  function remove(id) {
    const d = read();
    const before = d.profiles.length;
    d.profiles = d.profiles.filter(p => p.id !== id);
    if (d.activeId === id) d.activeId = d.profiles.length ? d.profiles[0].id : null;
    write(d);
    return { ok: d.profiles.length < before };
  }

  function setActive(id) {
    const d = read();
    if (!d.profiles.some(p => p.id === id)) return { ok: false };
    d.activeId = id;
    write(d);
    return { ok: true };
  }

  /* Called by the Play page each time a game boots. */
  function recordPlay(gameName, core) {
    const d = read();
    const p = d.profiles.find(x => x.id === d.activeId);
    if (!p) return null;                     // playing without a profile is fine
    p.plays = (p.plays || 0) + 1;
    p.recent = p.recent || [];
    const hit = p.recent.find(r => r.name === gameName && r.core === core);
    if (hit) {
      hit.count++;
      hit.last = Date.now();
    } else {
      p.recent.unshift({ name: gameName, core: core, count: 1, last: Date.now() });
    }
    p.recent.sort((a, b) => b.last - a.last);
    p.recent = p.recent.slice(0, MAX_RECENT);
    write(d);
    return p;
  }

  function accentOf(id) {
    return ACCENTS.find(a => a.id === id) || ACCENTS[0];
  }

  /* Paint the active profile's colour over the site's phosphor tokens. */
  function applyTheme(profile) {
    const p = profile || active();
    const a = accentOf(p && p.accent);
    const root = document.documentElement;
    root.style.setProperty("--phosphor", a.hex);
    root.style.setProperty("--phosphor-dim", a.dim);
    return a;
  }

  /* Small shared header line: "Playing as X". Injected where #whoami exists. */
  function renderWhoami() {
    const el = document.getElementById("whoami");
    if (!el) return;
    const p = active();
    if (p) {
      el.innerHTML = '<span class="whoami__avatar"></span>' +
                     '<span class="whoami__name"></span> ' +
                     '<a href="profiles.html">switch</a>';
      el.querySelector(".whoami__avatar").textContent = p.avatar;
      el.querySelector(".whoami__name").textContent = p.name;
    } else {
      el.innerHTML = 'No profile selected · <a href="profiles.html">create one</a>';
    }
    el.hidden = false;
  }

  return {
    AVATARS: AVATARS,
    ACCENTS: ACCENTS,
    list: list,
    active: active,
    create: create,
    update: update,
    remove: remove,
    setActive: setActive,
    recordPlay: recordPlay,
    accentOf: accentOf,
    applyTheme: applyTheme,
    renderWhoami: renderWhoami
  };
})();

/* Theme + header run immediately so pages don't flash the default colour. */
window.Lygo.applyTheme();
document.addEventListener("DOMContentLoaded", function () {
  window.Lygo.renderWhoami();
});
