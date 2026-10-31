/**
 * @file
 * Thanksgiving: turkeys dash about the foot of the page, stopping to peck.
 * Click one and it flaps off in a flurry of feathers.
 */
(function () {
  'use strict';

  var FAN = ['#7a3b12', '#b5541b', '#d9822b', '#7a3b12', '#e8b03a', '#b5541b', '#7a3b12'];

  function turkeyMarkup() {
    var fan = '';
    for (var i = 0; i < FAN.length; i++) {
      var angle = -75 + i * 25;
      fan += '<ellipse cx="44" cy="16" rx="7" ry="20" fill="' + FAN[i] + '" transform="rotate(' + angle + ' 44 36)"/>';
    }
    return '<svg viewBox="0 0 80 76" width="70" height="66">' + fan +
      '<path d="M38 64v9M48 64v9M35 73h6M45 73h6" stroke="#e08a1e" stroke-width="2.5" stroke-linecap="round"/>' +
      '<ellipse cx="42" cy="48" rx="20" ry="17" fill="#6b3410"/>' +
      '<path d="M30 46q8 10 22 2" stroke="#4e250a" stroke-width="2" fill="none"/>' +
      '<g class="head"><path d="M26 44q-6-12 0-22" stroke="#6b3410" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<circle cx="24" cy="20" r="7" fill="#c9a27a"/><circle cx="22" cy="18" r="1.6" fill="#222"/>' +
      '<path d="M17 20l-6 2 6 2z" fill="#f2a31b"/><path d="M18 24q-3 6 1 9" stroke="#d62d2d" stroke-width="3" fill="none" stroke-linecap="round"/></g></svg>';
  }

  var FEATHER = '<svg viewBox="0 0 12 30" width="10" height="26"><path d="M6 0C1 8 1 20 6 30 11 20 11 8 6 0z" fill="COL"/><path d="M6 4v26" stroke="#4e250a" stroke-width=".8"/></svg>';

  Backdrop.seasonalEffects.register('thanksgiving', function (stage) {
    var alive = 0;

    stage.addStyle(
      '.thing{position:absolute;left:0;top:0;will-change:transform}' +
      '.thing svg{display:block;overflow:visible}' +
      '.trot{animation:trot .22s ease-in-out infinite alternate;transform-origin:50% 100%}' +
      '@keyframes trot{from{transform:rotate(-5deg)}to{transform:rotate(5deg) translateY(-3px)}}' +
      '.head{transform-origin:26px 44px;animation:peck 1.3s ease-in-out infinite}' +
      '@keyframes peck{0%,70%,100%{transform:rotate(0)}80%{transform:rotate(-38deg)}90%{transform:rotate(-10deg)}}' +
      '.hit:hover{filter:drop-shadow(0 0 5px rgba(240,150,40,.9))}'
    );

    /**
     * A turkey's route: dash to a spot, peck a while, dash on, and leave.
     */
    function turkey() {
      var w = stage.width(), h = stage.height(), s = stage.size();
      var y = h - 70 * s;
      var x = stage.chance(0.5) ? -80 * s : w + 10;
      var frames = [], t = 0, times = [];
      var face = function (dir) { return dir < 0 ? '' : ' scaleX(-1)'; };
      var dir = x < 0 ? 1 : -1;
      frames.push({transform: 'translate(' + x + 'px,' + y + 'px)' + face(dir)});
      times.push(0);
      var stops = Math.floor(stage.rand(2, 5));
      for (var i = 0; i < stops; i++) {
        var nx = stage.rand(0.05, 0.9) * w;
        dir = nx > x ? 1 : -1;
        t += Math.abs(nx - x) / stage.rand(160, 260) * 1000;
        frames.push({transform: 'translate(' + nx + 'px,' + y + 'px)' + face(dir)});
        times.push(t);
        t += stage.rand(1200, 2600);
        frames.push({transform: 'translate(' + nx + 'px,' + y + 'px)' + face(dir)});
        times.push(t);
        x = nx;
      }
      var out = stage.chance(0.5) ? -90 * s : w + 20;
      dir = out > x ? 1 : -1;
      t += Math.abs(out - x) / 260 * 1000;
      frames.push({transform: 'translate(' + out + 'px,' + y + 'px)' + face(dir)});
      times.push(t);
      frames.forEach(function (f, n) { f.offset = times[n] / t; });

      alive++;
      var el = stage.add('<div class="trot">' + turkeyMarkup() + '</div>', 'thing hit', s);
      var run = el.animate(frames, {duration: t, easing: 'linear'});
      var done = function () {
        if (!el.dataset.done) {
          el.dataset.done = '1';
          alive--;
          el.remove();
        }
      };
      run.onfinish = done;

      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (el.dataset.flown) {
          return;
        }
        el.dataset.flown = '1';
        var m = new DOMMatrix(getComputedStyle(el).transform);
        run.cancel();
        var at = 'translate(' + m.m41 + 'px,' + m.m42 + 'px)' + (m.a < 0 ? ' scaleX(-1)' : '');
        feathers(m.m41 + 35 * s, m.m42 + 30 * s, s);
        var away = m.a < 0 ? w + 120 * s : -160 * s;
        el.animate([
          {transform: at},
          {transform: 'translate(' + m.m41 + 'px,' + (m.m42 - 60 * s) + 'px)' + (m.a < 0 ? ' scaleX(-1)' : '') + ' rotate(-8deg)', offset: 0.25},
          {transform: 'translate(' + away + 'px,' + (h * 0.2) + 'px)' + (m.a < 0 ? ' scaleX(-1)' : '') + ' rotate(-15deg)'}
        ], {duration: 1500, easing: 'ease-in', fill: 'forwards'}).onfinish = done;
      });
    }

    /**
     * A burst of feathers that drift down and fade.
     */
    function feathers(x, y, s) {
      for (var i = 0; i < 9; i++) {
        var el = stage.add(FEATHER.replace('COL', stage.pick(FAN)), 'thing', s);
        var dx = stage.rand(-90, 90), up = stage.rand(30, 90), spin = stage.rand(-400, 400);
        el.animate([
          {transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg)', opacity: 1},
          {transform: 'translate(' + (x + dx * 0.6) + 'px,' + (y - up) + 'px) rotate(' + spin / 2 + 'deg)', opacity: 1, offset: 0.3},
          {transform: 'translate(' + (x + dx) + 'px,' + (y + 40) + 'px) rotate(' + spin + 'deg)', opacity: 0}
        ], {duration: stage.rand(1400, 2200), easing: 'ease-out'}).onfinish = (function (f) {
          return function () { f.remove(); };
        })(el);
      }
    }

    return {
      icon: '🦃',
      start: function () {
        stage.every(4000, 11000, function () {
          if (alive < stage.maxAlive) {
            turkey();
          }
        }, 1500);
      },
      stop: function () {
        alive = 0;
      }
    };
  });
})();
