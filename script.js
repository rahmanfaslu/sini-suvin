/* ===================================================================
   SINI & SALLY — WEDDING INVITATION INTERACTIVE JAVASCRIPT
   Features:
   - Reveal Video Intro & Music Autoplay on First Gesture
   - Realistic Canvas Scratch Card with Particle Trails & Auto-Clear
   - Live Countdown Timer
   - Falling Rose Petals & Golden Dust
   - Synthesized Romantic Wedding Melody Engine (100% Reliable Offline)
   - Add to Calendar (.ics + Google Calendar)
   - Guest Wishes Wall & Confetti Celebration
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initRevealIntro();
  initBackgroundMusic();
  initScratchCard();
  initCountdown();
  initPetals();
  initScrollAnimations();
  initStoryCarousel();
});

/* ===================================================================
   1. REVEAL VIDEO INTRO & LANDING
   =================================================================== */
function initRevealIntro() {
  const revealScreen = document.getElementById('reveal-screen');
  const openBtn = document.getElementById('open-invitation-btn');
  const video = document.getElementById('revealVideo');
  if (!revealScreen || !openBtn) return;

  let started = false;

  // Video stays paused on load — only plays after the button click
  if (video) {
    video.muted = true;
    video.pause();
    video.currentTime = 0;
  }

  function finishIntro() {
    if (revealScreen.classList.contains('opened')) return;
    revealScreen.classList.add('opened');
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) musicToggle.classList.add('visible');
    setTimeout(() => {
      if (video) video.pause();
      revealScreen.style.display = 'none';
      // Trigger initial scroll animations
      checkScrollElements();
    }, 1300);
  }

  function openInvitation() {
    if (started) return;
    started = true;

    revealScreen.classList.add('playing');

    if (typeof window.startWeddingMusic === 'function') window.startWeddingMusic();

    if (video) {
      video.currentTime = 0;
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => finishIntro());
      video.addEventListener('ended', finishIntro, { once: true });
      video.addEventListener('error', finishIntro, { once: true });
    } else {
      finishIntro();
    }
  }

  openBtn.addEventListener('click', openInvitation);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !started) openInvitation();
  });
}

/* ===================================================================
   1b. BACKGROUND WEDDING MUSIC
   Starts when the invitation is opened, toggled by the floating
   button, and stops when the page is closed / tab is removed.
   =================================================================== */
function initBackgroundMusic() {
  const audio = document.getElementById('weddingMusic');
  const toggle = document.getElementById('musicToggle');
  if (!audio || !toggle) return;

  function syncUI() {
    const playing = !audio.paused && !audio.ended;
    toggle.classList.toggle('playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    toggle.title = playing ? 'Pause music' : 'Play music';
  }

  function play() {
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  // Called from the "Open Invitation" click gesture so autoplay is allowed
  window.startWeddingMusic = function () {
    if (audio.paused) play();
    syncUI();
  };

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      play();
    } else {
      audio.pause();
    }
    syncUI();
  });

  audio.addEventListener('play', syncUI);
  audio.addEventListener('pause', syncUI);
  audio.addEventListener('ended', syncUI);

  // Stop the music when the tab is closed / the visitor leaves the page
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) audio.pause();
  });
  window.addEventListener('pagehide', () => {
    audio.pause();
    try { audio.currentTime = 0; } catch (e) {}
  });

  syncUI();
}

/* ===================================================================
/* ===================================================================
   2. SCRATCH CARD ENGINE (CANVAS 520x210px)
   =================================================================== */
let isScratchedRevealed = false;

function initScratchCard() {
  const canvas = document.getElementById('scratchCanvas');
  const box = document.getElementById('scratchCardBox');
  const instructions = document.getElementById('scratchInstructions');
  const countdownBlock = document.getElementById('countdownBlock');
  if (!canvas || !box) return;

  // Clear any previously saved reveal state so the scratch card
  // always starts fresh in its original unscratched state
  try { localStorage.removeItem('wedding_scratched'); } catch (e) {}

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let isPointerActive = false;
  let lastX = 0;
  let lastY = 0;
  let lastProgressCheck = 0;

  function resizeCanvas() {
    if (isScratchedRevealed) return;
    const rect = box.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.scale(dpr, dpr);
    drawScratchCover(rect.width, rect.height);
  }

  function drawScratchCover(w, h) {
    if (isScratchedRevealed) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Navy blue gradient (#1e4478 -> #2d6aa3)
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1e4478');
    grad.addColorStop(1, '#2d6aa3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Faint gold hairline border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.restore();
  }

  resizeCanvas();
  window.addEventListener('resize', () => {
    if (!isScratchedRevealed) resizeCanvas();
  });

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function scratchBrush(x, y) {
    if (isScratchedRevealed) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 60; // 30px radius brush
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastX && lastY) {
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    lastX = x;
    lastY = y;

    if (instructions && !instructions.classList.contains('hidden')) {
      instructions.classList.add('hidden');
    }
  }

  function onPointerDown(e) {
    if (isScratchedRevealed) return;
    if (e.cancelable) e.preventDefault();
    isPointerActive = true;
    const pos = getPointerPos(e);
    lastX = pos.x;
    lastY = pos.y;
    scratchBrush(pos.x, pos.y);
  }

  function onPointerMove(e) {
    if (!isPointerActive || isScratchedRevealed) return;
    if (e.cancelable) e.preventDefault();
    const pos = getPointerPos(e);
    scratchBrush(pos.x, pos.y);
    checkClearedPercentage();
  }

  function onPointerUp() {
    if (!isPointerActive) return;
    isPointerActive = false;
    lastX = 0;
    lastY = 0;
    checkClearedPercentage();
  }

  // Pointer Events support
  if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      onPointerDown(e);
    });
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', (e) => {
      try { canvas.releasePointerCapture(e.pointerId); } catch(err) {}
      onPointerUp();
    });
    canvas.addEventListener('pointercancel', (e) => {
      try { canvas.releasePointerCapture(e.pointerId); } catch(err) {}
      onPointerUp();
    });
  } else {
    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  // Throttled progress check (~100ms) with sample every 4th pixel
  function checkClearedPercentage() {
    if (isScratchedRevealed) return;
    const now = Date.now();
    if (now - lastProgressCheck < 100) return;
    lastProgressCheck = now;

    try {
      const w = Math.floor(canvas.width);
      const h = Math.floor(canvas.height);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      let clearCount = 0;
      let totalCount = 0;

      // Sample every 4th pixel (step of 16 in RGBA byte array)
      for (let i = 3; i < data.length; i += 16) {
        totalCount++;
        if (data[i] < 128) {
          clearCount++;
        }
      }

      const percent = (clearCount / totalCount) * 100;
      if (percent >= 55) {
        revealCardSequence();
      }
    } catch (e) {}
  }

  function revealCardSequence() {
    if (isScratchedRevealed) return;
    isScratchedRevealed = true;

    canvas.style.pointerEvents = 'none';
    canvas.style.transition = 'opacity 0.6s ease';
    canvas.style.opacity = '0';

    if (instructions) {
      instructions.style.transition = 'opacity 0.4s ease';
      instructions.style.opacity = '0';
    }

    setTimeout(() => {
      canvas.style.display = 'none';
      if (instructions) instructions.style.display = 'none';
    }, 600);

    // Animate separate countdown block in with smooth fade-up
    if (countdownBlock) {
      countdownBlock.classList.add('revealed');
      countdownBlock.setAttribute('aria-hidden', 'false');
    }

    triggerDualPartyPoppers();
  }

  // Fallback double click to reveal
  box.addEventListener('dblclick', revealCardSequence);
}

/* ===================================================================
   3. COUNTDOWN TIMER
   Target Date: 4 January 2027, 11:00 IST (2027-01-04T11:00:00+05:30)
   =================================================================== */
function initCountdown() {
  const weddingDate = new Date('2027-01-04T11:00:00+05:30').getTime();

  function update() {
    const now = new Date().getTime();
    const diff = weddingDate - now;

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');

    if (diff <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = n => (n < 10 ? '0' + n : String(n));

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minsEl) minsEl.textContent = pad(minutes);
    if (secsEl) secsEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
}

/* ===================================================================
   4. FLOATING PETALS & SPARKLES
   =================================================================== */
function initPetals() {
  const container = document.getElementById('petals-container');
  if (!container) return;

  const petalSVGs = [
    // Soft blush/rose petal
    `<svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15,2 C22,6 28,14 26,22 C24,28 16,30 11,26 C6,22 4,14 8,7 C10,4 12,2 15,2 Z" fill="#f8c3cd" opacity="0.75"/></svg>`,
    // Golden petal
    `<svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15,3 C24,8 27,16 23,24 C19,29 11,28 7,22 C3,16 6,8 11,4 Z" fill="#ebd28f" opacity="0.65"/></svg>`,
    // White jasmine petal
    `<svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15,2 C20,7 24,15 22,23 C20,28 13,28 9,24 C5,19 7,10 11,5 Z" fill="#ffffff" opacity="0.8"/></svg>`
  ];

  function createPetal() {
    const el = document.createElement('div');
    el.className = 'floating-petal';

    const size = Math.random() * 14 + 12; // 12px to 26px
    const left = Math.random() * 100;
    const duration = Math.random() * 6 + 7; // 7s to 13s
    const delay = Math.random() * 2;
    const svgIndex = Math.floor(Math.random() * petalSVGs.length);

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${left}vw`;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;
    el.innerHTML = petalSVGs[svgIndex];

    container.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, (duration + delay) * 1000);
  }

  // Spawn petals periodically
  setInterval(createPetal, 900);
  for (let i = 0; i < 5; i++) {
    createPetal();
  }

  // Spawn ambient floating sparkles
  for (let i = 0; i < 18; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'gold-sparkle-dot';
    const size = Math.random() * 3 + 2;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.left = `${Math.random() * 100}vw`;
    sparkle.style.top = `${Math.random() * 100}vh`;
    sparkle.style.animationDuration = `${Math.random() * 3 + 2}s`;
    sparkle.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(sparkle);
  }
}


/* ===================================================================
   6. PARTY POPPER CONFETTI FROM BOTH SIDES (2 SECONDS)
   =================================================================== */
function triggerDualPartyPoppers() {
  // Respect prefers-reduced-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ['#1e3a6e', '#2d6aa3', '#d4af37', '#fff8ec'];

  function frame() {
    if (typeof confetti === 'function') {
      const leftCount = Math.floor(Math.random() * 2) + 3; // 3-4 particles
      const rightCount = Math.floor(Math.random() * 2) + 3;

      // Left side: fire from origin { x: 0, y: 0.65 } at angle 60
      confetti({
        particleCount: leftCount,
        angle: 60,
        spread: 55,
        startVelocity: 55,
        gravity: 0.9,
        ticks: 200,
        origin: { x: 0, y: 0.65 },
        colors: colors,
        shapes: ['square', 'circle'],
        scalar: Math.random() * 0.4 + 0.8,
        disableForReducedMotion: true
      });

      // Right side: fire from origin { x: 1, y: 0.65 } at angle 120
      confetti({
        particleCount: rightCount,
        angle: 120,
        spread: 55,
        startVelocity: 55,
        gravity: 0.9,
        ticks: 200,
        origin: { x: 1, y: 0.65 },
        colors: colors,
        shapes: ['square', 'circle'],
        scalar: Math.random() * 0.4 + 0.8,
        disableForReducedMotion: true
      });
    }

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }

  frame();
}

/* ===================================================================
   7. CALENDAR (.ICS & GOOGLE CALENDAR)
   =================================================================== */
function addToCalendar() {
  const title = encodeURIComponent("Suvin & Sini's Wedding Ceremony");
  const details = encodeURIComponent("You are warmly invited to the Holy Matrimony & Wedding Celebration of Suvin & Sini. Venue: St. Mary's Orthodox Syrian Church, Alencherry, Anchal, Kollam.");
  const location = encodeURIComponent("St. Mary's Orthodox Syrian Church, Alencherry, Karukone P.O., Anchal, Kollam - 691324");
  const dates = "20270104T053000Z/20270104T110000Z"; // 11:00 AM IST to 4:30 PM IST

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

  // Direct open Google Calendar
  window.open(googleUrl, '_blank');
}

/* ===================================================================
   8. GUEST BLESSINGS WALL FORM
   =================================================================== */
function submitWish(e) {
  e.preventDefault();
  const nameInput = document.getElementById('guestName');
  const msgInput = document.getElementById('guestMessage');
  const feed = document.getElementById('wishesFeed');

  if (!nameInput || !msgInput || !feed) return;

  const name = nameInput.value.trim();
  const msg = msgInput.value.trim();

  if (!name || !msg) return;

  const item = document.createElement('div');
  item.className = 'wish-item';
  item.innerHTML = `
    <div class="wish-author">${escapeHtml(name)}</div>
    <div class="wish-text">"${escapeHtml(msg)}"</div>
  `;

  feed.prepend(item);
  nameInput.value = '';
  msgInput.value = '';

  triggerConfetti();
  alert('Thank you for your heartfelt blessings! ❦');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

/* ===================================================================
   9. SCROLL REVEAL ANIMATIONS
   =================================================================== */
function checkScrollElements() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  const windowHeight = window.innerHeight;

  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top <= windowHeight * 0.9) {
      el.classList.add('in-view');
    }
  });
}

function initScrollAnimations() {
  window.addEventListener('scroll', checkScrollElements, { passive: true });
  window.addEventListener('resize', checkScrollElements, { passive: true });
  checkScrollElements();
}

/* Story Memory Photo Carousel (arrows + dots) */
function navigateStory(direction) {
  const carousel = document.getElementById('storyCarousel');
  if (!carousel) return;
  const slides = carousel.querySelectorAll('.story-slide');
  if (!slides.length) return;

  let idx = 0;
  slides.forEach((s, i) => { if (s.classList.contains('active')) idx = i; });

  const next = (idx + direction + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle('active', i === next));

  const dots = document.querySelectorAll('.carousel-dots .dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === next));
}

function initStoryCarousel() {
  const carousel = document.getElementById('storyCarousel');
  if (!carousel) return;
  const slides = carousel.querySelectorAll('.story-slide');
  const dotsWrap = document.querySelector('.carousel-dots');
  if (!dotsWrap || !slides.length) return;

  let idx = 0;
  slides.forEach((s, i) => { if (s.classList.contains('active')) idx = i; });

  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === idx ? ' active' : '');
    dot.setAttribute('role', 'button');
    dot.setAttribute('aria-label', 'Go to story photo ' + (i + 1));
    dot.addEventListener('click', () => navigateStory(i - idxFromDOM()));
    dotsWrap.appendChild(dot);
  });

  function idxFromDOM() {
    let cur = 0;
    slides.forEach((s, i) => { if (s.classList.contains('active')) cur = i; });
    return cur;
  }

  // Swipe support on touch devices
  let touchStartX = null;
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 45) navigateStory(dx < 0 ? 1 : -1);
  }, { passive: true });
}
