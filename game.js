(() => {
  "use strict";

  // ── Datos ─────────────────────────────────────────────────────────────────
  const TEAMS = [
    { name: "Argentina", flag: "🇦🇷", c1: "#6c9bd6", c2: "#ffffff" },
    { name: "Brasil", flag: "🇧🇷", c1: "#ffd400", c2: "#1f9d55" },
    { name: "Francia", flag: "🇫🇷", c1: "#1e3a8a", c2: "#ffffff" },
    { name: "España", flag: "🇪🇸", c1: "#c60b1e", c2: "#ffc400" },
    { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", c1: "#f5f7fb", c2: "#1e3a8a" },
    { name: "Alemania", flag: "🇩🇪", c1: "#f5f7fb", c2: "#111111" },
    { name: "Portugal", flag: "🇵🇹", c1: "#c8102e", c2: "#1f7a3d" },
    { name: "P. Bajos", flag: "🇳🇱", c1: "#ff6200", c2: "#ffffff" },
    { name: "Italia", flag: "🇮🇹", c1: "#1a5fb4", c2: "#ffffff" },
    { name: "México", flag: "🇲🇽", c1: "#1f7a3d", c2: "#c60b1e" },
    { name: "Uruguay", flag: "🇺🇾", c1: "#6c9bd6", c2: "#0b1d4d" },
    { name: "Bélgica", flag: "🇧🇪", c1: "#c8102e", c2: "#ffd400" },
    { name: "Croacia", flag: "🇭🇷", c1: "#e23636", c2: "#ffffff" },
    { name: "Colombia", flag: "🇨🇴", c1: "#fcd116", c2: "#1e3a8a" },
    { name: "Japón", flag: "🇯🇵", c1: "#1a3aa0", c2: "#ffffff" },
    { name: "EE.UU.", flag: "🇺🇸", c1: "#f5f7fb", c2: "#1e3a8a" },
  ];

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
  function sndKick() { beep(180, 0.12, "triangle", 0.25); }
  function sndGoal() { beep(523, 0.15, "square", 0.18); setTimeout(() => beep(659, 0.15, "square", 0.18), 90); setTimeout(() => beep(784, 0.25, "square", 0.18), 180); }
  function sndSave() { beep(140, 0.25, "sawtooth", 0.22); }

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
      b.innerHTML =
        `<span class="tb-flag">${t.flag}</span>` +
        `<span class="tb-name">${t.name}</span>` +
        `<span class="tb-jersey"><span class="tb-swatch" style="background:${t.c1}"></span>` +
        `<span class="tb-swatch" style="background:${t.c2}"></span></span>`;
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
    $("mi-you-flag").textContent = yourTeam.flag; $("mi-you-name").textContent = yourTeam.name;
    $("mi-opp-flag").textContent = opp.flag; $("mi-opp-name").textContent = opp.name;
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
    const tgt = clampGoal(px, py, L);
    ball.sx = L.spot.x; ball.sy = L.spot.y; ball.tx = tgt.x; ball.ty = tgt.y; ball.t = 0;
    chooseOppKeeper(L, tgt, match.round.strength);
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
    const saved = Math.hypot(ball.tx - keeper.cx, ball.ty - keeper.cy) < reach;
    const shooting = phase === PHASE.SHOOT_FLY;

    if (shooting) {
      match.youKicks++;
      if (!saved) { match.youGoals++; match.results.you.push("goal"); goalFx("¡GOL!", ball.tx, ball.ty); }
      else { match.results.you.push("miss"); saveFx("¡ATAJÓ!", false); }
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
        $("champ-flag").textContent = yourTeam.flag;
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
    $("mh-you-flag").textContent = match.you.flag; $("mh-you-name").textContent = match.you.name;
    $("mh-opp-flag").textContent = match.opp.flag; $("mh-opp-name").textContent = match.opp.name;
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
    ctx.fillStyle = "#14213d"; ctx.fillRect(0, 0, W, horizon);
    for (let r = 0; r < 5; r++) {
      for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = 0.5 + (r / 10);
        ctx.fillStyle = COLORS[(i + r) % COLORS.length];
        ctx.fillRect((i * (W / 60) + r * 7) % W, horizon * (0.25 + r * 0.14), 2.5, 2.5);
      }
    }
    ctx.globalAlpha = 1;
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
    const postW = Math.max(6, L.goalW * 0.02);
    const depth = L.goalH * 0.30; // profundidad de la red
    const bx0 = L.goalLeft + depth, bx1 = L.goalRight - depth;
    const by0 = L.goalTop - depth * 0.6, by1 = L.goalBottom - depth * 0.25;
    // Fondo de la red (panel trasero)
    ctx.fillStyle = "rgba(10,20,40,0.35)";
    ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    // Líneas que conectan frente y fondo (efecto 3D)
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L.goalLeft, L.goalTop); ctx.lineTo(bx0, by0);
    ctx.moveTo(L.goalRight, L.goalTop); ctx.lineTo(bx1, by0);
    ctx.moveTo(L.goalLeft, L.goalBottom); ctx.lineTo(bx0, by1);
    ctx.moveTo(L.goalRight, L.goalBottom); ctx.lineTo(bx1, by1);
    ctx.stroke();
    // Malla del fondo
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    for (let i = 1; i < 10; i++) { const x = bx0 + ((bx1 - bx0) * i) / 10; ctx.beginPath(); ctx.moveTo(x, by0); ctx.lineTo(x, by1); ctx.stroke(); }
    for (let j = 1; j < 6; j++) { const y = by0 + ((by1 - by0) * j) / 6; ctx.beginPath(); ctx.moveTo(bx0, y); ctx.lineTo(bx1, y); ctx.stroke(); }
    // Malla del frente
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    const cols = 16, rows = 9;
    for (let i = 0; i <= cols; i++) { const x = L.goalLeft + (L.goalW * i) / cols; ctx.beginPath(); ctx.moveTo(x, L.goalTop); ctx.lineTo(x, L.goalBottom); ctx.stroke(); }
    for (let j = 0; j <= rows; j++) { const y = L.goalTop + (L.goalH * j) / rows; ctx.beginPath(); ctx.moveTo(L.goalLeft, y); ctx.lineTo(L.goalRight, y); ctx.stroke(); }
    // Postes con sombreado
    function post(x, y, w, h) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#c4ccd8");
      ctx.fillStyle = g; roundRect(x, y, w, h, w * 0.4); ctx.fill();
    }
    post(L.goalLeft - postW, L.goalTop - postW, postW, L.goalH + postW);
    post(L.goalRight, L.goalTop - postW, postW, L.goalH + postW);
    post(L.goalLeft - postW, L.goalTop - postW, L.goalW + postW * 2, postW);
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
      ctx.globalAlpha = (i / trail.length) * 0.35;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(4, W * 0.03 * p.s) * 0.8, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawBall() {
    const r = Math.max(7, (W * 0.03) * ball.scale);
    const by = ball.y - ball.lift;
    ctx.save();
    // Sombra en el piso (se achica cuando la pelota sube)
    const sh = Math.max(0.08, 1 - ball.lift / (H * 0.12));
    ctx.globalAlpha = 0.22 * sh; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + r * 0.5, r * sh, r * 0.35 * sh, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    // Pelota
    const g = ctx.createRadialGradient(ball.x - r * 0.3, by - r * 0.3, r * 0.2, ball.x, by, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#cfd6e0");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ball.x, by, r, 0, 7); ctx.fill();
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#1a1a1a"; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; const px = ball.x + Math.cos(a) * r * 0.4, py = by + Math.sin(a) * r * 0.4; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill(); ctx.restore();
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
