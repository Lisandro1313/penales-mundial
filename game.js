(() => {
  "use strict";

  // ── Datos ─────────────────────────────────────────────────────────────────
  const TEAMS = [
    { name: "Argentina", code: "ARG", c1: "#6c9bd6", c2: "#ffffff" },
    { name: "Brasil", code: "BRA", c1: "#ffd400", c2: "#1f9d55" },
    { name: "Francia", code: "FRA", c1: "#1e3a8a", c2: "#ffffff" },
    { name: "España", code: "ESP", c1: "#c60b1e", c2: "#ffc400" },
    { name: "Inglaterra", code: "ING", c1: "#f5f7fb", c2: "#c8102e" },
    { name: "Alemania", code: "ALE", c1: "#e8ebf0", c2: "#111111" },
    { name: "Portugal", code: "POR", c1: "#c8102e", c2: "#1f7a3d" },
    { name: "P. Bajos", code: "NED", c1: "#ff6200", c2: "#ffffff" },
    { name: "Italia", code: "ITA", c1: "#1a5fb4", c2: "#ffffff" },
    { name: "México", code: "MEX", c1: "#1f7a3d", c2: "#c60b1e" },
    { name: "Uruguay", code: "URU", c1: "#6c9bd6", c2: "#0b1d4d" },
    { name: "Bélgica", code: "BEL", c1: "#c8102e", c2: "#ffd400" },
    { name: "Croacia", code: "CRO", c1: "#e23636", c2: "#ffffff" },
    { name: "Colombia", code: "COL", c1: "#fcd116", c2: "#1e3a8a" },
    { name: "Japón", code: "JPN", c1: "#1a3aa0", c2: "#ffffff" },
    { name: "EE.UU.", code: "USA", c1: "#e8ebf0", c2: "#1e3a8a" },
    { name: "Marruecos", code: "MAR", c1: "#b81d24", c2: "#1f7a3d" },
    { name: "Senegal", code: "SEN", c1: "#1f9d55", c2: "#ffd400" },
    { name: "Corea", code: "KOR", c1: "#e8ebf0", c2: "#c8102e" },
    { name: "Suiza", code: "SUI", c1: "#d52b1e", c2: "#ffffff" },
    { name: "Dinamarca", code: "DIN", c1: "#c8102e", c2: "#ffffff" },
    { name: "Polonia", code: "POL", c1: "#eef1f6", c2: "#dc143c" },
    { name: "Serbia", code: "SRB", c1: "#c8102e", c2: "#1a3aa0" },
    { name: "Ecuador", code: "ECU", c1: "#ffd400", c2: "#1a3aa0" },
    { name: "Ghana", code: "GHA", c1: "#2a2a2a", c2: "#ce1126" },
    { name: "Australia", code: "AUS", c1: "#ffd400", c2: "#1f7a3d" },
    { name: "Canadá", code: "CAN", c1: "#c8102e", c2: "#ffffff" },
    { name: "Nigeria", code: "NGA", c1: "#1f9d55", c2: "#ffffff" },
    { name: "Arabia", code: "KSA", c1: "#1f7a3d", c2: "#ffffff" },
    { name: "Perú", code: "PER", c1: "#d91023", c2: "#ffffff" },
  ];
  const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  let GROUPS = []; // se arma al empezar

  function buildGroups() {
    const idx = TEAMS.map((_, i) => i);
    for (let s = idx.length - 1; s > 0; s--) { const j = (Math.random() * (s + 1)) | 0;[idx[s], idx[j]] = [idx[j], idx[s]]; }
    GROUPS = [];
    for (let g = 0; g < 8; g++) GROUPS.push(idx.slice(g * 4, g * 4 + 4).map((k) => TEAMS[k]));
  }

  // Pateadores reales (nombre, número) por selección
  const ROSTERS = {
    ARG: [["Messi", 10], ["J. Álvarez", 9], ["Lautaro", 22], ["Di María", 11], ["Paredes", 5]],
    BRA: [["Neymar", 10], ["Vinícius", 7], ["Rodrygo", 11], ["Raphinha", 19], ["Casemiro", 5]],
    FRA: [["Mbappé", 10], ["Griezmann", 7], ["Dembélé", 11], ["Giroud", 9], ["Tchouaméni", 8]],
    ESP: [["Morata", 7], ["Yamal", 19], ["Pedri", 8], ["D. Olmo", 10], ["F. Torres", 11]],
    ING: [["Kane", 9], ["Bellingham", 10], ["Saka", 17], ["Foden", 11], ["Palmer", 24]],
    ALE: [["Havertz", 7], ["Kimmich", 6], ["Musiala", 10], ["Wirtz", 17], ["Gündogan", 21]],
    POR: [["Ronaldo", 7], ["B. Fernandes", 8], ["Leão", 10], ["J. Félix", 11], ["B. Silva", 20]],
    NED: [["Depay", 10], ["Gakpo", 11], ["X. Simons", 7], ["De Jong", 21], ["Malen", 18]],
    ITA: [["Chiesa", 14], ["Retegui", 9], ["Barella", 18], ["Raspadori", 10], ["Frattesi", 16]],
    MEX: [["Lozano", 22], ["S. Giménez", 9], ["E. Álvarez", 4], ["Pizarro", 10], ["Antuna", 16]],
    URU: [["Núñez", 11], ["Valverde", 15], ["De Arrascaeta", 10], ["Pellistri", 7], ["Araújo", 4]],
    BEL: [["De Bruyne", 7], ["Lukaku", 9], ["Doku", 11], ["Trossard", 17], ["Tielemans", 8]],
    CRO: [["Modrić", 10], ["Kramarić", 9], ["Perišić", 4], ["Budimir", 17], ["Sučić", 8]],
    COL: [["J. Rodríguez", 10], ["L. Díaz", 7], ["Borré", 19], ["Córdoba", 11], ["Lerma", 16]],
    JPN: [["Mitoma", 11], ["Kubo", 20], ["Kamada", 8], ["Asano", 18], ["Endo", 6]],
    USA: [["Pulisic", 10], ["Balogun", 9], ["Weah", 21], ["McKennie", 8], ["Aaronson", 11]],
    MAR: [["Ziyech", 7], ["En-Nesyri", 19], ["Hakimi", 2], ["Amrabat", 4], ["Ounahi", 8]],
    SEN: [["S. Mané", 10], ["I. Sarr", 18], ["Dia", 9], ["I. Gueye", 5], ["N. Jackson", 11]],
    KOR: [["Son", 7], ["Hwang H-C", 11], ["Lee K-I", 18], ["Cho G-S", 9], ["Hwang I-J", 20]],
    SUI: [["Shaqiri", 23], ["Embolo", 7], ["Vargas", 17], ["Freuler", 8], ["Rieder", 10]],
    DIN: [["Eriksen", 10], ["Højlund", 9], ["Damsgaard", 14], ["Hjulmand", 23], ["Wind", 19]],
    POL: [["Lewandowski", 9], ["Zieliński", 20], ["Świderski", 11], ["Szymański", 16], ["Zalewski", 21]],
    SRB: [["Mitrović", 9], ["Vlahović", 18], ["Tadić", 10], ["Milinković", 20], ["Kostić", 11]],
    ECU: [["E. Valencia", 13], ["Plata", 19], ["K. Caicedo", 23], ["K. Páez", 8], ["Rodríguez", 16]],
    GHA: [["A. Ayew", 10], ["Kudus", 20], ["J. Ayew", 9], ["I. Williams", 19], ["Semenyo", 11]],
    AUS: [["Duke", 15], ["Goodwin", 11], ["Irvine", 22], ["McGree", 17], ["Boyle", 7]],
    CAN: [["J. David", 20], ["Larin", 17], ["Buchanan", 11], ["Davies", 19], ["Eustáquio", 7]],
    NGA: [["Osimhen", 9], ["Lookman", 8], ["Iwobi", 10], ["Chukwueze", 11], ["M. Simon", 17]],
    KSA: [["Al-Dawsari", 10], ["Al-Shehri", 11], ["Al-Buraikan", 9], ["Kanno", 14], ["Al-Faraj", 7]],
    PER: [["Lapadula", 9], ["Cueva", 10], ["Carrillo", 18], ["Flores", 20], ["Peña", 11]],
  };
  function rosterOf(team) { return ROSTERS[team.code] || [[team.name, 9], [team.name, 10], [team.name, 7], [team.name, 11], [team.name, 8]]; }

  // Escudo con los colores del equipo (funciona en cualquier dispositivo)
  function contrast(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#0b1020" : "#ffffff";
  }
  function badge(team, cls) {
    return `<span class="badge2 ${cls}" style="background:${team.c1};color:${contrast(team.c1)};border-color:${team.c2}">${team.code}</span>`;
  }

  const ROUNDS = [
    { name: "OCTAVOS DE FINAL", short: "OCTAVOS", strength: 0.30 },
    { name: "CUARTOS DE FINAL", short: "CUARTOS", strength: 0.45 },
    { name: "SEMIFINAL", short: "SEMIFINAL", strength: 0.60 },
    { name: "LA GRAN FINAL", short: "FINAL", strength: 0.78 },
  ];
  const STAGE_NAMES = ["Octavos", "Cuartos", "Semifinal", "Final", "Campeón 🏆"];

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);

  function layout() {
    const goalW = Math.min(W * 0.66, 520);
    const goalH = goalW * 0.44;
    const goalLeft = (W - goalW) / 2;
    const goalTop = H * 0.20;
    return {
      goalW, goalH, goalLeft, goalRight: goalLeft + goalW,
      goalTop, goalBottom: goalTop + goalH,
      spot: { x: W / 2, y: H * 0.85 },
      keeperBase: { x: W / 2, y: goalTop + goalH * 0.92 },
    };
  }

  // ── Estado ────────────────────────────────────────────────────────────────
  const PHASE = { SHOOT_AIM: 0, SHOOT_FLY: 1, DEFEND_AIM: 2, DEFEND_FLY: 3, BETWEEN: 4, IDLE: 5 };
  let phase = PHASE.IDLE;
  let inMatch = false;

  let yourTeam = null;
  let bracket = [];      // 4 equipos rivales (eliminatorias)
  let roundIdx = 0;
  let match = null;
  // Fase de grupos
  let stage = "group";   // "group" | "knockout"
  let groupName = "A";
  let groupTeams = [];   // 4 equipos del grupo (incluye el tuyo)
  let groupSchedule = []; // [{rival, other:[t,t]}] x3 fechas
  let groupTable = [];   // [{team, pts, gf, ga}]
  let matchday = 0;

  let trophies = parseInt(localStorage.getItem("penales_trophies") || "0", 10) || 0;
  let bestStage = parseInt(localStorage.getItem("penales_beststage") || "0", 10) || 0;
  let muted = localStorage.getItem("penales_muted") === "1";

  const ball = { x: 0, y: 0, scale: 1, t: 0, sx: 0, sy: 0, tx: 0, ty: 0, lift: 0, spin: 0 };
  const trail = [];
  const keeper = { x: 0, y: 0, cx: 0, cy: 0, base: 0, color: "#ffd34d" };
  let shooterColor = "#fff";
  let shooterNum = 10;
  let aim = { x: 0, y: 0, active: false, dragging: false };
  let betweenTimer = 0;
  let pendingProceed = null;

  const confetti = [];
  const popups = [];
  let flash = { a: 0, color: "#fff" };
  let shake = 0;
  const FLIGHT = 0.5;

  // ── Audio ─────────────────────────────────────────────────────────────────
  let actx = null;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }
  function beep(f, d, type, vol) {
    if (muted) return; const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.value = f; g.gain.value = vol || 0.15;
    o.connect(g); g.connect(a.destination);
    const n = a.currentTime; g.gain.setValueAtTime(g.gain.value, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + d); o.start(n); o.stop(n + d);
  }
  function noiseBurst(dur, vol, lp, attack) {
    if (muted) return; const a = audio(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp || 1200;
    const g = a.createGain();
    src.connect(f); f.connect(g); g.connect(a.destination);
    const now = a.currentTime;
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol, now + (attack || 0.04));
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.start(now); src.stop(now + dur);
  }
  // Tribuna de fondo (loop) que acompaña el partido
  function startCrowd() {
    const c = $("snd-crowd"); if (!c) return;
    c.volume = 0.14; c.muted = muted;
    if (!muted) { const p = c.play(); if (p && p.catch) p.catch(() => {}); }
  }
  function stopCrowd() { const c = $("snd-crowd"); if (c) c.pause(); }
  function applyMute() {
    const c = $("snd-crowd"); if (c) c.muted = muted;
    const g = $("snd-goal"); if (g) g.muted = muted;
    if (muted) stopCrowd(); else startCrowd();
  }
  function sndKick() { beep(160, 0.07, "square", 0.14); noiseBurst(0.05, 0.08, 2200, 0.005); }
  function sndWhistle() { // pitido del árbitro
    if (muted) return; const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = "square"; o.frequency.value = 2150;
    lfo.frequency.value = 16; lg.gain.value = 130; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g); g.connect(a.destination);
    const n = a.currentTime;
    g.gain.setValueAtTime(0.0001, n); g.gain.linearRampToValueAtTime(0.10, n + 0.02);
    g.gain.setValueAtTime(0.10, n + 0.16); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.28);
    o.start(n); lfo.start(n); o.stop(n + 0.3); lfo.stop(n + 0.3);
  }
  function sndGoal() { // gol real
    if (muted) return;
    const g = $("snd-goal"); if (g) { g.currentTime = 0; g.volume = 0.5; const p = g.play(); if (p && p.catch) p.catch(() => {}); }
  }
  function sndSave() { // golpe seco
    beep(110, 0.16, "sine", 0.22); noiseBurst(0.12, 0.13, 500, 0.005);
  }

  // ── Anuncios (GameMonetize) ──────────────────────────────────────────────
  window.__gmPause = function () { stopCrowd(); };
  window.__gmResume = function () { if (!muted) startCrowd(); };
  let adCounter = 0;
  function showAd() {
    try { if (window.sdk && typeof window.sdk.showBanner === "function") window.sdk.showBanner(); } catch (e) {}
  }
  function maybeShowAd() { adCounter++; if (adCounter % 2 === 0) showAd(); } // 1 aviso cada 2 transiciones

  // ── Overlays ─────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const show = (id) => $(id).classList.remove("hidden");
  const hide = (id) => $(id).classList.add("hidden");
  function showOnly(id) {
    ["start-screen", "team-screen", "match-screen", "group-screen", "result-screen", "champion-screen"].forEach(hide);
    if (id) show(id);
  }

  // ── Construir grilla de equipos (por grupos) ──────────────────────────────
  function buildTeamGrid() {
    const grid = $("team-grid");
    grid.innerHTML = "";
    GROUPS.forEach((teams, gi) => {
      const block = document.createElement("div");
      block.className = "group-block";
      block.innerHTML = `<div class="group-title">GRUPO ${GROUP_NAMES[gi]}</div>`;
      const row = document.createElement("div");
      row.className = "group-row";
      teams.forEach((t) => {
        const b = document.createElement("button");
        b.className = "team-btn";
        b.innerHTML = badge(t, "md") + `<span class="tb-name">${t.name}</span>`;
        b.addEventListener("click", () => { audio(); startCrowd(); pickTeam(t, gi); });
        row.appendChild(b);
      });
      block.appendChild(row);
      grid.appendChild(block);
    });
  }

  function pickTeam(team, gi) {
    yourTeam = team;
    groupName = GROUP_NAMES[gi];
    groupTeams = GROUPS[gi];
    const rivals = groupTeams.filter((t) => t !== team);
    // Fixture round-robin (vos jugás contra cada rival; el otro partido se simula)
    groupSchedule = [
      { rival: rivals[0], other: [rivals[1], rivals[2]] },
      { rival: rivals[1], other: [rivals[2], rivals[0]] },
      { rival: rivals[2], other: [rivals[0], rivals[1]] },
    ];
    groupTable = groupTeams.map((t) => ({ team: t, pts: 0, gf: 0, ga: 0 }));
    matchday = 0;
    stage = "group";
    showMatchIntro();
  }

  function rowOf(team) { return groupTable.find((r) => r.team === team); }
  function currentOpp() { return stage === "group" ? groupSchedule[matchday].rival : bracket[roundIdx]; }
  function currentTitle() { return stage === "group" ? `GRUPO ${groupName} · FECHA ${matchday + 1}` : ROUNDS[roundIdx].name; }
  function currentShort() { return stage === "group" ? `GRUPO ${groupName}` : ROUNDS[roundIdx].short; }
  function currentStrength() { return stage === "group" ? 0.34 + matchday * 0.04 : ROUNDS[roundIdx].strength; }

  function showMatchIntro() {
    const opp = currentOpp();
    $("mi-round").textContent = currentTitle();
    $("mi-you-flag").innerHTML = badge(yourTeam, "lg"); $("mi-you-name").textContent = yourTeam.name;
    $("mi-opp-flag").innerHTML = badge(opp, "lg"); $("mi-opp-name").textContent = opp.name;
    showOnly("match-screen");
    hide("match-hud"); hide("phase-prompt");
  }

  // ── Iniciar partido (tanda) ──────────────────────────────────────────────
  function startMatch() {
    match = {
      round: { strength: currentStrength(), short: currentShort() }, opp: currentOpp(), you: yourTeam,
      youGoals: 0, oppGoals: 0, youKicks: 0, oppKicks: 0,
      results: { you: [], opp: [] }, sudden: false, turn: "you", oppTarget: null,
    };
    inMatch = true;
    showOnly(null);
    show("match-hud");
    updateMatchHUD();
    resetBall();
    nextKick();
  }

  function resetBall() {
    const L = layout();
    ball.x = L.spot.x; ball.y = L.spot.y; ball.scale = 1; ball.t = 0; ball.lift = 0; ball.spin = 0;
    trail.length = 0;
    keeper.x = L.keeperBase.x; keeper.y = L.keeperBase.y; keeper.base = L.keeperBase.x;
  }

  function nextKick() {
    resetBall();
    aim.active = false;
    const kickerTeam = match.turn === "you" ? match.you : match.opp;
    const roster = rosterOf(kickerTeam);
    const idx = (match.turn === "you" ? match.youKicks : match.oppKicks) % roster.length;
    const taker = roster[idx];
    shooterNum = taker[1];
    updateKickerPanel(kickerTeam, taker, match.turn === "you");
    sndWhistle();
    if (match.turn === "you") {
      keeper.color = match.opp.c1;        // ataja el rival
      shooterColor = match.you.c1;        // pateás vos
      phase = PHASE.SHOOT_AIM;
      promptText("TU PENAL ⚽", "Arrastrá la mira a un ángulo y soltá");
    } else {
      keeper.color = match.you.c1;        // atajás vos
      shooterColor = match.opp.c1;        // patea el rival
      match.oppTarget = chooseOppShot(layout(), match.round.strength);
      phase = PHASE.DEFEND_AIM;
      promptText("¡ATAJÁ! 🧤", "Elegí a qué lado te tirás y soltá");
    }
  }
  function updateKickerPanel(team, taker, you) {
    const p = $("kicker-panel");
    p.innerHTML = `<div class="kp-label">${you ? "PATEÁS VOS" : "PATEA EL RIVAL"}</div>` +
      `<div class="kp-row">${badge(team, "sm")}<span class="kp-num">${taker[1]}</span><span class="kp-name">${taker[0]}</span></div>`;
    p.classList.remove("hidden");
  }

  function promptText(main, sub) {
    const p = $("phase-prompt");
    p.innerHTML = `<span class="pp-main">${main}</span>` + (sub ? `<span class="pp-sub">${sub}</span>` : "");
    p.classList.remove("hidden");
  }
  function hidePrompt() { $("phase-prompt").classList.add("hidden"); }

  // ── IA ────────────────────────────────────────────────────────────────────
  function clampGoal(px, py, L) {
    const mx = L.goalW * 0.04;
    return {
      x: Math.max(L.goalLeft + mx, Math.min(L.goalRight - mx, px)),
      y: Math.max(L.goalTop + L.goalH * 0.10, Math.min(L.goalBottom - L.goalH * 0.05, py)),
    };
  }
  function chooseOppShot(L, strength) {
    if (Math.random() < strength) { // a un ángulo
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side < 0 ? L.goalLeft + L.goalW * 0.10 : L.goalRight - L.goalW * 0.10;
      const y = L.goalTop + L.goalH * (0.16 + Math.random() * 0.45);
      return clampGoal(x, y, L);
    }
    return clampGoal(W / 2 + (Math.random() - 0.5) * L.goalW * 0.45, L.goalTop + L.goalH * (0.45 + Math.random() * 0.4), L);
  }
  function chooseOppKeeper(L, target, strength) {
    const pSmart = 0.20 + strength * 0.62;
    if (Math.random() < pSmart) {
      keeper.cx = target.x + (Math.random() - 0.5) * L.goalW * 0.16;
      keeper.cy = target.y + (Math.random() - 0.5) * L.goalH * 0.30;
    } else {
      keeper.cx = L.goalLeft + Math.random() * L.goalW;
      keeper.cy = L.goalTop + L.goalH * (0.5 + Math.random() * 0.45);
    }
  }

  // ── Disparos del jugador ──────────────────────────────────────────────────
  function playerShoot(px, py) {
    const L = layout();
    // NO se clampea al arco: si apuntás afuera, la pelota va afuera (es un fallo)
    const tx = Math.max(20, Math.min(W - 20, px));
    const ty = Math.max(L.goalTop - L.goalH * 0.45, Math.min(L.spot.y - 20, py));
    ball.sx = L.spot.x; ball.sy = L.spot.y; ball.tx = tx; ball.ty = ty; ball.t = 0;
    chooseOppKeeper(L, { x: tx, y: ty }, match.round.strength);
    keeper.base = L.keeperBase.x;
    phase = PHASE.SHOOT_FLY; hidePrompt(); aim.active = false; sndKick();
  }
  function playerDefend(px, py) {
    const L = layout();
    const dive = clampGoal(px, py, L);
    keeper.cx = dive.x; keeper.cy = dive.y; keeper.base = L.keeperBase.x;
    ball.sx = L.spot.x; ball.sy = L.spot.y; ball.tx = match.oppTarget.x; ball.ty = match.oppTarget.y; ball.t = 0;
    phase = PHASE.DEFEND_FLY; hidePrompt(); aim.active = false; sndKick();
  }

  // ── Impacto ────────────────────────────────────────────────────────────────
  function resolveImpact() {
    const L = layout();
    const reach = L.goalH * 0.40; // arquero más grande = más difícil
    const inGoal = ball.tx > L.goalLeft && ball.tx < L.goalRight &&
                   ball.ty > L.goalTop && ball.ty < L.goalBottom + L.goalH * 0.05;
    const saved = inGoal && Math.hypot(ball.tx - keeper.cx, ball.ty - keeper.cy) < reach;
    const shooting = phase === PHASE.SHOOT_FLY;

    // Si la atajó, la pelota queda en las manos del arquero (clarísimo)
    if (saved) { ball.x = keeper.x; ball.y = keeper.y - L.goalH * 0.06; ball.lift = 0; }

    if (shooting) {
      match.youKicks++;
      if (!inGoal) { match.results.you.push("miss"); saveFx("¡AFUERA!"); betweenTimer = 1.4; }
      else if (saved) { match.results.you.push("miss"); saveFx("¡TE LA ATAJÓ! 🧤"); betweenTimer = 1.6; }
      else { match.youGoals++; match.results.you.push("goal"); goalFx("¡GOOOL!", ball.tx, ball.ty); betweenTimer = 1.3; }
    } else {
      match.oppKicks++;
      if (saved) { match.results.opp.push("miss"); goalFx("¡ATAJASTE! 🧤🔥", W / 2, L.goalBottom); betweenTimer = 1.6; }
      else { match.oppGoals++; match.results.opp.push("goal"); saveFx("GOL DEL RIVAL"); betweenTimer = 1.4; }
    }
    updateMatchHUD();
    phase = PHASE.BETWEEN;
  }

  function goalFx(text, x, y) {
    flash = { a: 0.55, color: "#22c55e" };
    popups.push({ text, t: 1.3, color: "#eafff0", x, y });
    spawnConfetti(x, y); sndGoal();
  }
  function saveFx(text) {
    flash = { a: 0.6, color: "#ef4444" }; shake = 14;
    popups.push({ text, t: 1.3, color: "#fff", x: W / 2, y: H * 0.40 });
    sndSave();
  }

  // ── Avance de la tanda ────────────────────────────────────────────────────
  function decideWinner() {
    const m = match;
    if (!m.sudden) {
      const youRem = 5 - m.youKicks, oppRem = 5 - m.oppKicks;
      if (m.youGoals > m.oppGoals + oppRem) return "you";
      if (m.oppGoals > m.youGoals + youRem) return "opp";
      if (m.youKicks >= 5 && m.oppKicks >= 5) {
        if (m.youGoals !== m.oppGoals) return m.youGoals > m.oppGoals ? "you" : "opp";
        m.sudden = true; return null;
      }
      return null;
    } else {
      if (m.youKicks === m.oppKicks && m.youKicks > 5 && m.youGoals !== m.oppGoals)
        return m.youGoals > m.oppGoals ? "you" : "opp";
      return null;
    }
  }

  function proceed() {
    const w = decideWinner();
    if (w) { endMatch(w); return; }
    match.turn = match.turn === "you" ? "opp" : "you";
    nextKick();
  }

  function endMatch(winner) {
    inMatch = false; phase = PHASE.IDLE; hidePrompt(); hide("match-hud"); hide("kicker-panel");
    if (stage === "group") endGroupMatch(winner);
    else endKnockoutMatch(winner);
  }

  // ── Eliminatorias ──────────────────────────────────────────────────────────
  function endKnockoutMatch(winner) {
    if (winner === "you") {
      const reached = roundIdx + 1;
      if (roundIdx === ROUNDS.length - 1) {
        if (4 > bestStage) { bestStage = 4; localStorage.setItem("penales_beststage", "4"); }
        trophies++; localStorage.setItem("penales_trophies", String(trophies));
        $("champ-flag").innerHTML = badge(yourTeam, "lg");
        $("champ-team").textContent = `${yourTeam.name} se consagra campeón del Mundial 2026`;
        showOnly("champion-screen"); spawnConfetti(W / 2, H * 0.4); sndGoal();
      } else {
        if (reached > bestStage) { bestStage = reached; localStorage.setItem("penales_beststage", String(bestStage)); }
        $("result-title").textContent = "¡GANASTE! 🎉";
        $("result-detail").textContent = `${yourTeam.name} ${match.youGoals} - ${match.oppGoals} ${match.opp.name}. ¡A ${ROUNDS[roundIdx + 1].short}!`;
        $("result-btn").textContent = "CONTINUAR ▶";
        $("result-btn").dataset.action = "next";
        showOnly("result-screen");
      }
    } else {
      $("result-title").textContent = "Quedaste eliminado 😞";
      $("result-detail").textContent = `${yourTeam.name} ${match.youGoals} - ${match.oppGoals} ${match.opp.name} en ${ROUNDS[roundIdx].short}.`;
      $("result-btn").textContent = "🔁 REINTENTAR";
      $("result-btn").dataset.action = "retry";
      showOnly("result-screen");
    }
  }

  function startKnockouts() {
    stage = "knockout"; roundIdx = 0;
    const pool = TEAMS.filter((t) => !groupTeams.includes(t));
    for (let s = pool.length - 1; s > 0; s--) { const j = (Math.random() * (s + 1)) | 0;[pool[s], pool[j]] = [pool[j], pool[s]]; }
    bracket = pool.slice(0, 4);
    showMatchIntro();
  }

  // ── Fase de grupos ──────────────────────────────────────────────────────────
  function simGroupMatch(a, b) {
    const ra = rowOf(a), rb = rowOf(b);
    let ga = 1 + (Math.random() * 4 | 0), gb = 1 + (Math.random() * 4 | 0);
    if (ga === gb) (Math.random() < 0.5 ? ga++ : gb++);
    ra.gf += ga; ra.ga += gb; rb.gf += gb; rb.ga += ga;
    if (ga > gb) ra.pts += 3; else rb.pts += 3;
  }
  function endGroupMatch(winner) {
    const youR = rowOf(yourTeam), oppR = rowOf(currentOpp());
    youR.gf += match.youGoals; youR.ga += match.oppGoals;
    oppR.gf += match.oppGoals; oppR.ga += match.youGoals;
    if (winner === "you") youR.pts += 3; else oppR.pts += 3;
    const other = groupSchedule[matchday].other;
    simGroupMatch(other[0], other[1]);
    matchday++;
    if (matchday < 3) {
      showGroupStandings(`Resultado: ${yourTeam.name} ${match.youGoals}-${match.oppGoals} ${oppR.team.name}`, "SIGUIENTE FECHA ▶", "next");
    } else {
      const sorted = sortedTable();
      const posIdx = sorted.findIndex((r) => r.team === yourTeam);
      if (posIdx < 2) {
        if (bestStage < 0) {/*noop*/}
        showGroupStandings(`¡${yourTeam.name} clasifica ${posIdx === 0 ? "1º" : "2º"} y avanza a octavos! 🎉`, "⚽ A OCTAVOS", "knockout");
      } else {
        showGroupStandings(`${yourTeam.name} quedó ${posIdx + 1}º y no clasificó 😞`, "🔁 REINTENTAR", "retry");
      }
    }
  }
  function sortedTable() {
    return groupTable.slice().sort((a, b) =>
      b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || (Math.random() - 0.5));
  }
  function showGroupStandings(msg, btnText, action) {
    const sorted = sortedTable();
    let html = `<tr><th></th><th>Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr>`;
    sorted.forEach((r, i) => {
      const mine = r.team === yourTeam ? " class=\"gt-mine\"" : "";
      const qual = i < 2 ? "✅" : "";
      const pj = (r.pts > 0 || r.gf > 0 || r.ga > 0) ? Math.max(0, matchday) : matchday;
      html += `<tr${mine}><td>${qual}</td><td>${badge(r.team, "sm")} ${r.team.name}</td><td>${matchday}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`;
    });
    $("gs-table").innerHTML = html;
    $("gs-title").textContent = matchday < 3 ? `GRUPO ${groupName} · FECHA ${matchday}` : `GRUPO ${groupName} · FINAL`;
    $("gs-msg").textContent = msg;
    const btn = $("gs-btn"); btn.textContent = btnText; btn.dataset.action = action;
    showOnly("group-screen");
  }

  // ── HUD del partido ─────────────────────────────────────────────────────--
  function updateMatchHUD() {
    $("mh-you-flag").innerHTML = badge(match.you, "sm"); $("mh-you-name").textContent = match.you.name;
    $("mh-opp-flag").innerHTML = badge(match.opp, "sm"); $("mh-opp-name").textContent = match.opp.name;
    $("mh-you-goals").textContent = match.youGoals; $("mh-opp-goals").textContent = match.oppGoals;
    $("mh-round").textContent = match.sudden ? "MUERTE SÚBITA" : match.round.short;
    $("mh-dots").innerHTML = dotsRow(match.results.you) + dotsRow(match.results.opp);
  }
  function dotsRow(res) {
    let html = '<div class="mh-dotrow">';
    const n = Math.max(5, res.length);
    for (let i = 0; i < n; i++) {
      const r = res[i];
      html += `<span class="dot ${r === "goal" ? "goal" : r === "miss" ? "miss" : ""}"></span>`;
    }
    return html + "</div>";
  }

  // ── Confetti / popups ─────────────────────────────────────────────────────
  const COLORS = ["#ffd34d", "#38bdf8", "#22c55e", "#fff", "#75aadb"];
  function spawnConfetti(x, y) {
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 320;
      confetti.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 1 + Math.random(), color: COLORS[(Math.random() * COLORS.length) | 0], size: 4 + Math.random() * 5 });
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt) {
    if (phase === PHASE.SHOOT_FLY || phase === PHASE.DEFEND_FLY) {
      ball.t += dt / FLIGHT;
      const t = Math.min(ball.t, 1);
      ball.x = ball.sx + (ball.tx - ball.sx) * t;
      ball.y = ball.sy + (ball.ty - ball.sy) * t;
      ball.scale = 1 - 0.55 * t;
      ball.lift = Math.sin(t * Math.PI) * H * 0.10; // arco del disparo
      ball.spin += dt * 16;
      trail.push({ x: ball.x, y: ball.y - ball.lift, s: ball.scale });
      if (trail.length > 12) trail.shift();
      const kb = layout().keeperBase;
      keeper.x = keeper.base + (keeper.cx - keeper.base) * t;
      keeper.y = kb.y + (keeper.cy - kb.y) * t * 0.9;
      if (ball.t >= 1) resolveImpact();
    } else if (phase === PHASE.BETWEEN) {
      betweenTimer -= dt;
      if (betweenTimer <= 0) proceed();
    }
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i]; p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) confetti.splice(i, 1);
    }
    for (let i = popups.length - 1; i >= 0; i--) { popups[i].t -= dt; if (popups[i].t <= 0) popups.splice(i, 1); }
    if (flash.a > 0) flash.a = Math.max(0, flash.a - dt * 1.6);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function draw() {
    const L = layout();
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawBackground(L);
    drawGoal(L);
    if (inMatch) {
      drawKeeper(L);
      const aiming = phase === PHASE.SHOOT_AIM || phase === PHASE.DEFEND_AIM;
      if (aiming) drawShooter(L);
      if (phase === PHASE.SHOOT_AIM && aim.active) drawAim(L);
      if (phase === PHASE.DEFEND_AIM && aim.active) drawDiveHint(L);
      drawTrail();
      drawBall();
    }
    drawConfetti(); drawPopups();
    ctx.restore();
    if (flash.a > 0) { ctx.fillStyle = flash.color; ctx.globalAlpha = flash.a; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  function drawBackground(L) {
    const horizon = L.goalTop - L.goalH * 0.35;
    // Cielo nocturno
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#0a1228"); sky.addColorStop(1, "#1d3a72");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
    // Reflectores
    for (const fx of [W * 0.16, W * 0.84]) {
      const g = ctx.createRadialGradient(fx, 0, 0, fx, 0, H * 0.5);
      g.addColorStop(0, "rgba(255,255,240,0.22)"); g.addColorStop(1, "rgba(255,255,240,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
    }
    // Tribuna
    const stand = ctx.createLinearGradient(0, 0, 0, horizon);
    stand.addColorStop(0, "#0c1730"); stand.addColorStop(1, "#1b2e50");
    ctx.fillStyle = stand; ctx.fillRect(0, 0, W, horizon);
    // Público: puntitos ordenados y tenues
    const cw = 13, rows = 6;
    for (let r = 0; r < rows; r++) {
      const y = horizon * (0.18 + r * 0.12);
      for (let c = 0; c * cw < W; c++) {
        ctx.globalAlpha = 0.16 + r * 0.03;
        ctx.fillStyle = COLORS[(c * 3 + r * 2) % COLORS.length];
        ctx.beginPath(); ctx.arc(c * cw + (r % 2) * (cw / 2), y, 1.7, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // Baranda
    ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, horizon - 2); ctx.lineTo(W, horizon - 2); ctx.stroke();
    // Césped con franjas
    const fieldTop = horizon;
    const g2 = ctx.createLinearGradient(0, fieldTop, 0, H);
    g2.addColorStop(0, "#1f8a43"); g2.addColorStop(1, "#0c5c28");
    ctx.fillStyle = g2; ctx.fillRect(0, fieldTop, W, H - fieldTop);
    for (let i = 0; i < 9; i++) {
      const y0 = fieldTop + (H - fieldTop) * (i / 9) * (i / 9);
      const y1 = fieldTop + (H - fieldTop) * ((i + 1) / 9) * ((i + 1) / 9);
      if (i % 2 === 0) { ctx.fillStyle = "rgba(255,255,255,0.045)"; ctx.fillRect(0, y0, W, y1 - y0); }
    }
    // Área (trapecio) + arco + punto
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 3;
    const boxBot = L.goalBottom + (H - L.goalBottom) * 0.7;
    ctx.beginPath();
    ctx.moveTo(W / 2 - L.goalW * 0.75, boxBot);
    ctx.lineTo(W / 2 - L.goalW * 0.62, L.goalBottom + 4);
    ctx.lineTo(W / 2 + L.goalW * 0.62, L.goalBottom + 4);
    ctx.lineTo(W / 2 + L.goalW * 0.75, boxBot);
    ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W / 2, L.spot.y - 4, L.goalW * 0.22, L.goalH * 0.12, 0, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(L.spot.x, L.spot.y - 4, 4, 0, 7); ctx.fill();
    // Viñeta
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  function drawGoal(L) {
    const postW = Math.max(6, L.goalW * 0.022);
    const depth = L.goalH * 0.16;
    // Techo de la red (da sensación de profundidad)
    ctx.fillStyle = "rgba(10,20,40,0.30)";
    ctx.beginPath();
    ctx.moveTo(L.goalLeft, L.goalTop); ctx.lineTo(L.goalLeft + depth, L.goalTop - depth);
    ctx.lineTo(L.goalRight - depth, L.goalTop - depth); ctx.lineTo(L.goalRight, L.goalTop);
    ctx.closePath(); ctx.fill();
    // Red diagonal (recortada al arco)
    ctx.save();
    ctx.beginPath(); ctx.rect(L.goalLeft, L.goalTop, L.goalW, L.goalH); ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.20)"; ctx.lineWidth = 1;
    const step = L.goalW * 0.045;
    for (let x = L.goalLeft - L.goalH; x < L.goalRight + L.goalH; x += step) {
      ctx.beginPath(); ctx.moveTo(x, L.goalTop); ctx.lineTo(x + L.goalH, L.goalBottom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, L.goalTop); ctx.lineTo(x - L.goalH, L.goalBottom); ctx.stroke();
    }
    ctx.restore();
    // Sombra de los postes en el piso
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.ellipse(L.goalLeft, L.goalBottom, postW * 2.2, postW * 0.8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(L.goalRight, L.goalBottom, postW * 2.2, postW * 0.8, 0, 0, 7); ctx.fill();
    // Postes + travesaño (blancos, redondeados)
    function bar(x, y, w, h) {
      const g = ctx.createLinearGradient(x, y, x + w, y + (h > w ? 0 : h));
      g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#aeb7c5");
      ctx.fillStyle = g; roundRect(x, y, w, h, Math.min(w, h) * 0.45); ctx.fill();
    }
    bar(L.goalLeft - postW, L.goalTop - postW, postW, L.goalH + postW);   // poste izq
    bar(L.goalRight, L.goalTop - postW, postW, L.goalH + postW);          // poste der
    bar(L.goalLeft - postW, L.goalTop - postW, L.goalW + postW * 2, postW); // travesaño
  }
  function shadow(x, y, rx) {
    ctx.save(); ctx.globalAlpha = 0.26; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.3, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function drawKeeper(L) {
    const reaching = phase === PHASE.SHOOT_FLY || phase === PHASE.DEFEND_FLY || phase === PHASE.BETWEEN;
    const dir = Math.sign(keeper.cx - keeper.base) || 0;
    const u = L.goalW * 0.072;
    const d = reaching ? Math.min(1, Math.abs(keeper.x - keeper.base) / (L.goalW * 0.26)) : 0;
    shadow(keeper.x, L.keeperBase.y + 4, u * 1.5 * (1 + d * 0.8));
    ctx.save(); ctx.translate(keeper.x, keeper.y); ctx.rotate(dir * d * 1.15); ctx.lineCap = "round";
    const hipY = -u * 1.5, shoY = -u * 2.45, headY = -u * 3.05, midY = (shoY + hipY) / 2;
    const footX = lerp(u * 0.5, u * 0.2, d);
    // Piernas + botines
    ctx.strokeStyle = "#0e1422"; ctx.lineWidth = u * 0.5;
    ctx.beginPath(); ctx.moveTo(-u * 0.25, hipY); ctx.lineTo(-footX, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(u * 0.25, hipY); ctx.lineTo(footX, 0); ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.ellipse(-footX, 0, u * 0.3, u * 0.16, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(footX, 0, u * 0.3, u * 0.16, 0, 0, 7); ctx.fill();
    // Short
    ctx.fillStyle = "#0c2417"; roundRect(-u * 0.72, hipY - u * 0.1, u * 1.44, u * 0.8, u * 0.2); ctx.fill();
    // Camiseta
    ctx.fillStyle = keeper.color; roundRect(-u * 0.8, shoY, u * 1.6, (hipY - shoY) + u * 0.15, u * 0.35); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.10)"; roundRect(-u * 0.8, midY, u * 1.6, (hipY - midY) + u * 0.15, u * 0.2); ctx.fill();
    ctx.fillStyle = contrast(keeper.color); ctx.font = `900 ${u * 0.8}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("1", 0, midY);
    // Brazos + guantes
    ctx.lineWidth = u * 0.42;
    for (const s of [-1, 1]) {
      const hx = lerp(s * u * 1.25, s * u * 0.35, d), hy = lerp(-u * 1.95, -u * 3.6, d);
      ctx.strokeStyle = keeper.color;
      ctx.beginPath(); ctx.moveTo(s * u * 0.55, shoY + u * 0.15); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = "#16c47a"; ctx.beginPath(); ctx.arc(hx, hy, u * 0.33, 0, 7); ctx.fill();
    }
    // Cabeza + pelo
    ctx.fillStyle = "#f1c27d"; ctx.beginPath(); ctx.arc(0, headY, u * 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#2a1a0e"; ctx.beginPath(); ctx.arc(0, headY - u * 0.12, u * 0.5, Math.PI * 1.04, Math.PI * 1.96); ctx.fill();
    ctx.restore();
  }
  function drawShooter(L) {
    const x = L.spot.x - L.goalW * 0.18, y = L.spot.y;
    const u = L.goalW * 0.052;
    shadow(x, y + 3, u * 1.3);
    ctx.save(); ctx.translate(x, y); ctx.lineCap = "round";
    const hipY = -u * 1.5, shoY = -u * 2.45, headY = -u * 3.0, midY = (shoY + hipY) / 2;
    // Pierna de apoyo + de pateo (hacia la pelota)
    ctx.strokeStyle = "#0e1422"; ctx.lineWidth = u * 0.48;
    ctx.beginPath(); ctx.moveTo(-u * 0.2, hipY); ctx.lineTo(-u * 0.45, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(u * 0.1, hipY); ctx.lineTo(u * 0.95, -u * 0.35); ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.ellipse(-u * 0.45, 0, u * 0.3, u * 0.16, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(u * 1.0, -u * 0.38, u * 0.3, u * 0.16, -0.5, 0, 7); ctx.fill();
    // Short
    ctx.fillStyle = "rgba(0,0,0,0.55)"; roundRect(-u * 0.64, hipY - u * 0.1, u * 1.28, u * 0.72, u * 0.2); ctx.fill();
    // Camiseta
    ctx.fillStyle = shooterColor; roundRect(-u * 0.74, shoY, u * 1.48, (hipY - shoY) + u * 0.15, u * 0.32); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.12)"; roundRect(-u * 0.74, shoY, u * 0.55, (hipY - shoY) + u * 0.15, u * 0.2); ctx.fill();
    ctx.fillStyle = contrast(shooterColor); ctx.font = `900 ${u * 0.72}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(shooterNum), 0, midY);
    // Brazos
    ctx.strokeStyle = shooterColor; ctx.lineWidth = u * 0.38;
    ctx.beginPath(); ctx.moveTo(-u * 0.5, shoY + u * 0.2); ctx.lineTo(-u * 1.3, shoY + u * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(u * 0.5, shoY + u * 0.2); ctx.lineTo(u * 1.1, shoY - u * 0.5); ctx.stroke();
    // Cabeza + pelo
    ctx.fillStyle = "#f1c27d"; ctx.beginPath(); ctx.arc(0, headY, u * 0.46, 0, 7); ctx.fill();
    ctx.fillStyle = "#1c120a"; ctx.beginPath(); ctx.arc(0, headY - u * 0.1, u * 0.46, Math.PI * 1.04, Math.PI * 1.96); ctx.fill();
    ctx.restore();
  }
  function drawTrail() {
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      ctx.globalAlpha = (i / trail.length) * 0.3;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.x, p.y, ballRadius(p.s) * 0.7, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function ballRadius(scale) { return Math.max(6, layout().goalW * 0.058 * scale); }
  function pentagon(cx, cy, rad, rot) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = rot + i * (Math.PI * 2 / 5); const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  }
  function drawBall() {
    const r = ballRadius(ball.scale);
    const by = ball.y - ball.lift;
    // Sombra
    const sh = Math.max(0.08, 1 - ball.lift / (H * 0.12));
    ctx.save(); ctx.globalAlpha = 0.22 * sh; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + r * 0.55, r * sh, r * 0.35 * sh, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.restore();
    // Esfera blanca
    const g = ctx.createRadialGradient(ball.x - r * 0.35, by - r * 0.35, r * 0.15, ball.x, by, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#c8d0db");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ball.x, by, r, 0, 7); ctx.fill();
    // Parches negros (clásicos), recortados al círculo
    ctx.save(); ctx.beginPath(); ctx.arc(ball.x, by, r, 0, 7); ctx.clip();
    ctx.translate(ball.x, by); ctx.rotate(ball.spin); ctx.fillStyle = "#1b1d22";
    pentagon(0, 0, r * 0.34, -Math.PI / 2); ctx.fill();           // central
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const px = Math.cos(a) * r * 0.95, py = Math.sin(a) * r * 0.95;
      pentagon(px, py, r * 0.4, a - Math.PI / 2); ctx.fill();      // parches del borde
    }
    // Costuras
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = Math.max(1, r * 0.05);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34); ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ball.x, by, r, 0, 7); ctx.stroke();
  }
  function drawAim(L) {
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L.spot.x, L.spot.y); ctx.lineTo(aim.x, aim.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#ffd34d"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(aim.x, aim.y, 16, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(aim.x - 22, aim.y); ctx.lineTo(aim.x + 22, aim.y); ctx.moveTo(aim.x, aim.y - 22); ctx.lineTo(aim.x, aim.y + 22); ctx.stroke();
    ctx.restore();
  }
  function drawDiveHint(L) {
    ctx.save(); ctx.fillStyle = "rgba(56,189,248,0.18)"; ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(aim.x, aim.y, L.goalH * 0.34, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "700 14px system-ui"; ctx.textAlign = "center";
    ctx.fillText("🧤", aim.x, aim.y + 5); ctx.restore();
  }
  function drawConfetti() { for (const p of confetti) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); } ctx.globalAlpha = 1; }
  function drawPopups() {
    for (const p of popups) {
      const k = 1 - p.t; ctx.save(); ctx.globalAlpha = Math.min(1, p.t * 2.2);
      const px = Math.max(W * 0.3, Math.min(W * 0.7, p.x));
      const y = p.y - k * 50;
      const fs = Math.round(Math.min(W, H) * 0.13);
      ctx.font = "900 " + fs + "px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = fs * 0.14; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineJoin = "round";
      ctx.strokeText(p.text, px, y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, px, y);
      ctx.restore();
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ── Input ────────────────────────────────────────────────────────────────
  function pos(e) { const r = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
  const isAimPhase = () => phase === PHASE.SHOOT_AIM || phase === PHASE.DEFEND_AIM;
  canvas.addEventListener("pointerdown", (e) => {
    audio(); startCrowd();
    if (!isAimPhase()) return;
    const p = pos(e); aim.x = p.x; aim.y = p.y; aim.active = true; aim.dragging = true;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!isAimPhase()) return;
    const p = pos(e); aim.x = p.x; aim.y = p.y; aim.active = true;
  });
  function commitAim() {
    if (!isAimPhase() || !aim.active) return;
    aim.dragging = false;
    if (phase === PHASE.SHOOT_AIM) playerShoot(aim.x, aim.y);
    else playerDefend(aim.x, aim.y);
  }
  canvas.addEventListener("pointerup", commitAim);
  canvas.addEventListener("pointercancel", () => { aim.dragging = false; });

  // ── Botones ──────────────────────────────────────────────────────────────
  $("play-btn").addEventListener("click", () => { audio(); startCrowd(); buildGroups(); buildTeamGrid(); showOnly("team-screen"); });
  $("kick-btn").addEventListener("click", () => { audio(); startMatch(); });
  $("result-btn").addEventListener("click", function () {
    audio();
    if (this.dataset.action === "next") { maybeShowAd(); roundIdx++; showMatchIntro(); }
    else { showStart(); }
  });
  $("gs-btn").addEventListener("click", function () {
    audio();
    const a = this.dataset.action;
    if (a === "next") { maybeShowAd(); showMatchIntro(); }
    else if (a === "knockout") { maybeShowAd(); startKnockouts(); }
    else showStart();
  });
  $("champ-btn").addEventListener("click", () => { audio(); showStart(); });

  const muteBtn = $("mute-btn");
  const renderMute = () => muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.addEventListener("click", () => { muted = !muted; localStorage.setItem("penales_muted", muted ? "1" : "0"); renderMute(); applyMute(); });
  renderMute();

  function showStart() {
    let line = "";
    if (trophies > 0) line = `🏆 Copas ganadas: ${trophies}`;
    else if (bestStage > 0) line = `Tu mejor: llegaste a ${STAGE_NAMES[bestStage]}`;
    $("record-line").textContent = line;
    showOnly("start-screen"); hide("match-hud"); hidePrompt();
  }

  // ── Loop ─────────────────────────────────────────────────────────────────
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  resize(); resetBall(); showStart();
  requestAnimationFrame(frame);
})();
