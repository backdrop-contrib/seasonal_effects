/**
 * @file
 * Bonfire Night: now and then a few rockets go up and burst over the page.
 * Nothing is clickable; the animation loop only runs while sparks are in the
 * air.
 */
(function () {
  'use strict';

  var COLOURS = ['#ff3b3b', '#ffc400', '#1e90ff', '#22c55e', '#ff4fd8', '#ff8c1a', '#a855f7', '#00c2c7'];

  Backdrop.seasonalEffects.register('bonfire_night', function (stage) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var rockets = [];
    var sparks = [];
    var looping = false;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);

    stage.addStyle('canvas{position:absolute;inset:0;width:100%;height:100%}');

    function resize() {
      canvas.width = stage.width() * ratio;
      canvas.height = stage.height() * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    /**
     * Bursts a rocket into sparks: a sphere, a ring, or a willow that droops.
     */
    function burst(x, y) {
      var colour = stage.pick(COLOURS);
      var second = stage.chance(0.35) ? stage.pick(COLOURS) : colour;
      var kind = stage.pick(['sphere', 'sphere', 'ring', 'willow']);
      var k = stage.size();
      var count = stage.touch ? 60 : 110;
      for (var i = 0; i < count; i++) {
        var a = Math.PI * 2 * i / count + stage.rand(-0.05, 0.05);
        var speed = (kind === 'ring' ? 260 : stage.rand(90, 300)) * k;
        sparks.push({
          x: x, y: y,
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          life: kind === 'willow' ? stage.rand(1.8, 2.6) : stage.rand(1.0, 1.6),
          age: 0,
          colour: i % 2 ? colour : second,
          drag: kind === 'willow' ? 0.9 : 1.5,
          gravity: kind === 'willow' ? 70 : 45,
          size: k
        });
      }
    }

    function launch() {
      var w = stage.width(), h = stage.height();
      rockets.push({
        x: stage.rand(0.15, 0.85) * w,
        y: h + 10,
        vx: stage.rand(-30, 30),
        vy: -stage.rand(0.95, 1.25) * Math.sqrt(2 * 180 * h * stage.rand(0.45, 0.75)),
        fuse: 0
      });
      if (!looping) {
        looping = true;
        stage.loop(step);
      }
    }

    function step(dt) {
      var w = stage.width(), h = stage.height();
      ctx.clearRect(0, 0, w, h);

      for (var i = rockets.length - 1; i >= 0; i--) {
        var r = rockets[i];
        r.vy += 180 * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        ctx.fillStyle = '#e8801f';
        ctx.fillRect(r.x - 1.5, r.y - 1, 3, 9);
        if (r.vy > -40) {
          burst(r.x, r.y);
          rockets.splice(i, 1);
        }
      }

      for (var j = sparks.length - 1; j >= 0; j--) {
        var s = sparks[j];
        s.age += dt;
        if (s.age >= s.life) {
          sparks.splice(j, 1);
          continue;
        }
        s.vx -= s.vx * s.drag * dt;
        s.vy -= s.vy * s.drag * dt;
        s.vy += s.gravity * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        var fade = 1 - s.age / s.life;
        // A soft halo then a bright core, so sparks show on light pages too.
        ctx.globalAlpha = fade * 0.25;
        ctx.fillStyle = s.colour;
        ctx.beginPath();
        ctx.arc(s.x, s.y, (3 + fade * 4) * s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = fade * (0.75 + Math.random() * 0.25);
        ctx.beginPath();
        ctx.arc(s.x, s.y, (1.4 + fade * 1.8) * s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!rockets.length && !sparks.length) {
        ctx.clearRect(0, 0, w, h);
        looping = false;
        return false;
      }
    }

    return {
      icon: '🎆',
      start: function () {
        stage.layer.appendChild(canvas);
        resize();
        window.addEventListener('resize', resize);
        // A salvo of one to four rockets every so often.
        stage.every(7000, 16000, function () {
          var n = Math.floor(stage.rand(1, 5));
          for (var i = 0; i < n; i++) {
            setTimeout(launch, i * stage.rand(250, 700));
          }
        }, 1200);
      },
      stop: function () {
        window.removeEventListener('resize', resize);
        rockets = [];
        sparks = [];
        looping = false;
      }
    };
  });
})();
