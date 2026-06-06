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
  ];

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
  let bracket = [];      // 4 equipos rivales
  let roundIdx = 0;
  let match = null;

  let trophies = parseInt(localStorage.getItem("penales_trophies") || "0", 10) || 0;
  let bestStage = parseInt(localStorage.getItem("penales_beststage") || "0", 10) || 0;
  let muted = localStorage.getItem("penales_muted") === "1";

  const ball = { x: 0, y: 0, scale: 1, t: 0, sx: 0, sy: 0, tx: 0, ty: 0, lift: 0 };
  const trail = [];
  const keeper = { x: 0, y: 0, cx: 0, cy: 0, base: 0, color: "#ffd34d" };
  let shooterColor = "#fff";
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
  function sndKick() { beep(160, 0.08, "square", 0.22); noiseBurst(0.06, 0.12, 2200, 0.005); }
  function sndGoal() { // ovación de la hinchada + silbato
    noiseBurst(0.9, 0.28, 1500, 0.12);
    beep(900, 0.18, "square", 0.10); setTimeout(() => beep(1320, 0.22, "square", 0.10), 110);
  }
  function sndSave() { // golpe seco
    beep(110, 0.16, "sine", 0.32); noiseBurst(0.12, 0.18, 500, 0.005);
  }

  // ── Overlays ─────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const show = (id) => $(id).classList.remove("hidden");
  const hide = (id) => $(id).classList.add("hidden");
  function showOnly(id) {
    ["start-screen", "team-screen", "match-screen", "result-screen", "champion-screen"].forEach(hide);
    if (id) show(id);
  }

  // ── Construir grilla de equipos ──────────────────────────────────────────
  function buildTeamGrid() {
    const grid = $("team-grid");
    grid.innerHTML = "";
    TEAMS.forEach((t, i) => {
      const b = document.createElement("button");
      b.className = "team-btn";
      b.innerHTML = badge(t, "md") + `<span class="tb-name">${t.name}</span>`;
      b.addEventListener("click", () => { audio(); pickTeam(i); });
      grid.appendChild(b);
    });
  }

  function pickTeam(i) {
    yourTeam = TEAMS[i];
    // Sortear 4 rivales distintos
    const pool = TEAMS.map((_, k) => k).filter((k) => k !== i);
    for (let s = pool.length - 1; s > 0; s--) { const j = (Math.random() * (s + 1)) | 0;[pool[s], pool[j]] = [pool[j], pool[s]]; }
    bracket = pool.slice(0, 4).map((k) => TEAMS[k]);
    roundIdx = 0;
    showMatchIntro();
  }

  function showMatchIntro() {
    const r = ROUNDS[roundIdx], opp = bracket[roundIdx];
    $("mi-round").textContent = r.name;
    $("mi-you-flag").innerHTML = badge(yourTeam, "lg"); $("mi-you-name").textContent = yourTeam.name;
    $("mi-opp-flag").innerHTML = badge(opp, "lg"); $("mi-opp-name").textContent = opp.name;
    showOnly("match-screen");
    hide("match-hud"); hide("phase-prompt");
  }

  // ── Iniciar partido (tanda) ──────────────────────────────────────────────
  function startMatch() {
    const opp = bracket[roundIdx];
    match = {
      round: ROUNDS[roundIdx], opp, you: yourTeam,
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
    ball.x = L.spot.x; ball.y = L.spot.y; ball.scale = 1; ball.t = 0; ball.lift = 0;
    trail.length = 0;
    keeper.x = L.keeperBase.x; keeper.y = L.keeperBase.y; keeper.base = L.keeperBase.x;
  }

  function nextKick() {
    resetBall();
    aim.active = false;
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
    const reach = L.goalH * 0.34;
    const inGoal = ball.tx > L.goalLeft && ball.tx < L.goalRight &&
                   ball.ty > L.goalTop && ball.ty < L.goalBottom + L.goalH * 0.05;
    const saved = Math.hypot(ball.tx - keeper.cx, ball.ty - keeper.cy) < reach;
    const shooting = phase === PHASE.SHOOT_FLY;

    if (shooting) {
      match.youKicks++;
      if (!inGoal) { match.results.you.push("miss"); saveFx("¡AFUERA! 😣"); }
      else if (!saved) { match.youGoals++; match.results.you.push("goal"); goalFx("¡GOL!", ball.tx, ball.ty); }
      else { match.results.you.push("miss"); saveFx("¡ATAJÓ! 🧤"); }
    } else {
      match.oppKicks++;
      if (!saved) { match.oppGoals++; match.results.opp.push("goal"); saveFx("GOL RIVAL", false); }
      else { match.results.opp.push("miss"); goalFx("¡ATAJASTE!", W / 2, L.goalBottom); }
    }
    updateMatchHUD();
    phase = PHASE.BETWEEN; betweenTimer = 1.0;
  }

  function goalFx(text, x, y) {
    flash = { a: 0.4, color: "#22c55e" };
    popups.push({ text, t: 0.95, color: "#fff", x, y });
    spawnConfetti(x, y); sndGoal();
  }
  function saveFx(text) {
    flash = { a: 0.5, color: "#ef4444" }; shake = 13;
    popups.push({ text, t: 0.95, color: "#ef4444", x: W / 2, y: H * 0.42 });
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
    inMatch = false; phase = PHASE.IDLE; hidePrompt(); hide("match-hud");
    const reached = roundIdx + 1;
    if (winner === "you") {
      if (reached > bestStage) { bestStage = reached; localStorage.setItem("penales_beststage", String(bestStage)); }
      if (roundIdx === ROUNDS.length - 1) {
        trophies++; localStorage.setItem("penales_trophies", String(trophies));
        $("champ-flag").innerHTML = badge(yourTeam, "lg");
        $("champ-team").textContent = `${yourTeam.name} se consagra campeón del Mundial 2026`;
        showOnly("champion-screen"); spawnConfetti(W / 2, H * 0.4); sndGoal();
      } else {
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
    ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.32, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  function drawKeeper(L) {
    const reaching = phase === PHASE.SHOOT_FLY || phase === PHASE.DEFEND_FLY || phase === PHASE.BETWEEN;
    const dir = Math.sign(keeper.cx - keeper.base) || 0;
    const u = L.goalW * 0.05;            // unidad de tamaño
    const bodyH = u * 2.0, bodyW = u * 1.1;
    shadow(keeper.x, L.keeperBase.y + 4, bodyW * 1.4);
    ctx.save(); ctx.translate(keeper.x, keeper.y);
    if (reaching && dir !== 0) ctx.rotate(dir * 0.55);
    // Piernas
    ctx.strokeStyle = "#101826"; ctx.lineWidth = u * 0.42; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-u * 0.3, 0); ctx.lineTo(-u * 0.4, u * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(u * 0.3, 0); ctx.lineTo(u * 0.4, u * 0.9); ctx.stroke();
    // Torso (camiseta)
    ctx.fillStyle = keeper.color; roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, u * 0.4); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(-bodyW / 2, -bodyH * 0.5, bodyW, bodyH * 0.5);
    // Brazos + guantes
    ctx.strokeStyle = keeper.color; ctx.lineWidth = u * 0.5;
    const armY = -bodyH * 0.78, spread = reaching ? u * 2.4 : u * 1.2, lift = reaching ? u * 1.3 : u * 0.3;
    ctx.beginPath(); ctx.moveTo(0, armY); ctx.lineTo(-spread, armY - lift); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, armY); ctx.lineTo(spread, armY - lift); ctx.stroke();
    ctx.fillStyle = "#1ad17a";
    ctx.beginPath(); ctx.arc(-spread, armY - lift, u * 0.38, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(spread, armY - lift, u * 0.38, 0, 7); ctx.fill();
    // Cabeza
    ctx.fillStyle = "#f1c27d"; ctx.beginPath(); ctx.arc(0, -bodyH - u * 0.45, u * 0.55, 0, 7); ctx.fill();
    ctx.fillStyle = "#3a2616"; ctx.beginPath(); ctx.arc(0, -bodyH - u * 0.65, u * 0.55, Math.PI, 0); ctx.fill();
    ctx.restore();
  }
  function drawShooter(L) {
    const x = L.spot.x - L.goalW * 0.17, y = L.spot.y;
    const u = L.goalW * 0.048;
    const bodyH = u * 1.9, bodyW = u * 1.0;
    shadow(x, y + 4, bodyW * 1.3);
    ctx.save(); ctx.translate(x, y);
    // Piernas (una adelantada, pose de pateo)
    ctx.strokeStyle = "#101826"; ctx.lineWidth = u * 0.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-u * 0.2, 0); ctx.lineTo(-u * 0.5, u * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(u * 0.2, 0); ctx.lineTo(u * 0.85, u * 0.5); ctx.stroke();
    // Torso
    ctx.fillStyle = shooterColor; roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, u * 0.4); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(-bodyW / 2, -bodyH, bodyW * 0.4, bodyH);
    // Brazo
    ctx.strokeStyle = shooterColor; ctx.lineWidth = u * 0.42;
    ctx.beginPath(); ctx.moveTo(0, -bodyH * 0.75); ctx.lineTo(-u * 1.1, -bodyH * 0.5); ctx.stroke();
    // Cabeza
    ctx.fillStyle = "#f1c27d"; ctx.beginPath(); ctx.arc(0, -bodyH - u * 0.4, u * 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#23150a"; ctx.beginPath(); ctx.arc(0, -bodyH - u * 0.58, u * 0.5, Math.PI, 0); ctx.fill();
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
    ctx.translate(ball.x, by); ctx.fillStyle = "#1b1d22";
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
      const k = 1 - p.t; ctx.save(); ctx.globalAlpha = Math.min(1, p.t * 2);
      ctx.fillStyle = p.color; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 6;
      ctx.font = "900 " + Math.round(Math.min(W, H) * 0.11) + "px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const y = p.y - k * 60; ctx.strokeText(p.text, p.x, y); ctx.fillText(p.text, p.x, y); ctx.restore();
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
    audio();
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
  $("play-btn").addEventListener("click", () => { audio(); buildTeamGrid(); showOnly("team-screen"); });
  $("kick-btn").addEventListener("click", () => { audio(); startMatch(); });
  $("result-btn").addEventListener("click", function () {
    audio();
    if (this.dataset.action === "next") { roundIdx++; showMatchIntro(); }
    else { showStart(); }
  });
  $("champ-btn").addEventListener("click", () => { audio(); showStart(); });

  const muteBtn = $("mute-btn");
  const renderMute = () => muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.addEventListener("click", () => { muted = !muted; localStorage.setItem("penales_muted", muted ? "1" : "0"); renderMute(); });
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
