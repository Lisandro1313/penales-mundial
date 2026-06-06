(() => {
  "use strict";

  // ── Canvas & sizing ──────────────────────────────────────────────────────
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);

  // ── Layout (todo relativo al tamaño de pantalla) ─────────────────────────
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

  // ── Estado del juego ─────────────────────────────────────────────────────
  const STATE = { READY: 0, SHOOTING: 1, RESULT: 2, OVER: 3, MENU: 4 };
  let state = STATE.MENU;
  let score = 0;
  let best = parseInt(localStorage.getItem("penales_best") || "0", 10) || 0;
  let muted = localStorage.getItem("penales_muted") === "1";

  const ball = { x: 0, y: 0, scale: 1, t: 0, sx: 0, sy: 0, tx: 0, ty: 0 };
  const keeper = { x: 0, y: 0, cx: 0, cy: 0, base: 0 };
  let aim = { x: 0, y: 0, active: false };
  let lastResult = null; // 'goal' | 'save'

  const confetti = [];
  const popups = [];
  let flash = { a: 0, color: "#fff" };
  let shake = 0;
  const FLIGHT = 0.5;
  let resultTimer = 0;

  // ── Audio (simple, con WebAudio) ─────────────────────────────────────────
  let actx = null;
  function audio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = null; }
    }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }
  function beep(freq, dur, type, vol) {
    if (muted) return;
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.value = vol || 0.15;
    o.connect(g); g.connect(a.destination);
    const now = a.currentTime;
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.start(now); o.stop(now + dur);
  }
  function sndKick() { beep(180, 0.12, "triangle", 0.25); }
  function sndGoal() {
    beep(523, 0.15, "square", 0.18);
    setTimeout(() => beep(659, 0.15, "square", 0.18), 90);
    setTimeout(() => beep(784, 0.25, "square", 0.18), 180);
  }
  function sndSave() { beep(140, 0.25, "sawtooth", 0.22); }

  // ── Dificultad según racha ───────────────────────────────────────────────
  function difficulty() {
    const lvl = score;
    return {
      pSmart: Math.min(0.30 + lvl * 0.035, 0.78),
      reach: 0,
    };
  }

  // ── Disparar ─────────────────────────────────────────────────────────────
  function shoot(px, py) {
    if (state !== STATE.READY) return;
    const L = layout();
    const mx = L.goalW * 0.04;
    const tx = Math.max(L.goalLeft + mx, Math.min(L.goalRight - mx, px));
    const ty = Math.max(L.goalTop + L.goalH * 0.10, Math.min(L.goalBottom - L.goalH * 0.05, py));

    ball.sx = L.spot.x; ball.sy = L.spot.y;
    ball.tx = tx; ball.ty = ty;
    ball.t = 0; ball.scale = 1;

    // El arquero elige a dónde tirarse
    const d = difficulty();
    const center = (L.goalLeft + L.goalRight) / 2;
    if (Math.random() < d.pSmart) {
      keeper.cx = tx + (Math.random() - 0.5) * L.goalW * 0.18; // adivina cerca
    } else {
      keeper.cx = L.goalLeft + Math.random() * L.goalW; // random
    }
    // El arquero llega mejor abajo que a los ángulos altos
    const lowBias = L.goalTop + L.goalH * (0.45 + Math.random() * 0.5);
    keeper.cy = lowBias;
    keeper.base = L.keeperBase.x;

    state = STATE.SHOOTING;
    aim.active = false;
    sndKick();
  }

  function resolveImpact() {
    const L = layout();
    const reach = L.goalH * (0.34 + Math.min(score * 0.008, 0.12));
    const dx = ball.tx - keeper.cx;
    const dy = ball.ty - keeper.cy;
    const dist = Math.hypot(dx, dy);
    const saved = dist < reach;

    if (saved) {
      lastResult = "save";
      state = STATE.RESULT;
      resultTimer = 1.0;
      shake = 14;
      flash = { a: 0.5, color: "#ef4444" };
      popups.push({ text: "¡ATAJADO!", t: 1.0, color: "#ef4444", x: W / 2, y: H * 0.42 });
      sndSave();
    } else {
      lastResult = "goal";
      score++;
      if (score > best) { best = score; localStorage.setItem("penales_best", String(best)); }
      state = STATE.RESULT;
      resultTimer = 0.85;
      flash = { a: 0.4, color: "#22c55e" };
      popups.push({ text: "¡GOL!", t: 0.85, color: "#fff", x: ball.tx, y: ball.ty });
      spawnConfetti(ball.tx, ball.ty);
      sndGoal();
    }
  }

  function nextShot() {
    const L = layout();
    ball.x = L.spot.x; ball.y = L.spot.y; ball.scale = 1; ball.t = 0;
    keeper.x = L.keeperBase.x; keeper.y = L.keeperBase.y;
    state = STATE.READY;
  }

  function gameOver() {
    state = STATE.OVER;
    document.getElementById("final-score").textContent = score;
    document.getElementById("final-best").textContent = "Mejor: " + best;
    const msg = score === 0 ? "¡Uy! El arquero te tapó el primero 🧤"
      : score >= 10 ? "¡Sos un crack del Mundial! 🏆🔥"
      : score >= 5 ? "¡Muy bien! Seguí practicando ⚽"
      : "¡Buen intento! Probá de nuevo 💪";
    document.getElementById("final-msg").textContent = msg;
    show("over-screen");
  }

  function startGame() {
    score = 0;
    hide("start-screen"); hide("over-screen");
    nextShot();
  }

  // ── Confetti ─────────────────────────────────────────────────────────────
  const COLORS = ["#ffd34d", "#38bdf8", "#22c55e", "#fff", "#75aadb"];
  function spawnConfetti(x, y) {
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 320;
      confetti.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 120,
        life: 1 + Math.random(),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        size: 4 + Math.random() * 5,
      });
    }
  }

  // ── Update ───────────────────────────────────────────────────────────────
  function update(dt) {
    if (state === STATE.SHOOTING) {
      ball.t += dt / FLIGHT;
      const t = Math.min(ball.t, 1);
      ball.x = ball.sx + (ball.tx - ball.sx) * t;
      ball.y = ball.sy + (ball.ty - ball.sy) * t;
      ball.scale = 1 - 0.55 * t;
      keeper.x = keeper.base + (keeper.cx - keeper.base) * t;
      keeper.y = layout().keeperBase.y + (keeper.cy - layout().keeperBase.y) * t * 0.9;
      if (ball.t >= 1) resolveImpact();
    } else if (state === STATE.RESULT) {
      resultTimer -= dt;
      if (resultTimer <= 0) {
        if (lastResult === "save") gameOver();
        else nextShot();
      }
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.vy += 600 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) confetti.splice(i, 1);
    }
    for (let i = popups.length - 1; i >= 0; i--) {
      popups[i].t -= dt;
      if (popups[i].t <= 0) popups.splice(i, 1);
    }
    if (flash.a > 0) flash.a = Math.max(0, flash.a - dt * 1.6);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function draw() {
    const L = layout();
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    drawBackground(L);
    drawGoal(L);
    if (state !== STATE.MENU) {
      drawKeeper(L);
      if (state === STATE.READY && aim.active) drawAim(L);
      drawBall();
    }
    drawConfetti();
    drawPopups();

    ctx.restore();

    if (flash.a > 0) {
      ctx.fillStyle = flash.color;
      ctx.globalAlpha = flash.a;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  function drawBackground(L) {
    // Cielo de estadio
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0e1b3a");
    sky.addColorStop(0.5, "#16306b");
    sky.addColorStop(0.5, "#1f7a3d");
    sky.addColorStop(1, "#0f5a2a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Tribunas (puntitos)
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 80; i++) {
      const x = (i * 97 % W);
      const y = (i * 53 % (H * 0.18));
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fillRect(x, y + 4, 3, 3);
    }
    ctx.restore();

    // Césped: líneas de perspectiva
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) {
      const y = H * 0.5 + (H * 0.5) * (i / 8) * (i / 8);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Área grande (semicírculo del punto de penal)
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(W / 2, L.goalBottom + (H - L.goalBottom) * 0.55, L.goalW * 0.62, L.goalH * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Punto de penal
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(L.spot.x, L.spot.y - 4, 4, 0, Math.PI * 2); ctx.fill();
  }

  function drawGoal(L) {
    const postW = Math.max(5, L.goalW * 0.018);
    // Red
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    const cols = 14, rows = 8;
    for (let i = 0; i <= cols; i++) {
      const x = L.goalLeft + (L.goalW * i) / cols;
      ctx.beginPath(); ctx.moveTo(x, L.goalTop); ctx.lineTo(x, L.goalBottom); ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      const y = L.goalTop + (L.goalH * j) / rows;
      ctx.beginPath(); ctx.moveTo(L.goalLeft, y); ctx.lineTo(L.goalRight, y); ctx.stroke();
    }
    // Postes
    ctx.fillStyle = "#f5f7fb";
    ctx.fillRect(L.goalLeft - postW, L.goalTop - postW, postW, L.goalH + postW);
    ctx.fillRect(L.goalRight, L.goalTop - postW, postW, L.goalH + postW);
    ctx.fillRect(L.goalLeft - postW, L.goalTop - postW, L.goalW + postW * 2, postW);
  }

  function drawKeeper(L) {
    const x = keeper.x, y = keeper.y;
    const reaching = state === STATE.SHOOTING || state === STATE.RESULT;
    const dir = Math.sign(keeper.cx - keeper.base) || 0;
    const bodyH = L.goalH * 0.42;
    const bodyW = L.goalW * 0.085;

    ctx.save();
    ctx.translate(x, y);
    if (reaching && dir !== 0) ctx.rotate(dir * 0.5);

    // Cuerpo
    ctx.fillStyle = "#ffd34d";
    roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, 6); ctx.fill();
    // Cabeza
    ctx.fillStyle = "#f1c27d";
    ctx.beginPath(); ctx.arc(0, -bodyH - bodyW * 0.5, bodyW * 0.55, 0, Math.PI * 2); ctx.fill();
    // Brazos (guantes)
    ctx.strokeStyle = "#ffd34d";
    ctx.lineWidth = bodyW * 0.45;
    ctx.lineCap = "round";
    const armY = -bodyH * 0.75;
    const spread = reaching ? bodyW * 2.2 : bodyW * 1.1;
    ctx.beginPath(); ctx.moveTo(0, armY); ctx.lineTo(-spread, armY - bodyW * (reaching ? 1.2 : 0.2)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, armY); ctx.lineTo(spread, armY - bodyW * (reaching ? 1.2 : 0.2)); ctx.stroke();
    ctx.fillStyle = "#22c55e";
    ctx.beginPath(); ctx.arc(-spread, armY - bodyW * (reaching ? 1.2 : 0.2), bodyW * 0.32, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(spread, armY - bodyW * (reaching ? 1.2 : 0.2), bodyW * 0.32, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawBall() {
    const r = Math.max(7, (W * 0.03) * ball.scale);
    ctx.save();
    // sombra
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + r * 0.7, r, r * 0.4, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    // pelota
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#222"; ctx.lineWidth = 1.5; ctx.stroke();
    // pentágono
    ctx.fillStyle = "#222";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const px = ball.x + Math.cos(a) * r * 0.42;
      const py = ball.y + Math.sin(a) * r * 0.42;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawAim(L) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L.spot.x, L.spot.y); ctx.lineTo(aim.x, aim.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#ffd34d"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(aim.x, aim.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(aim.x - 22, aim.y); ctx.lineTo(aim.x + 22, aim.y);
    ctx.moveTo(aim.x, aim.y - 22); ctx.lineTo(aim.x, aim.y + 22); ctx.stroke();
    ctx.restore();
  }

  function drawConfetti() {
    for (const p of confetti) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups() {
    for (const p of popups) {
      const k = 1 - p.t;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.t * 2);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 6;
      ctx.font = "900 " + Math.round(Math.min(W, H) * 0.12) + "px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const y = p.y - k * 60;
      ctx.strokeText(p.text, p.x, y);
      ctx.fillText(p.text, p.x, y);
      ctx.restore();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function updateHUD() {
    document.getElementById("score-value").textContent = score;
    document.getElementById("best-value").textContent = best;
  }

  // ── Input ────────────────────────────────────────────────────────────────
  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  canvas.addEventListener("pointerdown", (e) => {
    audio();
    if (state !== STATE.READY) return;
    const p = pointerPos(e);
    shoot(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (state !== STATE.READY) { aim.active = false; return; }
    const p = pointerPos(e);
    aim.x = p.x; aim.y = p.y; aim.active = true;
  });

  // ── Overlays helpers ─────────────────────────────────────────────────────
  function show(id) { document.getElementById(id).classList.remove("hidden"); }
  function hide(id) { document.getElementById(id).classList.add("hidden"); }

  document.getElementById("start-btn").addEventListener("click", () => { audio(); startGame(); });
  document.getElementById("retry-btn").addEventListener("click", () => { audio(); startGame(); });
  const muteBtn = document.getElementById("mute-btn");
  function renderMute() { muteBtn.textContent = muted ? "🔇" : "🔊"; }
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem("penales_muted", muted ? "1" : "0");
    renderMute();
  });
  renderMute();

  // ── Loop ─────────────────────────────────────────────────────────────────
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    draw();
    updateHUD();
    requestAnimationFrame(frame);
  }

  resize();
  nextShot();
  state = STATE.MENU;
  requestAnimationFrame(frame);
})();
