/**
 * liquid-buttons.js - Liquid Glass Button Physics & Runtime API
 * Apple-inspired tactile 3D refractive tilt & specular pointer tracking
 */

(function () {
  'use strict';

  const boundButtons = new WeakSet();

  /**
   * Helper to get a live float CSS variable from :root
   */
  function getRootNumericVar(name, fallback) {
    try {
      const val = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
      return isNaN(val) ? fallback : val;
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Ensures that button children are wrapped inside .liquid-btn__content
   */
  function ensureContentWrapper(btn) {
    if (btn.querySelector(':scope > .liquid-btn__content')) return;

    const wrapper = document.createElement('span');
    wrapper.className = 'liquid-btn__content';

    // Move all non-pseudo child nodes into the wrapper
    while (btn.firstChild) {
      wrapper.appendChild(btn.firstChild);
    }
    btn.appendChild(wrapper);
  }

  /**
   * Attaches 3D physics and specular glare listeners to a single .liquid-btn
   */
  function attachButton(btn) {
    if (!btn || boundButtons.has(btn)) return;
    boundButtons.add(btn);

    // Ensure .liquid-btn__content wrapper exists
    ensureContentWrapper(btn);

    // Pointer move: calculate specular position and 3D refractive tilt
    btn.addEventListener('pointermove', (e) => {
      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const rect = btn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update specular sheen position
      btn.style.setProperty('--mx', `${x.toFixed(1)}px`);
      btn.style.setProperty('--my', `${y.toFixed(1)}px`);

      // Compute subtle 3D refractive tilt scaled by --refraction
      const refraction = getRootNumericVar('--refraction', 1.05);
      const rx = ((y / rect.height) - 0.5) * -10 * refraction;
      const ry = ((x / rect.width) - 0.5) * 10 * refraction;

      btn.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      btn.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    }, { passive: true });

    // Pointer leave: reset specular sheen and 3D tilt
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--mx', '50%');
      btn.style.setProperty('--my', '50%');
      btn.style.setProperty('--rx', '0deg');
      btn.style.setProperty('--ry', '0deg');
    });

    // Pointer cancel
    btn.addEventListener('pointercancel', () => {
      btn.style.setProperty('--mx', '50%');
      btn.style.setProperty('--my', '50%');
      btn.style.setProperty('--rx', '0deg');
      btn.style.setProperty('--ry', '0deg');
    });
  }

  /**
   * Updates glass physics parameters dynamically at runtime
   * @param {Object} params
   * @param {number} [params.refraction] - e.g. 1.05
   * @param {number} [params.dispersion] - e.g. 1.00
   * @param {number} [params.specular]   - e.g. 1.15
   * @param {number} [params.frost]      - e.g. 0.70
   */
  function onParamsChange(params = {}) {
    const root = document.documentElement.style;
    if (params.refraction !== undefined) {
      root.setProperty('--refraction', parseFloat(params.refraction).toFixed(2));
    }
    if (params.dispersion !== undefined) {
      root.setProperty('--dispersion', parseFloat(params.dispersion).toFixed(2));
    }
    if (params.specular !== undefined) {
      root.setProperty('--specular', parseFloat(params.specular).toFixed(2));
    }
    if (params.frost !== undefined) {
      root.setProperty('--frost', parseFloat(params.frost).toFixed(2));
    }
  }

  /**
   * Scans and initializes all current and future .liquid-btn elements
   */
  function init() {
    document.querySelectorAll('.liquid-btn').forEach(attachButton);

    // Watch for dynamically inserted buttons (e.g. game modules, modals, dialogs)
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList && node.classList.contains('liquid-btn')) {
                attachButton(node);
              }
              node.querySelectorAll?.('.liquid-btn')?.forEach(attachButton);
            }
          });
        });
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Switches the liquid background stage preset
   * @param {'aura-dark'|'daylight-mesh'|'grid-minimal'} theme
   */
  function setBgTheme(theme) {
    const stage = document.getElementById('liquid-bg-stage') || document.body;
    document.body.classList.remove('bg-aura-dark', 'bg-daylight-mesh', 'bg-grid-minimal');
    stage.classList.remove('bg-aura-dark', 'bg-daylight-mesh', 'bg-grid-minimal');

    const clean = theme.replace(/^bg-/, '');
    const className = `bg-${clean}`;
    document.body.classList.add(className);
    stage.classList.add(className);
  }

  // Export public API
  window.LiquidButtons = {
    init,
    attachButton,
    onParamsChange,
    setBgTheme
  };
  };
})();
