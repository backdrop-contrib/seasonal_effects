/**
 * @file
 * Easter: painted eggs roll along the foot of the page and a bunny hops past
 * now and then. Click an egg and it hatches a chick that hops away.
 */
(function () {
  'use strict';

  var PAINTS = [
    ['#ffb3c7', '#ff6f9c'], ['#b8e1ff', '#4aa3ff'], ['#c9f7b5', '#56c43a'],
    ['#fff1a6', '#f2b705'], ['#e3c8ff', '#9b5de5']
  ];

  /**
   * Builds a painted egg in one of a few patterns.
   */
  var eggs = 0;

  function egg(stage) {
    var p = stage.pick(PAINTS);
    var id = 'egg-clip-' + (++eggs);
    var pattern = stage.pick([
      '<path d="M6 30q9-6 18 0t18 0" stroke="' + p[1] + '" stroke-width="4" fill="none"/><path d="M8 40q8-5 16 0t16 0" stroke="#fff" stroke-width="3" fill="none"/>',
      '<circle cx="16" cy="22" r="3.5" fill="' + p[1] + '"/><circle cx="31" cy="28" r="3.5" fill="' + p[1] + '"/><circle cx="20" cy="39" r="3.5" fill="' + p[1] + '"/><circle cx="33" cy="44" r="3" fill="#fff"/>',
      '<path d="M5 28h38M7 38h34" stroke="' + p[1] + '" stroke-width="5"/><path d="M6 33h36" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>'
    ]);
    return '<svg viewBox="0 0 48 60" width="40" height="50"><defs><clipPath id="' + id + '"><path d="M24 2C10 2 2 24 2 38c0 12 10 20 22 20s22-8 22-20C46 24 38 2 24 2z"/></clipPath></defs>' +
      '<path d="M24 2C10 2 2 24 2 38c0 12 10 20 22 20s22-8 22-20C46 24 38 2 24 2z" fill="' + p[0] + '"/>' +
      '<g clip-path="url(#' + id + ')">' + pattern + '</g></svg>';
  }

  var CHICK = '<svg viewBox="0 0 44 44" width="40" height="40">' +
    '<ellipse cx="22" cy="28" rx="15" ry="13" fill="#ffd93b"/><circle cx="22" cy="14" r="10" fill="#ffe25c"/>' +
    '<path d="M20 4q2-4 5 0" stroke="#ffd93b" stroke-width="2" fill="none"/>' +
    '<circle cx="18.5" cy="12.5" r="1.8" fill="#222"/><circle cx="26" cy="12.5" r="1.8" fill="#222"/>' +
    '<path d="M20 16l2.5 3 2.5-3z" fill="#ff8a1e"/><path d="M10 27q-4 2-2 6" stroke="#f2c200" stroke-width="3" fill="none"/>' +
    '<path d="M17 41v3M27 41v3" stroke="#ff8a1e" stroke-width="2"/></svg>';

  // Bertie: a black and white Dutch rabbit. Black ears, head and hindquarters,
  // a white blaze down the face, white collar, front and feet. In memory of
  // Bertie, who came home on 8 November 2013.
  var BUNNY = '<svg viewBox="0 0 80 70" width="76" height="66"><g stroke-linejoin="round">' +
    '<ellipse cx="22" cy="13" rx="5" ry="13" fill="#1c1c1f" transform="rotate(-12 22 13)"/>' +
    '<ellipse cx="31" cy="11" rx="5" ry="13" fill="#1c1c1f" transform="rotate(8 31 11)"/>' +
    '<ellipse cx="22" cy="14" rx="2" ry="8" fill="#6b4a3a" transform="rotate(-12 22 14)"/>' +
    '<circle cx="73" cy="45" r="6" fill="#1c1c1f"/>' +
    '<ellipse cx="48" cy="47" rx="26" ry="18" fill="#1c1c1f"/>' +
    '<ellipse cx="34" cy="48" rx="15" ry="17" fill="#fff" stroke="#d6d6d6" stroke-width=".8"/>' +
    '<ellipse cx="59" cy="64" rx="8" ry="3.2" fill="#fff" stroke="#d6d6d6" stroke-width=".8"/>' +
    '<circle cx="26" cy="35" r="13" fill="#1c1c1f"/>' +
    '<path d="M23.5 22.5C21.5 27 17.5 31 13.2 35.4 12.8 39 14 42 16.5 43.5 18.5 39 20.5 32 23.5 22.5z" fill="#fff"/>' +
    '<path d="M15 42.5q4 5 13 4.5l2.5-2.5q-9 .5-13.5-3.5z" fill="#fff"/>' +
    '<circle cx="27.5" cy="31.5" r="2.8" fill="#3a2418"/><circle cx="28.4" cy="30.6" r=".9" fill="#fff"/>' +
    '<ellipse cx="14" cy="37.5" rx="2.2" ry="1.6" fill="#f3a3b5"/>' +
    '<path d="M15 39l-8-2M15 40l-8 1" stroke="#b9b9b9" stroke-width=".6"/>' +
    '<ellipse cx="30" cy="64" rx="8" ry="3.6" fill="#fff" stroke="#d6d6d6" stroke-width=".8"/></g></svg>';

  Backdrop.seasonalEffects.register('easter', function (stage) {
    var alive = 0;

    stage.addStyle(
      '.thing{position:absolute;left:0;top:0;will-change:transform}' +
      '.thing svg{display:block;overflow:visible}' +
      '.flip svg{transform:scaleX(-1)}' +
      '.say{position:absolute;left:0;top:0;padding:4px 9px;border-radius:12px;background:#fff;color:#c2185b;' +
      'font:700 14px/1.2 system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.25);white-space:nowrap}' +
      '.hit:hover{filter:drop-shadow(0 0 6px rgba(255,210,60,.9))}'
    );

    function rollEgg() {
      var w = stage.width(), h = stage.height(), s = stage.size();
      var ltr = stage.chance(0.5);
      var y = h - 52 * s;
      var from = ltr ? -50 * s : w + 10, to = ltr ? w + 10 : -50 * s;
      var turns = (w / (126 * s)) * (ltr ? 360 : -360);
      alive++;
      var el = stage.add(egg(stage), 'thing hit', s);
      var roll = el.animate([
        {transform: 'translate(' + from + 'px,' + y + 'px) rotate(0deg)'},
        {transform: 'translate(' + to + 'px,' + y + 'px) rotate(' + turns + 'deg)'}
      ], {duration: stage.rand(9000, 14000), easing: 'linear'});
      var done = function () {
        alive--;
        el.remove();
      };
      roll.onfinish = done;

      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (el.dataset.hatched) {
          return;
        }
        el.dataset.hatched = '1';
        var at = new DOMMatrix(getComputedStyle(el).transform);
        roll.cancel();
        var x = at.m41;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        // Wobble, crack, and out comes a chick.
        el.animate([
          {transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg)'},
          {transform: 'translate(' + x + 'px,' + y + 'px) rotate(-14deg)', offset: 0.2},
          {transform: 'translate(' + x + 'px,' + y + 'px) rotate(14deg)', offset: 0.4},
          {transform: 'translate(' + x + 'px,' + y + 'px) rotate(-8deg)', offset: 0.6},
          {transform: 'translate(' + x + 'px,' + (y + 10 * s) + 'px) scale(1.2,.4)', opacity: 0}
        ], {duration: 900, fill: 'forwards'}).onfinish = function () {
          el.remove();
          chick(x, y + 8 * s, ltr, s);
        };
      });
    }

    function chick(x, y, ltr, s) {
      var el = stage.add(CHICK, 'thing' + (ltr ? '' : ' flip'), s);
      var frames = [], hops = 7, dx = (ltr ? 1 : -1) * 34 * s;
      for (var i = 0; i <= hops; i++) {
        frames.push({transform: 'translate(' + (x + dx * i) + 'px,' + y + 'px)'});
        if (i < hops) {
          frames.push({transform: 'translate(' + (x + dx * (i + 0.5)) + 'px,' + (y - 22 * s) + 'px)'});
        }
      }
      frames.push({transform: 'translate(' + (x + dx * hops) + 'px,' + y + 'px)', opacity: 0});
      el.animate(frames, {duration: 3200, easing: 'ease-in-out'}).onfinish = function () {
        alive--;
        el.remove();
      };
    }

    function bunny() {
      var w = stage.width(), h = stage.height(), s = stage.size();
      var ltr = stage.chance(0.5);
      var y = h - 70 * s;
      var step = 110 * s;
      var hops = Math.ceil((w + 200 * s) / step);
      var frames = [];
      for (var i = 0; i <= hops; i++) {
        var x = ltr ? -90 * s + i * step : w + 10 - i * step;
        frames.push({transform: 'translate(' + x + 'px,' + y + 'px)'});
        if (i < hops) {
          frames.push({transform: 'translate(' + (x + (ltr ? step : -step) / 2) + 'px,' + (y - 45 * s) + 'px)'});
        }
      }
      alive++;
      // Drawn facing left; flip it to go right.
      var el = stage.add('<div class="binky">' + BUNNY + '</div>', 'thing hit' + (ltr ? ' flip' : ''), s);
      el.title = 'Bertie';
      el.animate(frames, {duration: hops * 650, easing: 'ease-in-out'}).onfinish = function () {
        alive--;
        el.remove();
      };

      // Click him and he does a binky - the jump and twist of a happy rabbit.
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var inner = el.firstChild;
        if (inner.getAnimations().length) {
          return;
        }
        inner.animate([
          {transform: 'translateY(0) rotate(0deg)'},
          {transform: 'translateY(' + (-55 * s) + 'px) rotate(-18deg)', offset: 0.4},
          {transform: 'translateY(' + (-40 * s) + 'px) rotate(14deg)', offset: 0.65},
          {transform: 'translateY(0) rotate(0deg)'}
        ], {duration: 750, easing: 'ease-out'});
        var box = el.getBoundingClientRect();
        heart(box.left + box.width / 2 - 30, box.top - 10);
      });
    }

    /**
     * A small heart with Bertie's name, floating up and fading.
     */
    function heart(x, y) {
      var el = stage.add('', 'say');
      el.textContent = '♥ Bertie';
      el.animate([
        {transform: 'translate(' + x + 'px,' + y + 'px)', opacity: 0},
        {transform: 'translate(' + x + 'px,' + (y - 14) + 'px)', opacity: 1, offset: 0.15},
        {transform: 'translate(' + x + 'px,' + (y - 50) + 'px)', opacity: 0}
      ], {duration: 2200, easing: 'ease-out'}).onfinish = function () { el.remove(); };
    }

    return {
      icon: '🐣',
      start: function () {
        stage.every(5000, 12000, function () {
          if (alive < stage.maxAlive) {
            (stage.chance(0.3) ? bunny : rollEgg)();
          }
        }, 1500);
      },
      stop: function () {
        alive = 0;
      }
    };
  });
})();
