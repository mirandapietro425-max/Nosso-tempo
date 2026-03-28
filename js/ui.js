/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — ui.js
   Utilitários de UI: Toast, Saudação, Partículas,
   Contador, Timeline Observer
   ═══════════════════════════════════════════════ */

import { START_DATE, RECADINHOS, LS_DAILY_POPUP } from './config.js';

// ── TOAST ──────────────────────────────────────
export function showToast(msg, ms = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

// ── SAUDAÇÃO ────────────────────────────────────
export function initGreeting() {
  const el = document.getElementById('greeting');
  if (!el) return;
  const hour = new Date().getHours();
  let msg;
  if (hour < 6)        msg = '🌙 Boa madrugada, meu amor';
  else if (hour < 12)  msg = '☀️ Bom dia, minha princesa';
  else if (hour < 18)  msg = '🌤 Boa tarde, meu bem';
  else                 msg = '🌙 Boa noite, meu amor';
  el.textContent = msg;
}

// ── CONTADOR DE TEMPO ───────────────────────────
export function initCounter() {
  function tick() {
    const now  = new Date();
    const diff = now - START_DATE;
    if (diff < 0) return;

    const dias   = Math.floor(diff / 86400000);
    const horas  = Math.floor((diff % 86400000) / 3600000);
    const mins   = Math.floor((diff % 3600000) / 60000);
    const segs   = Math.floor((diff % 60000) / 1000);

    setEl('c-dias',  dias);
    setEl('c-horas', horas);
    setEl('c-min',   mins);
    setEl('c-seg',   segs);

    // Stats
    setEl('stat-dias',    dias);
    setEl('stat-noites',  dias);
    setEl('stat-semanas', Math.floor(dias / 7));
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  tick();
  setInterval(tick, 1000);
}

// ── PRÓXIMO ANIVERSÁRIO ─────────────────────────
export function initAnniversary() {
  const now    = new Date();
  const day    = now.getDate();
  const month  = now.getMonth();
  const year   = now.getFullYear();

  // Próximo dia 11
  let next11 = new Date(year, month, 11, 0, 0, 0);
  if (day >= 11) next11 = new Date(year, month + 1, 11, 0, 0, 0);

  // Mês anterior
  const prev11 = new Date(next11.getFullYear(), next11.getMonth() - 1, 11, 0, 0, 0);

  const diff      = next11 - now;
  const total     = next11 - prev11;
  const elapsed   = now - prev11;
  const progress  = Math.min(100, Math.max(0, (elapsed / total) * 100));

  const dDias  = Math.floor(diff / 86400000);
  const dHoras = Math.floor((diff % 86400000) / 3600000);
  const dMins  = Math.floor((diff % 3600000) / 60000);

  const daysEl    = document.getElementById('days-next');
  const labelEl   = document.getElementById('anniv-label');
  const fillEl    = document.getElementById('progress-fill');

  if (day === 11) {
    if (daysEl) daysEl.textContent = '🥂';
    if (labelEl) labelEl.textContent = 'Hoje é nosso dia especial! Feliz mesversário! 💕';
  } else {
    if (daysEl)  daysEl.textContent = `${dDias}d ${dHoras}h ${dMins}min`;
    if (labelEl) labelEl.textContent = 'para o nosso mesversário 💕';
  }

  if (fillEl) fillEl.style.width = `${progress.toFixed(1)}%`;
}

// ── CARTA SURPRESA ──────────────────────────────
export function initSurprise() {
  const now   = new Date();
  const day   = now.getDate();
  const month = now.getMonth();
  const year  = now.getFullYear();

  let next11  = new Date(year, month, 11, 0, 0, 0);
  if (day >= 11) next11 = new Date(year, month + 1, 11, 0, 0, 0);

  const isOpen     = day === 11;
  const lockedEl   = document.getElementById('surprise-locked');
  const openEl     = document.getElementById('surprise-open');
  const countdown  = document.getElementById('surprise-countdown');

  if (lockedEl) lockedEl.style.display = isOpen ? 'none' : 'block';
  if (openEl)   openEl.style.display   = isOpen ? 'block' : 'none';

  if (!isOpen && countdown) {
    const diff = next11 - now;
    const d    = Math.floor(diff / 86400000);
    const h    = Math.floor((diff % 86400000) / 3600000);
    const m    = Math.floor((diff % 3600000) / 60000);
    countdown.textContent = `Faltam ${d} dia${d !== 1 ? 's' : ''}, ${h}h e ${m}min`;
    setTimeout(initSurprise, 60000);
  }
}

// ── RECADINHO DIÁRIO ────────────────────────────
export function getDailyMessage() {
  const start = new Date('2024-10-11');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  return RECADINHOS[((diff % RECADINHOS.length) + RECADINHOS.length) % RECADINHOS.length];
}

export function getDailyDate() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function openDailyPopup() {
  document.getElementById('daily-popup-text').textContent = getDailyMessage();
  document.getElementById('daily-popup-date').textContent = getDailyDate();
  document.getElementById('daily-overlay').classList.add('show');
}

export function closeDailyPopup() {
  document.getElementById('daily-overlay').classList.remove('show');
  localStorage.setItem(LS_DAILY_POPUP, new Date().toDateString());
}

export function initDaily() {
  const msg = getDailyMessage();
  const cardText  = document.getElementById('daily-card-text');
  const popupText = document.getElementById('daily-popup-text');
  const popupDate = document.getElementById('daily-popup-date');

  if (cardText)  cardText.textContent  = msg;
  if (popupText) popupText.textContent = msg;
  if (popupDate) popupDate.textContent = getDailyDate();

  // Mostra popup automaticamente (uma vez por dia)
  const seen = localStorage.getItem(LS_DAILY_POPUP);
  if (seen !== new Date().toDateString()) {
    setTimeout(() => openDailyPopup(), 1800);
  }

  // Agenda atualização automática à meia-noite
  const now       = new Date();
  const meianoite = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  const msAte     = meianoite - now;
  setTimeout(() => { initDaily(); setInterval(initDaily, 86400000); }, msAte);
}

// ── PARTICLES (canvas) ──────────────────────────
export function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();

  // Ignora mudanças de viewport causadas pela barra do browser mobile
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (Math.abs(window.innerWidth - W) > 50 || Math.abs(window.innerHeight - H) > 150) resize();
    }, 300);
  });
  window.addEventListener('orientationchange', () => setTimeout(resize, 400));

  function mkHeart() {
    return {
      x:        Math.random() * 800,
      y:        Math.random() * 800 + 600,
      size:     Math.random() * 16 + 8,
      speed:    Math.random() * 0.6 + 0.3,
      opacity:  Math.random() * 0.4 + 0.08,
      drift:    (Math.random() - 0.5) * 0.4,
      rot:      Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    };
  }

  function drawHeart(x, y, size, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    const s = size / 30;
    ctx.moveTo(0, -12*s);
    ctx.bezierCurveTo(0, -20*s, 12*s, -20*s, 12*s, -10*s);
    ctx.bezierCurveTo(12*s, -2*s, 0, 8*s, 0, 16*s);
    ctx.bezierCurveTo(0, 8*s, -12*s, -2*s, -12*s, -10*s);
    ctx.bezierCurveTo(-12*s, -20*s, 0, -20*s, 0, -12*s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const HEARTS = Array.from({ length: 28 }, mkHeart);

  function animate() {
    ctx.clearRect(0, 0, W, H);
    HEARTS.forEach(h => {
      h.y   -= h.speed;
      h.x   += h.drift;
      h.rot += h.rotSpeed;
      if (h.y < -40) Object.assign(h, mkHeart(), { y: H + 40, x: Math.random() * W });
      ctx.fillStyle = `rgba(232,83,111,${h.opacity})`;
      drawHeart(h.x, h.y, h.size, h.rot);
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ── TIMELINE OBSERVER ───────────────────────────
export function initTimeline() {
  const items = document.querySelectorAll('.timeline-item');
  if (!items.length) return;
  const io = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.25 }
  );
  items.forEach(el => io.observe(el));
}

// ── FAVICON BASE64 ──────────────────────────────
export function initFavicon() {
  const link = document.getElementById('favicon-link');
  const icon = document.getElementById('apple-touch-icon');
  // eslint-disable-next-line max-len
  const BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAhjklEQVR4nOXX';
  if (link) link.href = BASE64;
  if (icon) icon.href = BASE64;
}
