/**
 * Prerana LiquidGlass UI Engine (Vanilla HTML/CSS/JS)
 * Implements:
 * 1. LiquidGlassSurface (reusable SVG bevel displacement + chromatic aberration + frost + tint)
 * 2. LiquidGlassHeader (variant="floating" | "full", radius=24, bevelDepth=12, scale=36, aberration=4, frost=0.4, tint=0.25)
 * 3. LiquidGlassToggleBar (radius=999, bevelDepth=10, scale=28, aberration=2, tint=0.45 + spring sliding active indicator)
 */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let surfaceCounter = 0;

  function ensureSvgRoot() {
    let svg = document.getElementById('liquid-glass-header-svg');
    if (!svg) {
      svg = document.createElementNS(SVG_NS, 'svg');
      svg.id = 'liquid-glass-header-svg';
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
      const defs = document.createElementNS(SVG_NS, 'defs');
      svg.appendChild(defs);
      document.body.appendChild(svg);
    }
    return svg;
  }

  function supportsSvgBackdropFilter() {
    if (typeof window === 'undefined' || !window.CSS || typeof CSS.supports !== 'function') {
      return false;
    }
    const ua = navigator.userAgent || '';
    const isChromium = (Boolean(window.chrome) || /\b(Chrome|Chromium|Edg|OPR|Brave)\b/i.test(ua))
      && !/\b(Firefox|FxiOS)\b/i.test(ua);
    return isChromium && CSS.supports('backdrop-filter', 'blur(1px)');
  }

  class LiquidGlassSurface {
    constructor(element, options = {}) {
      if (!element) return;
      this.el = element;
      this.instanceId = ++surfaceCounter;

      const ds = element.dataset || {};
      this.variant = options.variant || ds.lgVariant || 'floating';
      const parsedRadius = ds.lgRadius !== undefined ? Number(ds.lgRadius) : options.radius;
      this.radius = Number.isFinite(parsedRadius) ? parsedRadius : (this.variant === 'floating' ? 24 : 0);
      this.bevelDepth = Number.isFinite(Number(options.bevelDepth ?? ds.lgBevelDepth ?? 12))
        ? Number(options.bevelDepth ?? ds.lgBevelDepth ?? 12) : 12;
      this.scale = Number.isFinite(Number(options.scale ?? ds.lgScale ?? 36))
        ? Number(options.scale ?? ds.lgScale ?? 36) : 36;
      this.aberration = Number.isFinite(Number(options.aberration ?? ds.lgAberration ?? 4))
        ? Number(options.aberration ?? ds.lgAberration ?? 4) : 4;
      this.frost = Number.isFinite(Number(options.frost ?? ds.lgFrost ?? 0.4))
        ? Number(options.frost ?? ds.lgFrost ?? 0.4) : 0.4;
      this.tint = Number.isFinite(Number(options.tint ?? ds.lgTint ?? 0.25))
        ? Number(options.tint ?? ds.lgTint ?? 0.25) : 0.25;

      this.filterId = options.filterId || `liquid-glass-filter-${this.instanceId}`;
      this.feImageEl = null;
      this.lastWidth = 0;
      this.lastHeight = 0;
      this.rafId = null;
      this.resizeObserver = null;
      this.onResizeCallback = typeof options.onResize === 'function' ? options.onResize : null;

      this.init();
    }

    init() {
      this.ensureSurfaceLayers();
      this.applyPropsToCSS();
      this.setupSvgFilter();
      this.bindResizeObserver();
      this.scheduleMapUpdate();
    }

    ensureSurfaceLayers() {
      const insertOrder = ['liquid-glass-backdrop', 'liquid-glass-tint', 'liquid-glass-rim'];
      const existingFirst = this.el.firstElementChild;
      let anchor = existingFirst;
      insertOrder.forEach((cls) => {
        if (!this.el.querySelector(`:scope > .${cls}`)) {
          const layer = document.createElement('div');
          layer.className = cls;
          layer.setAttribute('aria-hidden', 'true');
          this.el.insertBefore(layer, anchor || null);
        } else {
          anchor = this.el.querySelector(`:scope > .${cls}`).nextElementSibling;
        }
      });
    }

    applyPropsToCSS(effectiveHeight = 0) {
      let effectiveRadius = this.variant === 'floating' ? this.radius : 0;
      // Softly adapt multi-row/vertical capsule toggle bars so corners never pinch vertically
      if (effectiveRadius >= 900 && effectiveHeight > 68) {
        effectiveRadius = 24;
      }
      this.el.setAttribute('data-lg-variant', this.variant);
      this.el.style.setProperty('--lg-radius', `${effectiveRadius}px`);
      this.el.style.setProperty('--lg-bevel-depth', `${this.bevelDepth}px`);
      this.el.style.setProperty('--lg-frost', String(this.frost));
      this.el.style.setProperty('--lg-frost-blur', `${Math.round(this.frost * 32 * 10) / 10}px`);
      this.el.style.setProperty('--lg-tint', String(this.tint));
      this.el.style.setProperty('--lg-aberration', `${this.aberration}px`);
    }

    setupSvgFilter() {
      if (!supportsSvgBackdropFilter()) return;

      const svg = ensureSvgRoot();
      const defs = svg.querySelector('defs') || svg;
      let filter = document.getElementById(this.filterId);

      if (!filter) {
        filter = document.createElementNS(SVG_NS, 'filter');
        filter.id = this.filterId;
        filter.setAttribute('x', '0%');
        filter.setAttribute('y', '0%');
        filter.setAttribute('width', '100%');
        filter.setAttribute('height', '100%');
        filter.setAttribute('color-interpolation-filters', 'sRGB');

        const feImage = document.createElementNS(SVG_NS, 'feImage');
        feImage.id = `${this.filterId}-img`;
        feImage.setAttribute('x', '0');
        feImage.setAttribute('y', '0');
        feImage.setAttribute('width', '100%');
        feImage.setAttribute('height', '100%');
        feImage.setAttribute('preserveAspectRatio', 'none');
        feImage.setAttribute('result', 'dispMap');
        filter.appendChild(feImage);

        const sRed = Math.max(0, this.scale - this.aberration);
        const sGreen = Math.max(0, this.scale);
        const sBlue = Math.max(0, this.scale + this.aberration);

        const channels = [
          { result: 'dispRed', scale: sRed, matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', isolated: 'rOnly' },
          { result: 'dispGreen', scale: sGreen, matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', isolated: 'gOnly' },
          { result: 'dispBlue', scale: sBlue, matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', isolated: 'bOnly' }
        ];

        channels.forEach((ch) => {
          const disp = document.createElementNS(SVG_NS, 'feDisplacementMap');
          disp.setAttribute('in', 'SourceGraphic');
          disp.setAttribute('in2', 'dispMap');
          disp.setAttribute('scale', String(ch.scale));
          disp.setAttribute('xChannelSelector', 'R');
          disp.setAttribute('yChannelSelector', 'G');
          disp.setAttribute('result', ch.result);
          filter.appendChild(disp);

          const cm = document.createElementNS(SVG_NS, 'feColorMatrix');
          cm.setAttribute('type', 'matrix');
          cm.setAttribute('in', ch.result);
          cm.setAttribute('values', ch.matrix);
          cm.setAttribute('result', ch.isolated);
          filter.appendChild(cm);
        });

        const blendRG = document.createElementNS(SVG_NS, 'feBlend');
        blendRG.setAttribute('in', 'rOnly');
        blendRG.setAttribute('in2', 'gOnly');
        blendRG.setAttribute('mode', 'screen');
        blendRG.setAttribute('result', 'rgOut');
        filter.appendChild(blendRG);

        const blendRGB = document.createElementNS(SVG_NS, 'feBlend');
        blendRGB.setAttribute('in', 'rgOut');
        blendRGB.setAttribute('in2', 'bOnly');
        blendRGB.setAttribute('mode', 'screen');
        blendRGB.setAttribute('result', 'rgbOut');
        filter.appendChild(blendRGB);

        defs.appendChild(filter);
      }

      this.feImageEl = document.getElementById(`${this.filterId}-img`);
      this.el.style.setProperty('--lg-filter-url', `url(#${this.filterId})`);
    }

    bindResizeObserver() {
      if (typeof ResizeObserver === 'function') {
        this.resizeObserver = new ResizeObserver(() => this.scheduleMapUpdate());
        this.resizeObserver.observe(this.el);
      }
      this._onWinResize = () => this.scheduleMapUpdate();
      window.addEventListener('resize', this._onWinResize, { passive: true });
    }

    scheduleMapUpdate() {
      if (this.rafId) return;
      this.rafId = window.requestAnimationFrame(() => {
        this.rafId = null;
        this.updateDisplacementMap();
      });
    }

    updateDisplacementMap() {
      const rect = this.el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width <= 0 || height <= 0) return;

      this.applyPropsToCSS(height);
      if (this.onResizeCallback) {
        this.onResizeCallback();
      }

      if (!this.feImageEl) return;
      if (Math.abs(width - this.lastWidth) <= 1 && Math.abs(height - this.lastHeight) <= 1) return;

      this.lastWidth = width;
      this.lastHeight = height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      let effectiveRadius = this.variant === 'floating' ? this.radius : 0;
      if (effectiveRadius >= 900 && height > 68) effectiveRadius = 24;

      const r = Math.min(effectiveRadius, width / 2, height / 2);
      const bevel = Math.max(1, Math.min(this.bevelDepth, height / 2));
      const halfW = width / 2;
      const halfH = height / 2;
      const rx = Math.max(0, halfW - r);
      const ry = Math.max(0, halfH - r);

      for (let y = 0; y < height; y++) {
        const dySigned = y - halfH;
        const py = Math.abs(dySigned);
        const qy = Math.max(py - ry, 0);
        const sy = dySigned >= 0 ? 1 : -1;

        for (let x = 0; x < width; x++) {
          const dxSigned = x - halfW;
          const px = Math.abs(dxSigned);
          const qx = Math.max(px - rx, 0);
          const sx = dxSigned >= 0 ? 1 : -1;

          const distOutside = Math.hypot(qx, qy) + Math.min(Math.max(px - rx, py - ry), 0) - r;
          const distInside = -distOutside;
          const idx = (y * width + x) * 4;

          if (distInside <= 0 || distInside >= bevel) {
            data[idx] = 128;
            data[idx + 1] = 128;
            data[idx + 2] = 128;
            data[idx + 3] = 255;
            continue;
          }

          const edgeT = 1 - distInside / bevel;
          const curved = Math.pow(Math.sin(edgeT * Math.PI * 0.5), 1.35);

          let nx = 0;
          let ny = 0;
          if (qx > 0 || qy > 0) {
            const len = Math.hypot(qx, qy) || 1;
            nx = sx * (qx / len);
            ny = sy * (qy / len);
          } else if (px - rx > py - ry) {
            nx = sx;
          } else {
            ny = sy;
          }

          data[idx] = Math.max(0, Math.min(255, Math.round(128 + nx * curved * 127)));
          data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + ny * curved * 127)));
          data[idx + 2] = 128;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      this.feImageEl.setAttribute('href', dataUrl);
      this.feImageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
      this.el.setAttribute('data-lg-svg-ready', 'true');
    }

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this._onWinResize) {
        window.removeEventListener('resize', this._onWinResize);
      }
      if (this.rafId) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  class LiquidGlassHeader extends LiquidGlassSurface {
    constructor(element, options = {}) {
      super(element, {
        variant: 'floating',
        radius: 24,
        bevelDepth: 12,
        scale: 36,
        aberration: 4,
        frost: 0.4,
        tint: 0.25,
        filterId: 'liquid-glass-header-filter',
        ...options
      });
    }
  }

  class LiquidGlassToggleBar {
    constructor(element, options = {}) {
      if (!element) return;
      this.el = element;
      this.indicator = null;
      this.mutationObserver = null;
      this.syncRaf = null;

      this.el.classList.add('lg-toggle-bar');
      this.surface = new LiquidGlassSurface(element, {
        variant: 'floating',
        radius: 999,
        bevelDepth: 10,
        scale: 28,
        aberration: 2,
        frost: 0.4,
        tint: 0.45,
        onResize: () => this.syncIndicator(false),
        ...options
      });

      this.ensureIndicator();
      this.bindEvents();
      this.syncIndicator(false);
    }

    ensureIndicator() {
      let ind = this.el.querySelector(':scope > .lg-toggle-indicator');
      if (!ind) {
        ind = document.createElement('span');
        ind.className = 'lg-toggle-indicator';
        ind.setAttribute('aria-hidden', 'true');
        this.el.appendChild(ind);
      }
      this.indicator = ind;
    }

    getActiveOption() {
      const active = this.el.querySelector(':scope > button.active, :scope > [role="tab"].active, :scope > [role="radio"].active');
      if (active || this.el.dataset.lgOptionalActive === 'true') {
        return active;
      }
      return this.el.querySelector(':scope > button, :scope > [role="tab"], :scope > [role="radio"]');
    }

    bindEvents() {
      this._onClick = (e) => {
        const btn = e.target.closest('button, [role="tab"], [role="radio"]');
        if (btn && this.el.contains(btn)) {
          this.scheduleSync(true);
        }
      };
      this.el.addEventListener('click', this._onClick, { passive: true });

      if (typeof MutationObserver === 'function') {
        this.mutationObserver = new MutationObserver(() => this.scheduleSync(true));
        this.mutationObserver.observe(this.el, {
          attributes: true,
          attributeFilter: ['class', 'aria-selected', 'aria-checked'],
          subtree: true
        });
      }
    }

    scheduleSync(animate = true) {
      if (this.syncRaf) window.cancelAnimationFrame(this.syncRaf);
      this.syncRaf = window.requestAnimationFrame(() => {
        this.syncRaf = null;
        this.syncIndicator(animate);
      });
    }

    syncIndicator(animate = true) {
      if (!this.indicator) return;
      const activeBtn = this.getActiveOption();
      if (!activeBtn) {
        this.indicator.style.opacity = '0';
        return;
      }

      const w = activeBtn.offsetWidth;
      const h = activeBtn.offsetHeight;
      if (w <= 0 || h <= 0) {
        this.indicator.style.opacity = '0';
        return;
      }

      const x = activeBtn.offsetLeft;
      const y = activeBtn.offsetTop;

      const reduceMotion =
        document.body.classList.contains('reduced-motion') ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

      if (!animate || reduceMotion) {
        this.indicator.style.transition = 'none';
      } else {
        this.indicator.style.transition = '';
      }

      this.indicator.style.opacity = '1';
      this.indicator.style.width = `${w}px`;
      this.indicator.style.height = `${h}px`;
      this.indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (!animate || reduceMotion) {
        void this.indicator.offsetWidth;
        this.indicator.style.transition = '';
      }
    }

    destroy() {
      if (this.mutationObserver) this.mutationObserver.disconnect();
      if (this._onClick) this.el.removeEventListener('click', this._onClick);
      if (this.syncRaf) window.cancelAnimationFrame(this.syncRaf);
      this.surface?.destroy();
    }
  }

  function refreshAllToggleBars() {
    (global.__preranaLiquidGlassToggleBars || []).forEach((bar) => bar.scheduleSync(false));
  }

  function bootLiquidGlassUI() {
    const headerEl = document.getElementById('app-top-header');
    if (headerEl && !global.__preranaLiquidGlassHeader) {
      global.__preranaLiquidGlassHeader = new LiquidGlassHeader(headerEl, {
        variant: 'floating',
        radius: 24,
        bevelDepth: 12,
        scale: 36,
        aberration: 4,
        frost: 0.4,
        tint: 0.25
      });
    }

    const barSelectors = [
      '#category-filter-row',
      '.home-difficulty-bar',
      '.auth-segmented-nav',
      '.reg-role-options',
      '.sidebar-nav-list',
      '#mobile-bottom-nav'
    ];
    if (!global.__preranaLiquidGlassToggleBars) {
      global.__preranaLiquidGlassToggleBars = [];
    }

    barSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.__lgToggleBarInstance) {
          const isVerticalSidebar = el.classList.contains('sidebar-nav-list');
          const inst = new LiquidGlassToggleBar(el, {
            radius: isVerticalSidebar ? 20 : 999,
            bevelDepth: 10,
            scale: 28,
            aberration: 2,
            frost: 0.4,
            tint: 0.45
          });
          el.__lgToggleBarInstance = inst;
          global.__preranaLiquidGlassToggleBars.push(inst);
        }
      });
    });
  }

  global.LiquidGlassSurface = LiquidGlassSurface;
  global.LiquidGlassHeader = LiquidGlassHeader;
  global.LiquidGlassToggleBar = LiquidGlassToggleBar;
  global.refreshLiquidGlassToggleBars = refreshAllToggleBars;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootLiquidGlassUI);
  } else {
    bootLiquidGlassUI();
  }
})(window);
