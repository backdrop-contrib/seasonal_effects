/**
 * @file
 * Christmas: gentle snow, and now and then a present appears at the foot of
 * the page with a gremlin creeping towards it. Squash him before he gets
 * there, or he runs off with it. The visitor's score is kept in their browser.
 */
(function () {
  'use strict';

  var GREMLIN = '<svg viewBox="0 0 70 80" width="62" height="71">' +
    '<path d="M16 27L1 9l22 11zM54 27L69 9 47 20z" fill="#57a034"/>' +
    '<ellipse cx="26" cy="75" rx="8" ry="4" fill="#3f7f26"/><ellipse cx="44" cy="75" rx="8" ry="4" fill="#3f7f26"/>' +
    '<path d="M19 45q16-7 32 0l4 26q-20 6-40 0z" fill="#6cbf43"/>' +
    '<ellipse cx="35" cy="30" rx="21" ry="17" fill="#6cbf43"/>' +
    '<ellipse cx="27" cy="28" rx="6" ry="7" fill="#fff36b"/><ellipse cx="43" cy="28" rx="6" ry="7" fill="#fff36b"/>' +
    '<circle cx="28.5" cy="29" r="2.6" fill="#1d1d1d"/><circle cx="44.5" cy="29" r="2.6" fill="#1d1d1d"/>' +
    '<path d="M19 19l12 5M51 19l-12 5" stroke="#2f5f1c" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M25 38q10 8 20 0" stroke="#2f5f1c" stroke-width="2.2" fill="#fff" stroke-linejoin="round"/>' +
    '<rect x="17" y="43" width="36" height="7" rx="3" fill="#d62d2d"/>' +
    '<path d="M24 43v7M31 43v7M38 43v7M45 43v7" stroke="#fff" stroke-width="2.5"/>' +
    '<path d="M46 48l5 14 6-2-4-13z" fill="#d62d2d"/></svg>';

  var PRESENT = '<svg viewBox="0 0 60 58" width="56" height="54">' +
    '<rect x="5" y="20" width="50" height="36" rx="2" fill="#2f6fd6"/>' +
    '<rect x="1" y="13" width="58" height="10" rx="2" fill="#3b82f6"/>' +
    '<rect x="26" y="13" width="8" height="43" fill="#ffd23f"/>' +
    '<path d="M30 13c-8-12-18-10-15-3 2 4 9 4 15 3zM30 13c8-12 18-10 15-3-2 4-9 4-15 3z" fill="#ffd23f" stroke="#e0b521" stroke-width="1"/></svg>';

  Backdrop.seasonalEffects.register('christmas', function (stage) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var flakes = [];
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var game = null;

    stage.addStyle(
      'canvas{position:absolute;inset:0;width:100%;height:100%}' +
      '.thing{position:absolute;left:0;top:0;will-change:transform}' +
      '.thing svg{display:block;overflow:visible}' +
      '.waddle{animation:waddle .45s ease-in-out infinite alternate;transform-origin:50% 100%}' +
      '.run .waddle{animation-duration:.18s}' +
      '@keyframes waddle{from{transform:rotate(-7deg) translateY(0)}to{transform:rotate(7deg) translateY(-4px)}}' +
      '.flip svg{transform:scaleX(-1)}' +
      '.say{position:absolute;left:0;top:0;padding:4px 9px;border-radius:12px;background:#fff;color:#b3121f;' +
      'font:700 14px/1.2 system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.25);white-space:nowrap}' +
      '.hit:hover{filter:drop-shadow(0 0 5px rgba(255,80,80,.8))}'
    );

    function resize() {
      canvas.width = stage.width() * ratio;
      canvas.height = stage.height() * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      var want = Math.round(Math.min(140, stage.width() / (stage.reduced ? 30 : 11)));
      while (flakes.length < want) {
        flakes.push(newFlake(true));
      }
      flakes.length = want;
    }

    function newFlake(anywhere) {
      return {
        x: stage.rand(0, stage.width()),
        y: anywhere ? stage.rand(-stage.height(), stage.height()) : stage.rand(-40, -5),
        r: stage.rand(1.2, 3.6) * stage.baseSize,
        speed: stage.rand(18, 55),
        phase: stage.rand(0, Math.PI * 2),
        sway: stage.rand(10, 30)
      };
    }

    function snow(dt) {
      var w = stage.width(), h = stage.height();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.strokeStyle = 'rgba(120,140,170,.55)';
      ctx.lineWidth = 0.6;
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.phase += dt * 0.8;
        f.y += f.speed * (f.r / 2.4) * dt;
        var x = f.x + Math.sin(f.phase) * f.sway;
        if (f.y > h + 5) {
          flakes[i] = newFlake(false);
          continue;
        }
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    /**
     * Shows a short speech bubble that floats up and fades.
     */
    function say(text, x, y) {
      var el = stage.add('', 'say');
      el.textContent = text;
      el.animate([
        {transform: 'translate(' + x + 'px,' + y + 'px)', opacity: 0},
        {transform: 'translate(' + x + 'px,' + (y - 12) + 'px)', opacity: 1, offset: 0.15},
        {transform: 'translate(' + x + 'px,' + (y - 40) + 'px)', opacity: 0}
      ], {duration: 2200, easing: 'ease-out'}).onfinish = function () { el.remove(); };
    }

    function score(add) {
      var key = 'seasonalEffects.gremlins.' + new Date().getFullYear();
      var n = 0;
      try {
        n = parseInt(localStorage.getItem(key) || '0', 10) + add;
        localStorage.setItem(key, String(n));
      }
      catch (e) {
        n = add;
      }
      return n;
    }

    /**
     * One round: a present appears, the gremlin creeps towards it.
     */
    function round() {
      if (game) {
        return;
      }
      var w = stage.width(), h = stage.height(), s = stage.size();
      var px = stage.rand(0.2, 0.7) * w;
      var py = h - 60 * s;
      var fromRight = px < w / 2;
      var startX = fromRight ? w + 20 : -80 * s;
      var stopX = fromRight ? px + 50 * s : px - 58 * s;
      var gy = h - 76 * s;

      var present = stage.add(PRESENT, 'thing', s);
      present.animate([
        {transform: 'translate(' + px + 'px,' + py + 'px) scale(0)'},
        {transform: 'translate(' + px + 'px,' + py + 'px) scale(1.15)', offset: 0.7},
        {transform: 'translate(' + px + 'px,' + py + 'px) scale(1)'}
      ], {duration: 500, fill: 'forwards'});

      var gremlin = stage.add('<div class="waddle">' + GREMLIN + '</div>', 'thing hit' + (fromRight ? '' : ' flip'), s);
      var walk = gremlin.animate([
        {transform: 'translate(' + startX + 'px,' + gy + 'px)'},
        {transform: 'translate(' + stopX + 'px,' + gy + 'px)'}
      ], {duration: stage.rand(8500, 12000), delay: 900, easing: 'linear', fill: 'forwards'});

      game = {present: present, gremlin: gremlin};

      var end = function () {
        present.remove();
        gremlin.remove();
        game = null;
      };

      // He made it: grab the present and run back the way he came.
      walk.onfinish = function () {
        if (gremlin.dataset.squashed) {
          return;
        }
        gremlin.classList.add('run');
        gremlin.classList.toggle('flip');
        say(Backdrop.t('Hee hee!'), stopX, gy - 30 * s);
        var away = fromRight ? w + 120 * s : -180 * s;
        gremlin.animate([
          {transform: 'translate(' + stopX + 'px,' + gy + 'px)'},
          {transform: 'translate(' + away + 'px,' + gy + 'px)'}
        ], {duration: 1600, easing: 'ease-in', fill: 'forwards'});
        present.animate([
          {transform: 'translate(' + px + 'px,' + py + 'px)'},
          {transform: 'translate(' + (stopX + 4) + 'px,' + (gy - 30 * s) + 'px) rotate(-10deg)', offset: 0.15},
          {transform: 'translate(' + (away + 4) + 'px,' + (gy - 30 * s) + 'px) rotate(-10deg)'}
        ], {duration: 1900, easing: 'ease-in', fill: 'forwards'}).onfinish = end;
      };

      gremlin.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (gremlin.dataset.squashed) {
          return;
        }
        gremlin.dataset.squashed = '1';
        var at = getComputedStyle(gremlin).transform;
        walk.cancel();
        gremlin.style.transform = at;
        gremlin.classList.remove('hit');
        gremlin.firstChild.style.animation = 'none';
        var n = score(1);
        gremlin.firstChild.animate([
          {transform: 'scale(1,1)'},
          {transform: 'scale(1.35,.22)'}
        ], {duration: 160, fill: 'forwards'});
        gremlin.animate([{opacity: 1}, {opacity: 1, offset: 0.7}, {opacity: 0}], {duration: 1400, fill: 'forwards'});
        say(Backdrop.formatPlural(n, 'Splat! 1 gremlin squashed this Christmas', 'Splat! @count gremlins squashed this Christmas'), Math.max(10, px - 80), py - 40 - 10 * s);
        present.animate([
          {transform: 'translate(' + px + 'px,' + py + 'px)'},
          {transform: 'translate(' + px + 'px,' + (py - 22 * s) + 'px) rotate(6deg)', offset: 0.3},
          {transform: 'translate(' + px + 'px,' + py + 'px)', offset: 0.6},
          {transform: 'translate(' + px + 'px,' + py + 'px)', opacity: 1, offset: 0.8},
          {transform: 'translate(' + px + 'px,' + py + 'px)', opacity: 0}
        ], {duration: 2600, fill: 'forwards'}).onfinish = end;
      });
    }

    return {
      icon: '❄️',
      start: function () {
        stage.layer.appendChild(canvas);
        resize();
        window.addEventListener('resize', resize);
        stage.loop(function (dt) {
          if (!document.hidden) {
            snow(dt);
          }
        });
        stage.every(35000, 80000, round, 6000);
      },
      stop: function () {
        window.removeEventListener('resize', resize);
        game = null;
      }
    };
  });
})();
