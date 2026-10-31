/**
 * @file
 * Seasonal Effects engine.
 *
 * Builds one overlay over the page, inside a shadow root so the theme's CSS
 * cannot reach in and nothing here leaks out. The layer lets every click
 * through except on the effect's own clickable pieces. Effects register a
 * factory with Backdrop.seasonalEffects.register(); the engine starts the one
 * named in the page settings, and offers the visitor an on/off button whose
 * choice is kept in their own browser.
 */
(function () {
  'use strict';

  var factories = {};
  var STORE_KEY = 'seasonalEffects.off';

  Backdrop.seasonalEffects = {
    /**
     * Registers an effect.
     *
     * @param {string} name
     *   The effect's machine name, as in hook_seasonal_effects_info().
     * @param {Function} factory
     *   Called with the stage; returns {icon, start(), stop()}.
     */
    register: function (name, factory) {
      factories[name] = factory;
    }
  };

  // Elements an effect never needs and that can run code, load something or
  // point somewhere: script, embedded HTML, SVG animation (which can rewrite
  // a link to javascript:), references to other files.
  var UNSAFE = ['script', 'foreignobject', 'iframe', 'frame', 'object', 'embed', 'applet', 'link', 'meta',
    'base', 'style', 'animate', 'animatemotion', 'animatetransform', 'set', 'use', 'image', 'a', 'audio',
    'video', 'source', 'track', 'form', 'input', 'button', 'textarea', 'select', 'template', 'handler', 'listener'];

  /**
   * Parses markup for an effect with anything that could run code removed.
   *
   * The markup is parsed into an inert template, where scripts do not run and
   * nothing loads, then cleaned: unsafe elements are dropped, as are event
   * handler attributes, any attribute linking somewhere (href, src and the
   * like), and any value mentioning javascript:. A url() is kept only when it
   * points inside the drawing (url(#clip)), which SVG needs for clip paths
   * and gradients. Styling belongs in stage.addStyle(), not in the markup.
   *
   * @param {string} markup
   *   SVG or HTML from an effect.
   *
   * @return {DocumentFragment}
   *   The cleaned nodes.
   */
  function cleanMarkup(markup) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(markup);
    Array.prototype.slice.call(tpl.content.querySelectorAll('*')).forEach(function (node) {
      if (UNSAFE.indexOf(node.localName.toLowerCase()) !== -1) {
        node.remove();
        return;
      }
      Array.prototype.slice.call(node.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        var value = attr.value.replace(/[\s\u0000-\u001f]+/g, '').toLowerCase();
        var urls = value.match(/url\([^)]*\)/g) || [];
        var foreignUrl = urls.some(function (u) { return !/^url\(['"]?#[\w-]+['"]?\)$/.test(u); });
        if (name.indexOf('on') === 0 || /(^|:)(href|src|srcset|action|formaction|xmlns:.*)$/.test(name) ||
            value.indexOf('javascript:') !== -1 || value.indexOf('data:') !== -1 || foreignUrl ||
            (name === 'style' && /expression|@import|behavior/.test(value))) {
          node.removeAttribute(attr.name);
        }
      });
    });
    return tpl.content;
  }

  /**
   * Reads the visitor's stored choice: true off, false on, null never chosen.
   */
  function storedOff() {
    try {
      var v = localStorage.getItem(STORE_KEY);
      return v === null ? null : v === '1';
    }
    catch (e) {
      return null;
    }
  }

  /**
   * Builds the stage handed to an effect: the shadow root and small helpers.
   */
  function buildStage(host, cfg) {
    var preview = cfg.preview;
    // How often, 1 to 5: a multiplier on the time between appearances, and how
    // many creatures may be about at once.
    var level = Math.min(5, Math.max(1, parseInt(cfg.frequency, 10) || 3));
    var gaps = {1: 2.5, 2: 1.6, 3: 1, 4: 0.65, 5: 0.4};
    var crowds = {1: 2, 2: 3, 3: 3, 4: 4, 5: 6};
    var fixedSize = cfg.size === 'random' ? 0 : (parseFloat(cfg.size) || 1);
    var root = host.attachShadow({mode: 'open'});
    var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
    var timers = [];
    var layer = document.createElement('div');
    layer.className = 'layer';
    root.innerHTML = '<style>:host{all:initial}.layer{position:fixed;inset:0;overflow:hidden;pointer-events:none}' +
      '.hit{pointer-events:auto;cursor:pointer}@media print{:host{display:none}}</style>';
    root.appendChild(layer);

    var stage = {
      root: root,
      layer: layer,
      reduced: mq('(prefers-reduced-motion: reduce)'),
      touch: mq('(pointer: coarse)') && !mq('(pointer: fine)'),
      running: false,
      preview: !!preview,
      maxAlive: crowds[level],

      /**
       * The scale for the next creature: the site's fixed size, or a fresh
       * random one between 1 and 1.7 when the size is set to random.
       */
      size: function () {
        return fixedSize || 1 + Math.random() * 0.7;
      },

      /**
       * The typical scale, for things drawn many at once (snow, sparks).
       */
      baseSize: fixedSize || 1.35,
      // The visible area, without scrollbars, so nothing hides behind them.
      width: function () { return document.documentElement.clientWidth || window.innerWidth; },
      height: function () { return document.documentElement.clientHeight || window.innerHeight; },
      rand: function (a, b) { return a + Math.random() * (b - a); },
      pick: function (list) { return list[Math.floor(Math.random() * list.length)]; },
      chance: function (p) { return Math.random() < p; },

      /**
       * Adds CSS to the shadow root.
       */
      addStyle: function (css) {
        var style = document.createElement('style');
        style.textContent = css;
        root.insertBefore(style, layer);
      },

      /**
       * Makes an element from SVG or HTML markup and adds it to the layer,
       * scaling any SVG in it when a scale is given. The markup is cleaned
       * first (see cleanMarkup()), so an effect cannot slip code in through
       * a drawing. Put text in with textContent, never in the markup.
       */
      add: function (markup, className, scale) {
        var el = document.createElement('div');
        el.className = className || '';
        el.appendChild(cleanMarkup(markup));
        if (scale && scale !== 1) {
          Array.prototype.forEach.call(el.querySelectorAll('svg'), function (svg) {
            ['width', 'height'].forEach(function (attr) {
              var v = parseFloat(svg.getAttribute(attr));
              if (v) {
                svg.setAttribute(attr, Math.round(v * scale));
              }
            });
          });
        }
        layer.appendChild(el);
        return el;
      },

      /**
       * Calls fn now and then, between min and max milliseconds apart, only
       * while the effect runs and the tab is visible. The site's "how often"
       * setting stretches or shrinks the gaps, and a preview runs three times
       * as often again, so an administrator sees everything quickly.
       */
      every: function (min, max, fn, firstDelay) {
        min *= gaps[level];
        max *= gaps[level];
        if (stage.preview) {
          min /= 3;
          max /= 3;
          firstDelay = Math.min(firstDelay !== undefined ? firstDelay : min, 800);
        }
        var tick = function () {
          if (stage.running && !document.hidden) {
            fn();
          }
          timers.push(setTimeout(tick, stage.rand(min, max)));
        };
        timers.push(setTimeout(tick, firstDelay !== undefined ? firstDelay : stage.rand(min, max)));
      },

      /**
       * Runs fn every animation frame until it returns false.
       */
      loop: function (fn) {
        var last = performance.now();
        var frame = function (now) {
          var dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          if (stage.running && fn(dt) !== false) {
            requestAnimationFrame(frame);
          }
        };
        requestAnimationFrame(frame);
      },

      /**
       * Stops every timer started through every().
       */
      clearTimers: function () {
        timers.forEach(clearTimeout);
        timers = [];
      }
    };
    return stage;
  }

  /**
   * Adds the visitor's on/off button.
   */
  function buildToggle(effect, label, isOn, onChange) {
    var host = document.createElement('div');
    host.id = 'seasonal-effects-toggle';
    host.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483001;';
    var root = host.attachShadow({mode: 'open'});
    root.innerHTML = '<style>:host{all:initial}button{cursor:pointer;min-height:34px;padding:6px 11px;' +
      'border:1px solid #8a8a8a;border-radius:17px;background:#fff;color:#222;font:600 12px/1.3 system-ui,sans-serif;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.15);opacity:.85}button:hover{opacity:1}' +
      'button:focus-visible{outline:2px solid #2563eb;outline-offset:2px}' +
      '@media (prefers-color-scheme:dark){button{background:#222;color:#eee;border-color:#555}}' +
      '@media print{:host{display:none}}</style><button type="button"></button>';
    var button = root.querySelector('button');
    var draw = function () {
      button.textContent = (effect.icon || '') + ' ' + (isOn ? Backdrop.t('Effects: on') : Backdrop.t('Effects: off'));
      button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      button.setAttribute('title', Backdrop.t('Turn the @label effects on or off', {'@label': label}));
    };
    button.addEventListener('click', function () {
      isOn = !isOn;
      try {
        localStorage.setItem(STORE_KEY, isOn ? '0' : '1');
      }
      catch (e) {}
      draw();
      onChange(isOn);
    });
    draw();
    document.body.appendChild(host);
  }

  Backdrop.behaviors.seasonalEffects = {
    attach: function (context, settings) {
      var cfg = settings.seasonalEffects;
      if (context !== document || !cfg || document.getElementById('seasonal-effects') ||
          !document.documentElement.attachShadow || !Element.prototype.animate ||
          Date.now() >= cfg.end || !factories[cfg.effect]) {
        return;
      }

      var host = document.createElement('div');
      host.id = 'seasonal-effects';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
      document.body.appendChild(host);

      var stage = buildStage(host, cfg);
      var effect = factories[cfg.effect](stage);
      var stored = storedOff();
      // Reduced motion starts off unless the visitor has switched it on; a
      // preview always starts on.
      var on = cfg.preview || (stored === null ? !stage.reduced : !stored);

      var setOn = function (value) {
        if (value && !stage.running) {
          stage.running = true;
          effect.start();
        }
        else if (!value && stage.running) {
          stage.running = false;
          stage.clearTimers();
          effect.stop();
          stage.layer.textContent = '';
        }
      };

      if (cfg.toggle || cfg.preview) {
        buildToggle(effect, cfg.label, on, setOn);
      }
      setOn(on);

      // Stop at the end of the effect's dates even if the page stays open.
      var left = cfg.end - Date.now();
      if (left < 86400000) {
        setTimeout(function () { setOn(false); }, left);
      }
    }
  };
})();
