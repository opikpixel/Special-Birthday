/**
 * Special Birthday Interactive Flipbook for Annisa
 * Handles:
 * 1. Name verification quiz ("Annisa") + Confetti celebration
 * 2. 3D Flipbook page navigation & accessibility focus management
 * 3. Background Music (Web Audio API gentle music box + optional MP3 support)
 * 4. Interactive Gift Box unwrapping on Page 5
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const pages = Array.from(document.querySelectorAll('.book-page'));
  const pageCounterText = document.getElementById('page-counter-text');
  const liveAnnouncer = document.getElementById('live-announcer');

  // Gate Quiz Elements (Step 1 & 2)
  const gateForm = document.getElementById('gate-form');
  const nameInput = document.getElementById('birthday-name-input');
  const gateFeedback = document.getElementById('gate-feedback');
  const gateSubmitBtn = document.getElementById('gate-submit-btn');

  // Gift Box Elements (Step 6)
  const giftBoxBtn = document.getElementById('gift-box-btn');
  const giftTapBadge = document.getElementById('gift-tap-badge');
  const giftMessageCard = document.getElementById('gift-message-card');
  const giftNextBtn = document.getElementById('gift-next-btn');

  // Music Elements
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const musicLabel = document.getElementById('music-label');
  const bgAudioElement = document.getElementById('bg-audio');

  let currentPageIndex = 0;
  let isBookUnlocked = false;
  let isGiftOpened = false;

  // --- Ambient Particles Setup ---
  const particlesContainer = document.getElementById('ambient-particles');
  if (particlesContainer) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size = (Math.random() * 6 + 3).toFixed(1);
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${(Math.random() * 100).toFixed(1)}%`;
      p.style.animationDuration = `${(Math.random() * 12 + 10).toFixed(1)}s`;
      p.style.animationDelay = `-${(Math.random() * 15).toFixed(1)}s`;
      particlesContainer.appendChild(p);
    }
  }

  // --- Gentle Music Box Synthesizer + Optional MP3 Player ---
  class BirthdayMusicController {
    constructor(audioEl, toggleBtn, labelEl) {
      this.audioEl = audioEl;
      this.toggleBtn = toggleBtn;
      this.labelEl = labelEl;
      this.isPlaying = false;
      this.audioCtx = null;
      this.noteTimer = null;
      this.noteIndex = 0;
      this.useHtmlAudio = false;

      // Check if user added a custom bgm.mp3 file
      if (this.audioEl && this.audioEl.getAttribute('src')) {
        this.useHtmlAudio = true;
      }

      // Warm Music Box "Happy Birthday" + Sentimental Arpeggio Melody (Frequencies in Hz)
      this.melody = [
        { f: 261.63, d: 0.45 }, // C4
        { f: 261.63, d: 0.35 }, // C4
        { f: 293.66, d: 0.75 }, // D4
        { f: 261.63, d: 0.75 }, // C4
        { f: 349.23, d: 0.75 }, // F4
        { f: 329.63, d: 1.35 }, // E4

        { f: 261.63, d: 0.45 }, // C4
        { f: 261.63, d: 0.35 }, // C4
        { f: 293.66, d: 0.75 }, // D4
        { f: 261.63, d: 0.75 }, // C4
        { f: 392.00, d: 0.75 }, // G4
        { f: 349.23, d: 1.35 }, // F4

        { f: 261.63, d: 0.45 }, // C4
        { f: 261.63, d: 0.35 }, // C4
        { f: 523.25, d: 0.75 }, // C5
        { f: 440.00, d: 0.75 }, // A4
        { f: 349.23, d: 0.75 }, // F4
        { f: 329.63, d: 0.75 }, // E4
        { f: 293.66, d: 1.25 }, // D4

        { f: 466.16, d: 0.45 }, // Bb4
        { f: 466.16, d: 0.35 }, // Bb4
        { f: 440.00, d: 0.75 }, // A4
        { f: 349.23, d: 0.75 }, // F4
        { f: 392.00, d: 0.75 }, // G4
        { f: 349.23, d: 1.65 }  // F4
      ];
    }

    initContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    playBellNote(freq, duration) {
      if (!this.audioCtx || !this.isPlaying) return;
      const now = this.audioCtx.currentTime;

      // Pure warm sine wave (menghindari triangle yang tajam/grusak-grusuk di speaker HP/laptop)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Attack halus tanpa clipping, decay natural seperti kotak musik kayu
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.55);
    }

    playPageFlipSound() {
      // Dihilangkan suara osilator frekuensi sweep yang terdengar grusak-grusuk saat ganti halaman
    }

    scheduleNextNote() {
      if (!this.isPlaying) return;
      const note = this.melody[this.noteIndex];
      this.playBellNote(note.f, note.d);
      this.noteIndex = (this.noteIndex + 1) % this.melody.length;
      this.noteTimer = setTimeout(() => this.scheduleNextNote(), note.d * 780);
    }

    start() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.updateUI();

      if (this.useHtmlAudio) {
        this.audioEl.volume = 0.5;
        this.audioEl.play().catch(() => {
          // Fallback to Web Audio Music Box if MP3 file missing
          this.useHtmlAudio = false;
          this.initContext();
          this.scheduleNextNote();
        });
      } else {
        this.initContext();
        this.scheduleNextNote();
      }
    }

    stop() {
      this.isPlaying = false;
      this.updateUI();
      if (this.noteTimer) {
        clearTimeout(this.noteTimer);
        this.noteTimer = null;
      }
      if (this.audioEl) {
        this.audioEl.pause();
      }
    }

    toggle() {
      if (this.isPlaying) {
        this.stop();
      } else {
        this.start();
      }
    }

    updateUI() {
      if (!this.toggleBtn || !this.labelEl) return;
      this.toggleBtn.setAttribute('aria-pressed', String(this.isPlaying));
      this.labelEl.textContent = this.isPlaying ? 'Musik: Menyala' : 'Musik: Mati';
    }
  }

  const musicController = new BirthdayMusicController(bgAudioElement, musicToggleBtn, musicLabel);

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
      musicController.toggle();
    });
  }

  // --- Confetti & Pastel Balloons Celebration ---
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let confettiPieces = [];
  let confettiAnimId = null;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function launchConfetti(particleCount = 95) {
    if (!ctx || !canvas) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const palette = ['#d4af37', '#f3e5ab', '#e8b4b8', '#dca194', '#fff5e4', '#c97b84'];
    for (let i = 0; i < particleCount; i++) {
      confettiPieces.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 180,
        y: canvas.height * 0.55,
        vx: (Math.random() - 0.5) * 13,
        vy: -(Math.random() * 12 + 5),
        size: Math.random() * 8 + 5,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        gravity: 0.24,
        opacity: 1,
        shape: Math.random() > 0.35 ? 'rect' : 'circle'
      });
    }

    if (!confettiAnimId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiPieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      if (p.y > canvas.height * 0.75) {
        p.opacity -= 0.025;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      }
      ctx.restore();
    });

    confettiPieces = confettiPieces.filter((p) => p.opacity > 0 && p.y < canvas.height + 40);

    if (confettiPieces.length > 0) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiAnimId = null;
    }
  }

  // --- Book Page Navigation Engine ---
  function goToPage(targetIndex) {
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    if (targetIndex > 0 && !isBookUnlocked) return;

    currentPageIndex = targetIndex;
    musicController.playPageFlipSound();

    pages.forEach((page, idx) => {
      page.classList.remove('is-active', 'is-flipped', 'is-upcoming');

      if (idx === currentPageIndex) {
        page.classList.add('is-active');
        page.removeAttribute('inert');
        page.setAttribute('aria-hidden', 'false');
      } else if (idx < currentPageIndex) {
        page.classList.add('is-flipped');
        page.setAttribute('inert', '');
        page.setAttribute('aria-hidden', 'true');
      } else {
        page.classList.add('is-upcoming');
        page.setAttribute('inert', '');
        page.setAttribute('aria-hidden', 'true');
      }
    });

    // Update top counter pill
    if (pageCounterText) {
      if (currentPageIndex === 0) {
        pageCounterText.textContent = 'Sampul Buku';
      } else if (currentPageIndex === pages.length - 1) {
        pageCounterText.textContent = 'Halaman Penutup';
      } else {
        pageCounterText.textContent = `Lembar ${currentPageIndex} dari ${pages.length - 1}`;
      }
    }

    // Move focus to the active page heading for screen reader & keyboard clarity
    const activeHeading = pages[currentPageIndex].querySelector('[data-page-heading]');
    if (activeHeading) {
      setTimeout(() => {
        activeHeading.focus({ preventScroll: true });
      }, 320);
    }
  }

  // Attach Next / Prev button listeners
  document.querySelectorAll('[data-nav-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToPage(currentPageIndex + 1);
    });
  });

  document.querySelectorAll('[data-nav-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToPage(currentPageIndex - 1);
    });
  });

  const restartBookBtn = document.getElementById('restart-book-btn');
  if (restartBookBtn) {
    restartBookBtn.addEventListener('click', () => {
      goToPage(1);
    });
  }

  // --- Step 1 & 2: Gate Quiz Validation ("Annisa") ---
  function isAnswerAnnisa(rawVal) {
    const cleaned = rawVal.trim().toLowerCase();
    return cleaned === 'annisa' || cleaned.includes('annisa');
  }

  function showGateError(message) {
    if (!nameInput || !gateFeedback) return;
    nameInput.setAttribute('aria-invalid', 'true');
    gateFeedback.textContent = message;
    gateFeedback.className = 'gate-feedback is-error';
    if (liveAnnouncer) {
      liveAnnouncer.textContent = message;
    }
  }

  function clearGateError() {
    if (!nameInput || !gateFeedback) return;
    nameInput.removeAttribute('aria-invalid');
    if (gateFeedback.classList.contains('is-error')) {
      gateFeedback.textContent = '';
      gateFeedback.className = 'gate-feedback';
    }
  }

  if (nameInput) {
    // Clear error state immediately while typing (Forms best practice)
    nameInput.addEventListener('input', () => {
      clearGateError();
    });

    // Validate on blur if non-empty
    nameInput.addEventListener('blur', () => {
      const val = nameInput.value.trim();
      if (val.length > 0 && !isAnswerAnnisa(val)) {
        showGateError('Hmm, belum tepat nih. Coba ketik nama panggilan: Annisa ✨');
      }
    });
  }

  if (gateForm) {
    gateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!nameInput) return;

      const value = nameInput.value;
      if (!value.trim()) {
        showGateError('Isi dulu yaa namanya sebelum membuka buku ini 😊');
        nameInput.focus();
        return;
      }

      if (!isAnswerAnnisa(value)) {
        showGateError('Hmm, sepertinya bukan itu namanya. Petunjuk: namanya "Annisa" 🌸');
        nameInput.focus();
        return;
      }

      // Correct Answer -> Celebrate & Open Book!
      clearGateError();
      isBookUnlocked = true;
      if (gateSubmitBtn) {
        gateSubmitBtn.disabled = true;
      }

      const successMsg = 'Yeah kamu orang yang tepat ! ✨';
      if (gateFeedback) {
        gateFeedback.textContent = successMsg;
        gateFeedback.className = 'gate-feedback is-success';
      }
      if (liveAnnouncer) {
        liveAnnouncer.textContent = successMsg;
      }

      // Start warm music & launch confetti
      musicController.start();
      launchConfetti(110);

      // Flip automatically to Page 2 ("Happy Birthday Annisa") after enjoying the message
      setTimeout(() => {
        goToPage(1);
      }, 1500);
    });
  }

  // --- Step 6: Interactive Gift Box Unwrapping ---
  if (giftBoxBtn) {
    giftBoxBtn.addEventListener('click', () => {
      if (isGiftOpened) return;
      isGiftOpened = true;

      giftBoxBtn.setAttribute('aria-expanded', 'true');
      if (giftTapBadge) {
        giftTapBadge.textContent = 'Hadiah Terbuka! 🎉';
      }
      if (giftMessageCard) {
        giftMessageCard.classList.add('is-revealed');
        giftMessageCard.removeAttribute('aria-hidden');
      }
      if (giftNextBtn) {
        giftNextBtn.removeAttribute('disabled');
      }

      launchConfetti(65);
      if (liveAnnouncer) {
        liveAnnouncer.textContent = 'Kado terbuka! Sebagai bentuk biar jadi teman lagi, terima hadiahnya ygy.';
      }
    });
  }
});
