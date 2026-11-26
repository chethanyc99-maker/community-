/**
 * Prerana LiquidGlassHeader Controller (Vanilla HTML/CSS/JS implementation)
 * Implements the LiquidGlassHeader optical design specification:
 * - variant: "floating" | "full" (default: "floating")
 * - radius: number (default: 24 for floating, 0 for full)
 * - bevelDepth: number (default: 12)
 * - scale: number (default: 36)
 * - aberration: number (default: 4)
 * - frost: number (default: 0.4)
 * - tint: number (default: 0.25)
 */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  class LiquidGlassHeader {
    constructor(element, options = {}) {
      if (!element) return;
      this.el = element;

      const ds = element.dataset || {};
      this.variant = options.variant || ds.lgVariant || 'floating';
      const isFloating = this.variant === 'floating';

      const parsedRadius = ds.lgRadius !== undefined ? Number(ds.lgRadius) : options.radius;
      this.radius = Number.isFinite(parsedRadius) ? parsedRadius : (isFloating ? 24 : 0);
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

      this.svgEl = null;
      this.feImageEl = null;
      this.lastWidth = 0;
      this.lastHeight = 0;
      this.rafId = null;
      this.resizeObserver = null;

      this.init();
    }

    init() {
      this.applyPropsToCSS();
      this.setupSvgFilter();
      this.bindResizeObserver();
      this.scheduleMapUpdate();
    }

    applyPropsToCSS() {
      const effectiveRadius = this.variant === 'floating' ? this.radius : 0;
      this.el.setAttribute('data-lg-variant', this.variant);
      this.el.style.setProperty('--lg-radius', `${effectiveRadius}px`);
      this.el.style.setProperty('--lg-bevel-depth', `${this.bevelDepth}px`);
      this.el.style.setProperty('--lg-frost', String(this.frost));
      this.el.style.setProperty('--lg-frost-blur', `${Math.round(this.frost * 32 * 10) / 10}px`);
      this.el.style.setProperty('--lg-tint', String(this.tint));
      this.el.style.setProperty('--lg-aberration', `${this.aberration}px`);
    }

    supportsSvgBackdropFilter() {
      if (typeof window === 'undefined' || !window.CSS || typeof CSS.supports !== 'function') {
        return false;
      }
      const ua = navigator.userAgent || '';
      const isChromium = (Boolean(window.chrome) || /\b(Chrome|Chromium|Edg|OPR|Brave)\b/i.test(ua))
        && !/\b(Firefox|FxiOS)\b/i.test(ua);
      return isChromium && CSS.supports('backdrop-filter', 'blur(1px)');
    }

    setupSvgFilter() {
      if (!this.supportsSvgBackdropFilter()) return;

      let svg = document.getElementById('liquid-glass-header-svg');
      if (!svg) {
        svg = document.createElementNS(SVG_NS, 'svg');
        svg.id = 'liquid-glass-header-svg';
        svg.setAttribute('aria-hidden', 'true');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';

        const defs = document.createElementNS(SVG_NS, 'defs');
        const filter = document.createElementNS(SVG_NS, 'filter');
        filter.id = 'liquid-glass-header-filter';
        filter.setAttribute('x', '0%');
        filter.setAttribute('y', '0%');
        filter.setAttribute('width', '100%');
        filter.setAttribute('height', '100%');
        filter.setAttribute('color-interpolation-filters', 'sRGB');

        const feImage = document.createElementNS(SVG_NS, 'feImage');
        feImage.id = 'lg-header-fe-image';
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
        svg.appendChild(defs);
        document.body.appendChild(svg);
      }

      this.svgEl = svg;
      this.feImageEl = document.getElementById('lg-header-fe-image');
    }

    bindResizeObserver() {
      if (typeof ResizeObserver === 'function') {
        this.resizeObserver = new ResizeObserver(() => {
          this.scheduleMapUpdate();
        });
        this.resizeObserver.observe(this.el);
      }
      window.addEventListener('resize', () => this.scheduleMapUpdate(), { passive: true });
    }

    scheduleMapUpdate() {
      if (this.rafId) return;
      this.rafId = window.requestAnimationFrame(() => {
        this.rafId = null;
        this.updateDisplacementMap();
      });
    }

    updateDisplacementMap() {
      if (!this.feImageEl) return;
      const rect = this.el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width <= 0 || height <= 0) return;
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

      const effectiveRadius = this.variant === 'floating' ? this.radius : 0;
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
      if (this.rafId) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  global.LiquidGlassHeader = LiquidGlassHeader;

  function bootLiquidGlassHeader() {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootLiquidGlassHeader);
  } else {
    bootLiquidGlassHeader();
  }
})(window);
