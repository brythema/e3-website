/* ==========================================================================
   E³ — Motion engine
   Pure vanilla JS, no dependencies. Every feature is additive: if this file
   is missing or fails, the page still renders and reads correctly.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reduceQuery.matches;

  /* ---------------------------------------------------------------- helpers */
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const rad = d => (d * Math.PI) / 180;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ============================================================ 1. AMBIENT */
  /* Procedural, non-photographic depth: a slow field of drifting particles
     with constellation links. Abstract, brand-coloured, resolution-proof. */
  function initAmbient() {
    if (reduced()) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'ambient';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = 1;
    canvas.height = 1;
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let parts = [], orbs = [];
    const pointer = { x: -9999, y: -9999 };

    const PALETTE = ['72,216,255', '101,244,195', '155,140,255'];

    function build() {
      const area = W * H;
      const cap = W < 760 ? 46 : W < 1200 ? 76 : 104;
      const n = Math.round(clamp(area / 26000, 30, cap));
      parts = [];
      for (let i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.6 + Math.random() * 1.5,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          a: 0.2 + Math.random() * 0.5,
          tw: Math.random() * Math.PI * 2,
          tws: 0.008 + Math.random() * 0.022,
          c: PALETTE[(Math.random() * PALETTE.length) | 0]
        });
      }
      orbs = [];
      for (let i = 0; i < (W < 760 ? 2 : 4); i++) {
        orbs.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (W < 760 ? 90 : 150) + Math.random() * 130,
          vx: (Math.random() - 0.5) * 0.07,
          vy: (Math.random() - 0.5) * 0.07,
          a: 0.05 + Math.random() * 0.06,
          c: PALETTE[(Math.random() * PALETTE.length) | 0]
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      /* the layout viewport, not window.innerWidth: the latter includes the
         scrollbar and would make the canvas wider than the document */
      W = document.documentElement.clientWidth || window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    resize();
    let rt = null;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(resize, 180);
    }, { passive: true });

    window.addEventListener('pointermove', e => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      pointer.x = pointer.y = -9999;
    }, { passive: true });

    let visible = true;
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden;
    });

    const LINK = W < 760 ? 92 : 122;

    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);

      /* soft drifting light orbs */
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r) o.x = W + o.r; else if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r; else if (o.y > H + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, 'rgba(' + o.c + ',' + o.a + ')');
        g.addColorStop(1, 'rgba(' + o.c + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* constellation links */
      ctx.lineWidth = 0.6;
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const d = Math.sqrt(d2);
          const al = (1 - d / LINK) * 0.16;
          if (al < 0.02) continue;
          ctx.strokeStyle = 'rgba(72,216,255,' + al.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      /* particles */
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        p.tw += p.tws;
        if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
        if (p.y < -6) p.y = H + 6; else if (p.y > H + 6) p.y = -6;

        /* gentle pointer repulsion makes the field feel alive */
        const pdx = p.x - pointer.x, pdy = p.y - pointer.y;
        const pd2 = pdx * pdx + pdy * pdy;
        let ox = 0, oy = 0;
        if (pd2 < 16000 && pd2 > 0.01) {
          const pd = Math.sqrt(pd2);
          const f = (1 - pd / 126) * 16;
          ox = (pdx / pd) * f;
          oy = (pdy / pd) * f;
        }
        const alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
        ctx.fillStyle = 'rgba(' + p.c + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ====================================================== 2. ORBITAL SYMBOL */
  /* Four labelled orbits turning around the E³ core. Nodes ride their ring,
     an energy pulse travels core -> node, and each node lights on arrival. */
  function initOrbit() {
    const stage = document.querySelector('[data-orbit]');
    if (!stage) return;
    const svg = stage.querySelector('.orbit-svg');
    const nodes = Array.from(stage.querySelectorAll('[data-orbit-node]'));
    if (!svg || !nodes.length) return;

    const NS = 'http://www.w3.org/2000/svg';

    /* Each node gets its own tilted ellipse. phi is fixed per node so the
       four labels stay spread out; period/dir drive the motion. */
    const RINGS = [
      { phi: -16, rxf: 0.84, ryf: 0.78, period: 24, dir: 1,  phase: 205, accent: '#48d8ff' },
      { phi: 28,  rxf: 0.80, ryf: 0.74, period: 29, dir: -1, phase: 14,  accent: '#65f4c3' },
      { phi: 152, rxf: 0.86, ryf: 0.80, period: 34, dir: 1,  phase: 122, accent: '#9b8cff' },
      { phi: 196, rxf: 0.78, ryf: 0.72, period: 27, dir: -1, phase: 296, accent: '#f4c56a' }
    ];

    const groups = [], guides = [], progPaths = [], beams = [];
    let box = { w: 100, h: 100 }, CX = 50, CY = 50, UNIT = 50;

    /* --- build the SVG skeleton (geometry filled in by layout()) --- */
    nodes.forEach((node, i) => {
      const accent = node.dataset.color || RINGS[i].accent;

      const g = document.createElementNS(NS, 'g');
      const track = document.createElementNS(NS, 'ellipse');
      track.setAttribute('class', 'ring');
      track.setAttribute('stroke', i === 2 ? 'rgba(155,140,255,.2)' : 'rgba(72,216,255,.19)');
      const prog = document.createElementNS(NS, 'ellipse');
      prog.setAttribute('class', 'ring-fill');
      prog.setAttribute('stroke', accent);
      prog.style.animationDuration = (7 + i * 1.7) + 's';
      prog.style.animationDelay = (-i * 1.4) + 's';
      g.appendChild(track);
      g.appendChild(prog);
      svg.appendChild(g);
      groups.push(g);
      guides.push([track, prog]);
      progPaths.push(prog);

      const beam = document.createElementNS(NS, 'line');
      beam.setAttribute('class', 'beam');
      beam.setAttribute('stroke', accent);
      beam.style.animationDelay = (-i * 3) + 's';

      const core = document.createElementNS(NS, 'line');
      core.setAttribute('class', 'beam-core');
      core.setAttribute('stroke', accent);
      core.setAttribute('opacity', '0');

      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('class', 'pulse-dot');
      dot.setAttribute('r', '0.9');
      dot.setAttribute('opacity', '0');

      svg.appendChild(beam);
      svg.appendChild(core);
      svg.appendChild(dot);
      beams.push(beam);
      node._beam = beam;
      node._core = core;
      node._dot = dot;
    });

    /* hub rings at the centre */
    const hubTrack = document.createElementNS(NS, 'circle');
    hubTrack.setAttribute('class', 'hub');
    hubTrack.setAttribute('stroke', 'rgba(101,244,195,.4)');
    svg.appendChild(hubTrack);
    const hubInner = document.createElementNS(NS, 'circle');
    hubInner.setAttribute('class', 'hub');
    hubInner.setAttribute('stroke', 'rgba(101,244,195,.24)');
    svg.appendChild(hubInner);

    /* ################ layout: measure, derive radii, guarantee a fit ####### */
    function layout() {
      const r = stage.getBoundingClientRect();
      const w = r.width || 320, h = r.height || w;
      box = { w: w, h: h };
      CX = w / 2; CY = h / 2;
      UNIT = Math.min(w, h) / 2;

      svg.setAttribute('viewBox', '0 0 ' + w.toFixed(1) + ' ' + h.toFixed(1));
      svg.setAttribute('width', w.toFixed(1));
      svg.setAttribute('height', h.toFixed(1));

      hubTrack.setAttribute('cx', CX); hubTrack.setAttribute('cy', CY);
      hubTrack.setAttribute('r', (UNIT * 0.075).toFixed(2));
      hubInner.setAttribute('cx', CX); hubInner.setAttribute('cy', CY);
      hubInner.setAttribute('r', (UNIT * 0.125).toFixed(2));

      /* Sizes are read first so the radii below can respect the card. */
      nodeMetrics();
      measureCard();

      nodes.forEach((node, i) => {
        const ring = RINGS[i];
        const nw = node.offsetWidth || 100;
        const nh = node.offsetHeight || 40;
        const hx = nw / 2, hy = nh / 2;

        /* Clearance floor: the closest point of an orbit to the centre is its
           smaller semi-axis, so that value must exceed the card's reach plus
           this label's own size. This is what keeps the core message readable. */
        const floor = cardHalf() + Math.sqrt(hx * hx + hy * hy) + 10;

        let a = Math.max(ring.rxf * UNIT, floor);
        let b = Math.max(ring.ryf * UNIT, floor);

        /* The tilted ellipse must still fit its frame; shrink only down to the
           clearance floor, then let the per-frame clamp handle the margins. */
        const c = Math.cos(ring.phi * Math.PI / 180), s = Math.sin(ring.phi * Math.PI / 180);
        const limX = Math.max(floor, w / 2 - hx - 4);
        const limY = Math.max(floor, h / 2 - hy - 4);
        const extX = Math.abs(a * c) + Math.abs(b * s);
        const extY = Math.abs(a * s) + Math.abs(b * c);
        if (extX > limX && extX > 0) { const k = limX / extX; a *= k; b *= k; }
        if (extY > limY && extY > 0) { const k = limY / extY; a *= k; b *= k; }
        if (Math.min(a, b) < floor) { const k = floor / Math.min(a, b); a *= k; b *= k; }

        ring.rx = a;
        ring.ry = b;

        guides[i].forEach(g => {
          g.setAttribute('cx', CX); g.setAttribute('cy', CY);
          g.setAttribute('rx', ring.rx.toFixed(2));
          g.setAttribute('ry', ring.ry.toFixed(2));
        });
        groups[i].setAttribute('transform', 'rotate(' + ring.phi + ' ' + CX + ' ' + CY + ')');
      });

    }

    /* Cache node half-extents (they change with breakpoint + font load). */
    let mets = [];
    function nodeMetrics() {
      mets = nodes.map(n => {
        const hx = (n.offsetWidth || 100) / 2;
        const hy = (n.offsetHeight || 40) / 2;
        return { hx: hx, hy: hy, r: Math.sqrt(hx * hx + hy * hy) };
      });
    }

    /* The core card keeps the centre. A label is pushed just far enough along
       its own radial direction to clear the card rectangle, so labels never
       hide behind E³ while staying as close to their orbit as possible. */
    let cardBox = { hx: 60, hy: 56 };
    function measureCard() {
      const card = stage.querySelector('.core-card');
      if (!card) { cardBox = { hx: UNIT * 0.22, hy: UNIT * 0.2 }; return; }
      cardBox = { hx: card.offsetWidth / 2, hy: card.offsetHeight / 2 };
    }
    function cardHalf() {
      return Math.sqrt(cardBox.hx * cardBox.hx + cardBox.hy * cardBox.hy);
    }

    stage.classList.add('is-riding');
    layout();

    const PULSE_CYCLE = 3.2;
    const PULSE_OFF = 0.72;
    let clock = 0, last = 0, running = true;

    function place(t) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ring = RINGS[i];
        const theta = (ring.phase * Math.PI / 180) + ring.dir * ((t * Math.PI * 2) / ring.period);
        const u = ring.rx * Math.cos(theta);
        const v = ring.ry * Math.sin(theta);
        const c = Math.cos(ring.phi * Math.PI / 180), s = Math.sin(ring.phi * Math.PI / 180);
        let x = CX + (u * c - v * s);
        let y = CY + (u * s + v * c);

        const m = mets[i] || { hx: 50, hy: 20, r: 54 };

        /* Guard 1: never let a label sit over the E³ core card.
           A label is only ever pushed sideways, and by an amount that ramps
           smoothly with how much it vertically overlaps the card, so the
           motion stays continuous instead of snapping. */
        const vOverlap = cardBox.hy + m.hy - Math.abs(y - CY);
        /* The push ramps in a band that ENDS where the boxes first touch, so the
           label is already fully clear before any real overlap could occur:
           at vOverlap = 0 the ramp is complete (t = 1). Motion therefore stays
           continuous while the guarantee stays absolute. */
        const band = Math.max(18, m.hy * 1.15);
        const ramp = clamp((vOverlap + band) / band, 0, 1);
        if (ramp > 0) {
          const need = cardBox.hx + m.hx + 6;      /* centres must differ this much in x */
          const ax = Math.abs(x - CX);
          if (ax < need) {
            const eased = ramp * ramp * (3 - 2 * ramp);
            x = CX + (x >= CX ? 1 : -1) * (ax + (need - ax) * eased);
          }
        }

        /* Guard 2: never let a label escape the frame. */
        x = Math.min(Math.max(x, m.hx + 4), box.w - m.hx - 4);
        y = Math.min(Math.max(y, m.hy + 4), box.h - m.hy - 4);

        const depth = (y - CY) / (ring.ry || 1);          /* -1 .. 1 */
        const scale = 0.84 + 0.2 * ((depth + 1) / 2);
        const op = 0.6 + 0.4 * ((depth + 1) / 2);

        node.style.setProperty('--px', x.toFixed(2) + 'px');
        node.style.setProperty('--py', y.toFixed(2) + 'px');
        node.style.setProperty('--ns', scale.toFixed(3));
        node.style.opacity = op.toFixed(3);
        node.style.zIndex = depth > 0.1 ? 6 : 3;   /* always below the core card (z 9) */

        node._beam.setAttribute('x1', CX); node._beam.setAttribute('y1', CY);
        node._beam.setAttribute('x2', x.toFixed(2)); node._beam.setAttribute('y2', y.toFixed(2));
        node._beam.setAttribute('opacity', (0.22 + 0.3 * ((depth + 1) / 2)).toFixed(3));

        const u2 = ((t / PULSE_CYCLE) + (i * PULSE_OFF) / PULSE_CYCLE) % 1;
        let p = 0, glow = 0;
        if (u2 < 0.6) { p = easeOut(u2 / 0.6); glow = p; }
        else { glow = 1 - (u2 - 0.6) / 0.4; }
        glow = clamp(glow, 0, 1);
        const g2 = glow * glow;

        node.style.setProperty('--glow', g2.toFixed(3));
        node.classList.toggle('is-live', g2 > 0.55);
        node._core.setAttribute('opacity', (g2 * 0.5).toFixed(3));

        if (u2 < 0.6) {
          node._dot.setAttribute('cx', (CX + (x - CX) * p).toFixed(2));
          node._dot.setAttribute('cy', (CY + (y - CY) * p).toFixed(2));
          node._dot.setAttribute('opacity', (0.25 + 0.75 * p).toFixed(3));
          node._dot.setAttribute('r', (0.6 + 0.5 * p).toFixed(2));
        } else {
          node._dot.setAttribute('opacity', '0');
        }
      }
    }

    function loop(now) {
      requestAnimationFrame(loop);
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!running || document.hidden || reduced()) return;
      clock += dt;
      place(clock);
    }

    place(0);
    if (reduced()) nodes.forEach(n => n.style.setProperty('--glow', '0'));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        entries.forEach(e => { running = e.isIntersecting; });
      }, { threshold: 0.04 }).observe(stage);
    }

    if (!reduced()) requestAnimationFrame(loop);

    /* Re-measure when the box, the breakpoint or the webfont changes. */
    let rTimer = null;
    const relayout = () => {
      nodeMetrics();
      measureCard();
      layout();
      place(reduced() ? 0 : clock);
    };
    window.addEventListener('resize', () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(relayout, 140);
    }, { passive: true });

    if (window.ResizeObserver) {
      let first = true;
      new ResizeObserver(() => {
        if (first) { first = false; return; }
        clearTimeout(rTimer);
        rTimer = setTimeout(relayout, 140);
      }).observe(stage);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(relayout);
    }

  }

  /* ================================================== 3. SIGNAL MARQUEE */
  /* Duplicate the track so the loop is seamless; speed follows its width. */
  function initMarquee() {
    const track = document.querySelector('.signal-track');
    if (!track || track.dataset.ready === '1') return;
    const inner = track.innerHTML.trim();
    if (!inner) return;
    track.innerHTML =
      '<div class="signal-group">' + inner + '</div>' +
      '<div class="signal-group" aria-hidden="true">' + inner + '</div>';
    track.dataset.ready = '1';
    const width = track.scrollWidth / 2;
    const speed = window.innerWidth < 720 ? 34 : 52;  /* px per second */
    track.style.setProperty('--marquee', clamp(width / speed, 18, 70).toFixed(1) + 's');
    track.classList.add('is-marquee');
  }

  /* ============================================== 4. SCROLL & ENTRANCE */
  function initScroll() {
    /* sticky header state */
    const header = document.querySelector('.site-header');
    if (header) {
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          header.classList.toggle('is-stuck', window.scrollY > 12);
          ticking = false;
        });
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* sequential staggering: each group of siblings counts up its own index */
    const groups = new Map();
    document.querySelectorAll('.reveal').forEach(el => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, 0);
      const i = groups.get(parent);
      groups.set(parent, i + 1);
      if (!el.style.getPropertyValue('--i')) {
        el.style.setProperty('--i', String(Math.min(i, 6)));
      }
    });

    /* alternating depth for grid children, so sections don't feel uniform */
    document.querySelectorAll('.door-grid, .build-grid, .principles-grid, .audience-grid, .feature-grid, .insight-grid')
      .forEach(grid => {
        Array.from(grid.children).forEach((child, i) => {
          if (i % 3 === 1) child.classList.add('reveal-zoom');
        });
      });

    /* a few directional entrances */
    document.querySelectorAll('.two-col > .reveal').forEach((el, i) => {
      if (!el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) {
        el.classList.add(i % 2 ? 'reveal-right' : 'reveal-left');
      }
    });

    const items = Array.from(document.querySelectorAll('.reveal'));
    const show = el => {
      if (el.classList.contains('show')) return;
      el.classList.add('show');
      countUp(el);
    };

    if ('IntersectionObserver' in window) {
      /* threshold 0 + no negative margin: an element is revealed as soon as any
         sliver of it is in view, so nothing can be left stranded off-screen. */
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          io.unobserve(entry.target);
        });
      }, { threshold: 0 });
      items.forEach(el => io.observe(el));

      /* Safety sweep: if anything is visibly on screen but still awaiting its
         turn (fast scrolling, anchor jumps, restored scroll positions, bfcache),
         reveal it. This makes the reveal state self-healing rather than relying
         on the observer having fired for every element. */
      let sweepTimer = null;
      const sweep = () => {
        sweepTimer = null;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        items.forEach(el => {
          if (el.classList.contains('show')) return;
          const r = el.getBoundingClientRect();
          /* Reveal anything the reader has reached OR already scrolled past.
             Using only "currently visible" here would permanently strand an
             element that the observer happened to miss during a fast scroll. */
          if (r.top < vh) { show(el); io.unobserve(el); }
        });
      };
      /* Debounced with setTimeout rather than requestAnimationFrame: rAF can be
         throttled or paused (background tab, busy main thread) and a queued
         frame may never arrive, which would strand every later call. A timer
         always fires, so the safety net can never get stuck. */
      const queueSweep = () => {
        if (sweepTimer !== null) return;
        sweepTimer = setTimeout(sweep, 80);
      };
      window.addEventListener('scroll', queueSweep, { passive: true });
      window.addEventListener('resize', queueSweep, { passive: true });
      window.addEventListener('pageshow', queueSweep);
      window.addEventListener('hashchange', () => setTimeout(queueSweep, 60));
      /* The engine also re-checks shortly after load and on a slow heartbeat,
         which covers lazy layout shifts and late webfont reflow. */
      setTimeout(queueSweep, 120);
      setTimeout(queueSweep, 600);
      const beat = setInterval(() => {
        if (document.hidden) return;
        queueSweep();
        if (items.every(el => el.classList.contains('show'))) clearInterval(beat);
      }, 1500);
    } else {
      items.forEach(el => show(el));
    }

    /* board rows get their own cadence */
    document.querySelectorAll('.board-row').forEach((row, i) => {
      row.style.setProperty('--i', String(i));
    });
    const board = document.querySelector('.problem-board');
    if (board && 'IntersectionObserver' in window) {
      const bio = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { board.classList.add('show'); bio.unobserve(board); }
        });
      }, { threshold: 0.25 });
      bio.observe(board);
    } else if (board) {
      board.classList.add('show');
    }

    /* small indexed numbers tick up once */
    function countUp(scope) {
      if (reduced()) return;
      const targets = scope.matches('.journey-step, .vertical-step, .build-item, .feature-card, .principle, .quick')
        ? [scope] : Array.from(scope.querySelectorAll('.journey-step, .vertical-step'));
      targets.forEach(el => {
        const badge = el.querySelector(':scope > span');
        if (!badge) return;
        const raw = (badge.textContent || '').trim();
        if (!/^\d{1,2}$/.test(raw)) return;
        const end = parseInt(raw, 10);
        let start = null;
        const dur = 620;
        const step = now => {
          if (start === null) start = now;
          const t = clamp((now - start) / dur, 0, 1);
          badge.textContent = String(Math.round(end * easeOut(t))).padStart(raw.length, '0');
          if (t < 1) requestAnimationFrame(step);
          else badge.textContent = raw;
        };
        requestAnimationFrame(step);
      });
    }
  }

  /* ================================================== 5. CARD SPOTLIGHT */
  function initSpotlight() {
    if (reduced() || window.matchMedia('(hover: none)').matches) return;
    const cards = document.querySelectorAll(
      '.door-card, .build-item, .feature-card, .principle, .audience-card'
    );
    cards.forEach(card => {
      let queued = false, mx = 0, my = 0;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width) * 100;
        my = ((e.clientY - r.top) / r.height) * 100;
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          card.style.setProperty('--mx', mx.toFixed(2) + '%');
          card.style.setProperty('--my', my.toFixed(2) + '%');
          queued = false;
        });
      }, { passive: true });
    });
  }

  /* =================================================== 6. THEME ACCENTS */
  /* Give each orbital node the accent of the world it points at, so the
     symbol reads as "one E³, many doors". */
  function tintNodes() {
    const stage = document.querySelector('[data-orbit]');
    if (!stage || stage.dataset.tinted === '1') return;
    stage.dataset.tinted = '1';
  }

  /* ============================================================= 7. BOOT */
  function boot() {
    /* let the bootstrap know the engine is alive */
    window.__e3MotionReady = true;
    try { initAmbient(); } catch (e) { /* ambient is optional */ }
    try { initOrbit(); } catch (e) { /* fallback arrangement stays */ }
    try { initMarquee(); } catch (e) { /* plain row stays */ }
    try { initScroll(); } catch (e) { /* content stays visible */ }
    try { initSpotlight(); } catch (e) { /* hover stays simple */ }
    tintNodes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* If the visitor flips reduced-motion mid-session, settle the symbol. */
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener('change', () => {
      if (reduced()) {
        const stage = document.querySelector('[data-orbit]');
        if (stage) stage.querySelectorAll('[data-orbit-node]').forEach(n => {
          n.style.setProperty('--glow', '0');
          n.style.opacity = '1';
        });
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));
      }
    });
  }
})();
