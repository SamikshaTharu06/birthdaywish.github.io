// configuration
    const TOTAL = 18;
    const stage = document.getElementById('stage');
    const container = document.getElementById('balloon-container');
    const intro = document.getElementById('intro');
    const startBtn = document.getElementById('startBtn');
    const blast = document.getElementById('blast');
    const messages = [
      document.getElementById('m1'),
      document.getElementById('m2'),
      document.getElementById('m3'),
      document.getElementById('m4')
    ];

    // small sample love lines per balloon/year (can be customized)
    const loveLines = Array.from({ length: TOTAL }, (_, i) =>
      `Year ${i + 1} — My love for you grows deeper every day ❤️`
    );

    // audio helper
    function playChime(freq = 880, duration = 0.28) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g); g.connect(ctx.destination);
        const now = ctx.currentTime;
        g.gain.linearRampToValueAtTime(0.12, now + 0.01);
        o.start(now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        o.stop(now + duration + 0.02);
      } catch (e) { }
    }

    // create balloon elements (numbered)
    function makeBalloons() {
      const colors = ['b1', 'b2', 'b3', 'b4', 'b5'];
      for (let i = 1; i <= TOTAL; i++) {
        const b = document.createElement('div');
        b.className = 'balloon ' + colors[i % colors.length];
        const left = 6 + Math.random() * 88; // vw
        b.style.left = left + 'vw';
        b.dataset.index = i;
        b.dataset.year = i;
        b.innerHTML = `<span style="pointer-events:none">${i}</span>`;
        b.style.setProperty('--dur', (10 + Math.random() * 6).toFixed(2) + 's');
        // interaction: show tooltip on hover/touch, pop on click/tap
        b.addEventListener('pointerenter', (e) => showTooltip(b));
        b.addEventListener('pointerleave', hideTooltip);
        b.addEventListener('pointerdown', (e) => {
          // user tapped/clicked balloon -> pop and show love popup
          popBalloon(b, true);
        });
        container.appendChild(b);
      }
    }

    // tooltip element
    let tooltip;
    function showTooltip(b) {
      hideTooltip();
      tooltip = document.createElement('div');
      tooltip.className = 'b-tooltip';
      const idx = +b.dataset.index;
      tooltip.textContent = loveLines[idx - 1];
      document.body.appendChild(tooltip);
      const r = b.getBoundingClientRect();
      tooltip.style.left = (r.left + r.width / 2) + 'px';
      tooltip.style.top = (r.top) + 'px';
      requestAnimationFrame(() => tooltip.classList.add('show'));
    }
    function hideTooltip() {
      if (!tooltip) return;
      tooltip.classList.remove('show');
      setTimeout(() => tooltip.remove(), 240);
      tooltip = null;
    }

    // pop balloon; userTriggered shows a year popup
    function popBalloon(b, userTriggered = false) {
      if (!b || b.classList.contains('popped')) return;
      createPopParticles(b);
      b.classList.add('popped');
      b.style.pointerEvents = 'none';
      if (userTriggered) {
        showYearPopup(+b.dataset.year);
        playChime(920, 0.28);
      } else {
        playChime(720, 0.18);
      }
      setTimeout(() => { try { b.style.display = 'none' } catch (e) { } }, 450);
    }

    // small burst at position of balloon
    function createPopParticles(b) {
      const rect = b.getBoundingClientRect();
      const count = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = (rect.left + rect.width / 2) + 'px';
        p.style.top = (rect.top + rect.height / 2) + 'px';
        p.style.width = (6 + Math.random() * 10) + 'px';
        p.style.height = (8 + Math.random() * 12) + 'px';
        p.style.background = ['#ff6b81', '#ffd166', '#c7f9ff', '#b8a0ff', '#ffd3a5'][Math.floor(Math.random() * 5)];
        p.style.transform = `translate(-50%,-50%) rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(p);
        const dx = (Math.random() - 0.5) * 240;
        const dy = (Math.random() - 0.9) * 200 - 40;
        p.animate([
          { transform: `translate(${0}px,${0}px) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }
        ], { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(.12,.9,.24,1)' });
        setTimeout(() => p.remove(), 1200);
      }
    }

    // show a centered year popup when user pops a balloon
    function showYearPopup(year) {
      const popup = document.createElement('div');
      popup.className = 'year-popup';
      popup.innerHTML = `<div style="font-size:1.05rem">Year ${year}</div><div style="font-size:.95rem;margin-top:.35rem">` +
        (loveLines[year - 1] || 'My love always 💖') + `</div>`;
      document.body.appendChild(popup);
      requestAnimationFrame(() => popup.classList.add('show'));
      setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
      }, 2200);
    }

    // orchestrate rising with pattern: slow -> fast -> slow
    async function startRising() {
      const nodes = Array.from(container.children);
      // pattern: first 6 slow, next 6 fast, last 6 slow (adjust if TOTAL different)
      const groupSize = Math.ceil(nodes.length / 3);
      for (let i = 0; i < nodes.length; i++) {
        const b = nodes[i];
        let baseDelay;
        if (i < groupSize) { // slow
          baseDelay = 500 + Math.random() * 700;
        } else if (i < groupSize * 2) { // fast
          baseDelay = 80 + Math.random() * 180;
        } else { // slow again
          baseDelay = 400 + Math.random() * 600;
        }
        const stagger = i * 120; // small progressive stagger
        const delay = baseDelay + stagger;
        setTimeout(() => {
          // start rising
          b.classList.add('rising');
          // schedule an occasional mid-air pop (some balloons burst in middle)
          const dur = parseFloat(getComputedStyle(b).getPropertyValue('--dur')) * 1000;
          // 35% chance to pop mid-flight
          if (Math.random() < 0.35) {
            setTimeout(() => popBalloon(b, false), dur * 0.45);
          } else {
            // if not popping mid-air, schedule pop at top (as before)
            setTimeout(() => popBalloon(b, false), dur - 150);
          }
        }, delay);
      }

      // wait until all have had time to finish rising/popping
      const maxDur = 16000;
      await new Promise(r => setTimeout(r, nodes.length * 150 + maxDur));
      // bring survivors to center
      await convergeToCenter();
    }

    // bring all balloons back and converge in middle
    async function convergeToCenter() {
      const nodes = Array.from(container.children).filter(n => !n.classList.contains('popped'));
      if (nodes.length === 0) {
        // no survivors -> trigger central blast and messages
        burstCenter();
        return;
      }
      nodes.forEach((b, i) => {
        const rect = b.getBoundingClientRect();
        b.style.position = 'fixed';
        b.style.left = rect.left + 'px';
        b.style.top = rect.top + 'px';
        b.style.bottom = 'auto';
        b.style.transition = 'all .9s cubic-bezier(.2,.9,.2,1)';
        setTimeout(() => {
          b.classList.add('to-center');
        }, i * 80);
      });

      await new Promise(r => setTimeout(r, 1300));
      burstCenter();
    }

    function burstCenter() {
      blast.classList.add('show');
      launchConfetti(48);
      playChime(1040, 0.45);
      setTimeout(() => showMessages(), 900);
      setTimeout(() => blast.classList.remove('show'), 1200);
    }

    function launchConfetti(n = 30) {
      for (let i = 0; i < n; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = (window.innerWidth / 2) + 'px';
        p.style.top = (window.innerHeight / 2) + 'px';
        p.style.width = (6 + Math.random() * 12) + 'px';
        p.style.height = (8 + Math.random() * 12) + 'px';
        p.style.background = ['#ff6b81', '#ffd166', '#c7f9ff', '#b8a0ff', '#ffd3a5', '#a4f9c8'][Math.floor(Math.random() * 6)];
        document.body.appendChild(p);
        const dx = (Math.random() - 0.5) * (window.innerWidth);
        const dy = (Math.random() - 0.2) * (window.innerHeight / 2) * -1;
        p.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], { duration: 1200 + Math.random() * 800, easing: 'cubic-bezier(.15,.9,.24,1)' });
        setTimeout(() => p.remove(), 2200);
      }
    }

    // reveal messages one by one
    async function showMessages() {
      for (let i = 0; i < messages.length; i++) {
        messages[i].classList.add('reveal');
        playChime(520 + i * 80, 0.18);
        await new Promise(r => setTimeout(r, 900));
      }
    }

    // setup and start
    makeBalloons();

    startBtn.addEventListener('click', () => {
      intro.style.display = 'none';
      startRising();
      playChime(720, 0.22);
    });

    startBtn.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') startBtn.click() });

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      intro.style.display = 'none';
      document.querySelectorAll('.balloon').forEach(b => b.style.display = 'none');
      messages.forEach(m => m.classList.add('reveal'));
    }