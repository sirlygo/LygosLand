/* Lygo's Land — profile store.
   Loaded on every page, before site.js. Exposes window.Lygo.

   Profiles are local to this browser. No accounts, no server, no passwords.

   NOTE ON FUTURE ACCOUNTS: every profile carries an `id`, a `rev` counter and
   an `updated` timestamp. That's deliberately the shape a sync engine needs —
   when you add a backend, you push profiles whose `rev` is ahead of the
   server's and pull the reverse. Nothing here has to be rewritten for that.
*/
window.Lygo = (function () {
  "use strict";

  const KEY = "lygosland.profiles.v2";
  const OLD_KEY = "lygosland.profiles.v1";
  const MAX_RECENT = 12;
  const MAX_PROFILES = 8;

  const AVATARS = [
    "\u259A", "\u25A0", "\u25CF", "\u25C6", "\u2605", "\u2620", "\u259B", "\u259E",
    "\u25B2", "\u2691", "\u263D", "\u2694", "\u2660", "\u2666", "\u26A1", "\u2726"
  ];
  const ACCENTS = [
    { id: "phosphor", label: "Phosphor", hex: "#00ff41", dim: "#0e8f38" },
    { id: "amber",    label: "Amber",    hex: "#ffb000", dim: "#9a6a00" },
    { id: "cyan",     label: "Cyan",     hex: "#00e5ff", dim: "#068191" },
    { id: "violet",   label: "Violet",   hex: "#b26bff", dim: "#653a94" },
    { id: "blood",    label: "Blood",    hex: "#ff4d4d", dim: "#992e2e" },
    { id: "bone",     label: "Bone",     hex: "#e8e0d0", dim: "#8a8375" },
    { id: "toxic",    label: "Toxic",    hex: "#b6ff00", dim: "#6a9400" }
  ];

  function blank() { return { activeId: null, profiles: [] }; }

  function read() {
    try {
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        // One-time migration from the first version.
        const old = localStorage.getItem(OLD_KEY);
        if (old) {
          const data = JSON.parse(old);
          (data.profiles || []).forEach(upgrade);
          localStorage.setItem(KEY, JSON.stringify(data));
          return data;
        }
        return blank();
      }
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.profiles)) return blank();
      data.profiles.forEach(upgrade);
      return data;
    } catch (e) {
      return blank();          // corrupt or storage blocked — start clean
    }
  }

  /* Fill in fields added after a profile was created. */
  function upgrade(p) {
    if (p.seconds === undefined)    p.seconds = 0;
    if (!Array.isArray(p.favourites)) p.favourites = [];
    if (!Array.isArray(p.recent))     p.recent = [];
    if (p.plays === undefined)      p.plays = 0;
    if (p.rev === undefined)        p.rev = 1;
    if (p.updated === undefined)    p.updated = p.created || Date.now();
    return p;
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;            // private mode; the session still works
    }
  }

  function touch(p) { p.rev = (p.rev || 1) + 1; p.updated = Date.now(); }

  function list()   { return read().profiles; }
  function active() {
    const d = read();
    return d.profiles.find(p => p.id === d.activeId) || null;
  }
  function activeId() { return read().activeId; }

  function create(name, avatar, accent) {
    const d = read();
    const clean = String(name || "").trim().slice(0, 24);
    if (!clean) return { ok: false, error: "Give the profile a name." };
    if (d.profiles.some(p => p.name.toLowerCase() === clean.toLowerCase())) {
      return { ok: false, error: "There's already a profile called " + clean + "." };
    }
    if (d.profiles.length >= MAX_PROFILES) {
      return { ok: false, error: MAX_PROFILES + " profiles is the limit. Delete one first." };
    }
    const p = upgrade({
      id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: clean,
      avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
      accent: ACCENTS.some(a => a.id === accent) ? accent : "phosphor",
      created: Date.now()
    });
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
    touch(p);
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
    if (id !== null && !d.profiles.some(p => p.id === id)) return { ok: false };
    d.activeId = id;
    write(d);
    return { ok: true };
  }

  /* ----------------------------------------------------------------------
     Play tracking
     ---------------------------------------------------------------------- */
  function recordPlay(gameName, core) {
    const d = read();
    const p = d.profiles.find(x => x.id === d.activeId);
    if (!p) return null;                     // playing without a profile is fine
    p.plays = (p.plays || 0) + 1;
    const hit = p.recent.find(r => r.name === gameName && r.core === core);
    if (hit) {
      hit.count++;
      hit.last = Date.now();
    } else {
      p.recent.unshift({ name: gameName, core: core, count: 1, last: Date.now(), seconds: 0 });
    }
    p.recent.sort((a, b) => b.last - a.last);
    p.recent = p.recent.slice(0, MAX_RECENT);
    touch(p);
    write(d);
    return p;
  }

  /* Called on a timer while a game runs, and once more when the tab closes. */
  function addPlaytime(gameName, core, seconds) {
    if (!seconds || seconds < 1) return;
    const d = read();
    const p = d.profiles.find(x => x.id === d.activeId);
    if (!p) return;
    p.seconds = (p.seconds || 0) + seconds;
    const hit = p.recent.find(r => r.name === gameName && r.core === core);
    if (hit) hit.seconds = (hit.seconds || 0) + seconds;
    touch(p);
    write(d);
  }

  function toggleFavourite(gameName, core) {
    const d = read();
    const p = d.profiles.find(x => x.id === d.activeId);
    if (!p) return { ok: false, error: "Pick a profile first." };
    const key = core + "::" + gameName;
    const i = p.favourites.indexOf(key);
    if (i === -1) p.favourites.push(key); else p.favourites.splice(i, 1);
    touch(p);
    write(d);
    return { ok: true, on: i === -1 };
  }
  function isFavourite(p, gameName, core) {
    return !!p && p.favourites.indexOf(core + "::" + gameName) !== -1;
  }

  /* ----------------------------------------------------------------------
     Scoping helpers — how other pages keep data separate per profile.
     ---------------------------------------------------------------------- */

  /* Prefix for anything owned by the active profile. Games saved with no
     profile selected live under "shared" so nothing is orphaned. */
  function scope() {
    const id = activeId();
    return id || "shared";
  }

  /* EmulatorJS derives its save-file key from EJS_gameName, so putting the
     profile in that name is what actually separates one player's saves from
     another's. Visible in the emulator's own title, which is a fair trade. */
  function saveNameFor(gameName) {
    const p = active();
    return p ? p.name + " \u00B7 " + gameName : gameName;
  }

  /* ----------------------------------------------------------------------
     Sync hooks. Used by auth.js; harmless if no account is ever created.
     ---------------------------------------------------------------------- */

  /* Everything worth syncing, as a plain object. */
  function dump() { return read(); }

  /* Merge a remote copy into the local one.
     Per profile, whichever side has the higher `rev` wins; ties break on
     `updated`. Profiles that exist on only one side are kept. This is
     last-write-wins at profile granularity — good enough when one person
     uses a few devices, and it never silently destroys a whole profile. */
  function mergeRemote(remote) {
    const local = read();
    if (!remote || !Array.isArray(remote.profiles)) return { changed: false, data: local };

    const byId = {};
    local.profiles.forEach(function (p) { byId[p.id] = p; });

    let changed = false;
    remote.profiles.forEach(function (r) {
      upgrade(r);
      const mine = byId[r.id];
      if (!mine) { byId[r.id] = r; changed = true; return; }
      const rNewer = (r.rev || 1) > (mine.rev || 1) ||
                     ((r.rev || 1) === (mine.rev || 1) && (r.updated || 0) > (mine.updated || 0));
      if (rNewer) { byId[r.id] = r; changed = true; }
    });

    const merged = {
      profiles: Object.keys(byId).map(function (k) { return byId[k]; }).slice(0, MAX_PROFILES),
      activeId: local.activeId || remote.activeId || null
    };
    if (!merged.profiles.some(function (p) { return p.id === merged.activeId; })) {
      merged.activeId = merged.profiles.length ? merged.profiles[0].id : null;
    }
    write(merged);
    return { changed: changed, data: merged };
  }

  function accentOf(id) {
    return ACCENTS.find(a => a.id === id) || ACCENTS[0];
  }

  function applyTheme(profile) {
    const p = profile || active();
    const a = accentOf(p && p.accent);
    const root = document.documentElement;
    root.style.setProperty("--phosphor", a.hex);
    root.style.setProperty("--phosphor-dim", a.dim);
    return a;
  }

  function humanTime(sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return sec + "s";
    const m = Math.round(sec / 60);
    if (m < 60) return m + "m";
    const h = Math.floor(m / 60);
    return h + "h " + (m % 60) + "m";
  }

  /* Shared header line: "Playing as X". Injected where #whoami exists. */
  function renderWhoami() {
    const el = document.getElementById("whoami");
    if (!el) return;
    const p = active();
    el.textContent = "";
    if (p) {
      const a = document.createElement("span");
      a.className = "whoami__avatar";
      a.textContent = p.avatar;
      const n = document.createElement("span");
      n.className = "whoami__name";
      n.textContent = p.name;
      const link = document.createElement("a");
      link.href = "profiles.html";
      link.textContent = "switch";
      el.append("Playing as ", a, n, " \u00B7 ", link);
    } else {
      const link = document.createElement("a");
      link.href = "profiles.html";
      link.textContent = "create one";
      el.append("No profile selected \u00B7 ", link);
    }
    el.hidden = false;
  }

  return {
    AVATARS: AVATARS,
    ACCENTS: ACCENTS,
    MAX_PROFILES: MAX_PROFILES,
    list: list,
    active: active,
    activeId: activeId,
    create: create,
    update: update,
    remove: remove,
    setActive: setActive,
    recordPlay: recordPlay,
    addPlaytime: addPlaytime,
    toggleFavourite: toggleFavourite,
    isFavourite: isFavourite,
    scope: scope,
    saveNameFor: saveNameFor,
    dump: dump,
    mergeRemote: mergeRemote,
    accentOf: accentOf,
    applyTheme: applyTheme,
    humanTime: humanTime,
    renderWhoami: renderWhoami
  };
})();

/* Theme + header run immediately so pages don't flash the default colour. */
window.Lygo.applyTheme();
document.addEventListener("DOMContentLoaded", function () {
  window.Lygo.renderWhoami();
});
