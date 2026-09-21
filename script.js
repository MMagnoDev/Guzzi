/**
 * GUZZI COLLECTION — Apresentação da Marca
 * Lenis Smooth Scroll + Parallax Hero + Reveal on Scroll
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. LENIS SMOOTH SCROLL INITIALIZATION
  // --------------------------------------------------------------------------
  let lenis = null;

  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // --------------------------------------------------------------------------
  // 2. PARALLAX EFFECTS — HERO (background-position) + ABOUT IMAGE (transform)
  // --------------------------------------------------------------------------
  const heroParallax = document.getElementById('heroParallax');
  const heroSection  = document.getElementById('hero');
  const aboutImg     = document.querySelector('.about-split-img');
  const aboutSection = document.getElementById('about');

  // Use a subtle speed; background-position parallax on mobile is very smooth
  const HERO_PARALLAX_SPEED = 0.22;

  function updateHeroParallax(scrollY) {
    if (!heroParallax || !heroSection) return;
    if (scrollY > heroSection.offsetHeight * 1.5) return;
    // Shift the background upward (smaller % = higher up) as page scrolls
    // We only animate Y; X stays fixed per breakpoint CSS
    const pct = Math.max(0, 18 - scrollY * 0.018);
    heroParallax.style.backgroundPositionY = `${pct.toFixed(2)}%`;
  }

  function updateAboutParallax(scrollY) {
    if (!aboutImg || !aboutSection) return;
    const rect = aboutSection.getBoundingClientRect();
    const vh   = window.innerHeight;
    if (rect.bottom < -100 || rect.top > vh + 100) return;
    const progress = (vh / 2) - (rect.top + rect.height / 2);
    aboutImg.style.transform = `translate3d(0, ${(progress * 0.15).toFixed(2)}px, 0) scale(1.04)`;
  }

  function onScroll(scrollY) {
    updateHeroParallax(scrollY);
    updateAboutParallax(scrollY);
  }

  if (lenis) {
    lenis.on('scroll', (e) => onScroll(e.scroll));
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }
  onScroll(window.scrollY || 0);

  // --------------------------------------------------------------------------
  // 3. REVEAL ON SCROLL (EDITORIAL INTERSECTION OBSERVER)
  // --------------------------------------------------------------------------
  const revealTargets = document.querySelectorAll('.reveal-on-scroll, .reveal-card');

  // Trigger hero reveal elements shortly after page load
  setTimeout(() => {
    const heroElements = heroSection ? heroSection.querySelectorAll('.reveal-on-scroll') : [];
    heroElements.forEach(el => el.classList.add('is-revealed'));
  }, 120);

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealTargets.forEach(el => {
    // Avoid double observing elements inside hero if already triggered
    if (!heroSection || !heroSection.contains(el)) {
      revealObserver.observe(el);
    }
  });

  // --------------------------------------------------------------------------
  // 4. SMOOTH SCROLL FOR ON-PAGE ANCHOR LINKS
  // --------------------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId.length > 1) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(targetElement, {
              offset: 0,
              duration: 1.2,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          } else {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }
    });
  });



  // --------------------------------------------------------------------------
  // 6. INTERACTIVE LOOKBOOK ACCORDION (HOVER ON DESKTOP, TAP ON MOBILE)
  // --------------------------------------------------------------------------
  const lookbook = document.querySelector('.interactive-lookbook');
  const lookbookItems = document.querySelectorAll('.lookbook-item');

  if (lookbook && lookbookItems.length > 0) {
    let activeItem = lookbook.querySelector('.lookbook-item.is-active') || lookbookItems[0];
    const isFinePointer = window.matchMedia('(pointer: fine)');

    lookbookItems.forEach((item) => {
      // Hover only on devices with a mouse/trackpad
      if (isFinePointer.matches) {
        item.addEventListener('mouseenter', () => {
          lookbookItems.forEach(i => i.classList.remove('is-active'));
          item.classList.add('is-active');
        });
      }

      // Tap / Click works seamlessly on all devices
      item.addEventListener('click', (e) => {
        lookbookItems.forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
        activeItem = item;
      });
    });

    if (isFinePointer.matches) {
      lookbook.addEventListener('mouseleave', () => {
        // Return smoothly to the active item on desktop
        lookbookItems.forEach(i => i.classList.remove('is-active'));
        if (activeItem) {
          activeItem.classList.add('is-active');
        } else {
          lookbookItems[0].classList.add('is-active');
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 7. PILARES DA MARCA — TRUE SEAMLESS INFINITE MARQUEE & POINTER/TOUCH DRAG
  // --------------------------------------------------------------------------
  function initConceptCarousel() {
    const conceptGrid = document.getElementById('conceptGrid');
    const viewport = document.querySelector('.carousel-viewport');
    if (!conceptGrid || !viewport) return;

    // Carousel is active on screens <= 768px (all mobile phones and vertical tablets)
    const breakpoint = window.matchMedia('(max-width: 768px)');
    let isActive = false;
    let rafId = null;

    // Movement state
    let currentX = 0;
    let loopWidth = 0;
    const SPEED = 0.55; // Subtle luxury continuous drift (~33px/s at 60fps)

    // Interaction state
    let isDragging = false;
    let isHovered = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let momentumVelocity = 0;
    let hasMoved = false;
    let isHorizontalGesture = null;

    // Original cards reference
    const originalCards = Array.from(conceptGrid.querySelectorAll('.concept-card:not([data-clone])'));
    if (originalCards.length === 0) return;

    // Calculate exact loop width based on actual rendered card positions
    function updateLoopWidth() {
      const firstClone = conceptGrid.querySelector('.concept-card[data-clone="1"]');
      if (firstClone && originalCards[0]) {
        const dist = firstClone.offsetLeft - originalCards[0].offsetLeft;
        if (dist > 0) {
          loopWidth = dist;
        }
      }
    }

    // Keep currentX strictly within (-loopWidth, 0]
    // Because Clone Set 1 is a pixel-identical replica of the original set,
    // wrapping shifts the rendered output by 0 perceptible pixels.
    function wrapX() {
      if (loopWidth <= 0) return;
      while (currentX <= -loopWidth) {
        currentX += loopWidth;
      }
      while (currentX > 0) {
        currentX -= loopWidth;
      }
    }

    function applyTransform() {
      conceptGrid.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
    }

    // Smooth 60fps / 120fps animation loop
    function tick() {
      if (!isActive) return;

      if (!isDragging) {
        if (Math.abs(momentumVelocity) > 0.05) {
          // Natural deceleration after user swipes/flings
          currentX += momentumVelocity;
          momentumVelocity *= 0.92;
          wrapX();
          applyTransform();
        } else {
          momentumVelocity = 0;
          // Auto-scroll when not hovered or being touched
          if (!isHovered) {
            currentX -= SPEED;
            wrapX();
            applyTransform();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    // Pointer event handlers (Universal Touch, Mouse, Pen)
    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;

      isDragging = true;
      hasMoved = false;
      isHorizontalGesture = null;
      momentumVelocity = 0;

      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;

      viewport.style.cursor = 'grabbing';

      try {
        viewport.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    function onPointerMove(e) {
      if (!isDragging) return;

      const clientX = e.clientX;
      const clientY = e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;

      // Determine intention on early movement
      if (isHorizontalGesture === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHorizontalGesture = Math.abs(dx) >= Math.abs(dy);
      }

      // If user is intentionally scrolling vertically, release drag
      if (isHorizontalGesture === false) {
        isDragging = false;
        viewport.style.cursor = '';
        try {
          if (viewport.hasPointerCapture(e.pointerId)) {
            viewport.releasePointerCapture(e.pointerId);
          }
        } catch (err) {}
        return;
      }

      if (Math.abs(dx) > 5) {
        hasMoved = true;
      }

      const now = performance.now();
      const dt = Math.max(now - lastTime, 1);
      const moveDelta = clientX - lastX;

      // Instantaneous velocity normalized to 60fps frame
      const rawVelocity = moveDelta / dt;
      velocity = velocity * 0.35 + (rawVelocity * 16.6) * 0.65;

      currentX += moveDelta;
      wrapX();
      applyTransform();

      lastX = clientX;
      lastTime = now;
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      viewport.style.cursor = '';

      try {
        if (viewport.hasPointerCapture(e.pointerId)) {
          viewport.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}

      // Apply momentum with safe cap
      const MAX_MOMENTUM = 24;
      momentumVelocity = Math.max(-MAX_MOMENTUM, Math.min(MAX_MOMENTUM, velocity));
    }

    function onPointerCancel(e) {
      onPointerUp(e);
    }

    // Suppress accidental clicks after dragging
    viewport.addEventListener('click', (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Pause auto-scroll on hover (useful when reading cards on desktop or mouse)
    viewport.addEventListener('pointerenter', () => { isHovered = true; });
    viewport.addEventListener('pointerleave', () => { isHovered = false; });

    // Attach drag events
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerCancel);

    // Optional trackpad horizontal wheel support
    viewport.addEventListener('wheel', (e) => {
      if (!isActive) return;
      const hDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(hDelta) > 1) {
        currentX -= hDelta * 0.6;
        wrapX();
        applyTransform();
        momentumVelocity = 0;
      }
    }, { passive: true });

    // Lifecycle: activate carousel
    function activate() {
      if (isActive) return;
      isActive = true;

      // Create 2 sets of clones so we have enough content to fill any mobile viewport endlessly
      if (!conceptGrid.querySelector('.concept-card[data-clone]')) {
        // Clone set 1
        originalCards.forEach(card => {
          const clone = card.cloneNode(true);
          clone.setAttribute('data-clone', '1');
          clone.setAttribute('aria-hidden', 'true');
          clone.classList.add('is-revealed');
          conceptGrid.appendChild(clone);
        });
        // Clone set 2
        originalCards.forEach(card => {
          const clone = card.cloneNode(true);
          clone.setAttribute('data-clone', '2');
          clone.setAttribute('aria-hidden', 'true');
          clone.classList.add('is-revealed');
          conceptGrid.appendChild(clone);
        });
      }

      conceptGrid.style.animation = 'none';
      originalCards.forEach(c => c.classList.add('is-revealed'));

      updateLoopWidth();
      requestAnimationFrame(() => {
        updateLoopWidth();
        applyTransform();
      });

      // Recalculate on image loads
      conceptGrid.querySelectorAll('img').forEach(img => {
        if (!img.complete) {
          img.addEventListener('load', updateLoopWidth, { once: true });
        }
      });

      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    }

    // Lifecycle: deactivate carousel (restore standard desktop grid)
    function deactivate() {
      if (!isActive) return;
      isActive = false;

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      conceptGrid.querySelectorAll('.concept-card[data-clone]').forEach(c => c.remove());
      conceptGrid.style.transform = '';
      conceptGrid.style.animation = '';
      viewport.style.cursor = '';
      currentX = 0;
      momentumVelocity = 0;
    }

    function checkBreakpoint() {
      breakpoint.matches ? activate() : deactivate();
    }

    breakpoint.addEventListener('change', checkBreakpoint);
    window.addEventListener('resize', () => {
      if (isActive) {
        updateLoopWidth();
        wrapX();
        applyTransform();
      }
    });

    checkBreakpoint();
  }

  initConceptCarousel();
});


