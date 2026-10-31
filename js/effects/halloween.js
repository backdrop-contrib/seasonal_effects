/**
 * @file
 * Halloween: ghosts, bats, spiders and pumpkins wander in from the edges of
 * the screen and leave again. Clicking one banishes it, each in its own way.
 */
(function () {
  'use strict';

  var GHOST = '<svg viewBox="0 0 60 70" width="60" height="70">' +
    '<path d="M30 4C14 4 6 16 6 32v30l7-6 7 7 7-7 7 7 7-7 7 7 6-6V32C54 16 46 4 30 4z" fill="#f8f8ff" fill-opacity=".92" stroke="#c9cbe0" stroke-width="1.5"/>' +
    '<ellipse cx="22" cy="28" rx="3.2" ry="5" fill="#222"/><ellipse cx="38" cy="28" rx="3.2" ry="5" fill="#222"/>' +
    '<ellipse cx="30" cy="42" rx="4" ry="5.5" fill="#333"/></svg>';

  var BAT_WING = 'M40 20C31 7 19 6 5 12c6 4 8 10 6 16 6-4 12-2 16 2 3-6 8-7 13-6z';
  var BAT = '<svg viewBox="0 0 80 40" width="72" height="36">' +
    '<g class="wing"><path d="' + BAT_WING + '" fill="#1d1b26"/><path d="' + BAT_WING + '" fill="#1d1b26" transform="matrix(-1 0 0 1 80 0)"/></g>' +
    '<path d="M35 14l2-6 3 5 3-5 2 6z" fill="#1d1b26"/><ellipse cx="40" cy="22" rx="6" ry="9" fill="#1d1b26"/>' +
    '<circle cx="37.5" cy="19" r="1.3" fill="#ff5a3c"/><circle cx="42.5" cy="19" r="1.3" fill="#ff5a3c"/></svg>';

  var SPIDER = '<svg viewBox="0 0 50 44" width="44" height="39"><g stroke="#151515" stroke-width="2.2" fill="none" stroke-linecap="round">' +
    '<path d="M20 20L8 10 2 16M20 23L5 22 1 30M21 26L9 33 6 42M23 27L17 38 16 44"/>' +
    '<path d="M30 20l12-10 6 6M30 23l15-1 4 8M29 26l12 7 3 9M27 27l6 11 1 6"/></g>' +
    '<ellipse cx="25" cy="24" rx="7.5" ry="8.5" fill="#151515"/><circle cx="25" cy="14" r="5" fill="#151515"/>' +
    '<circle cx="23" cy="13" r="1.2" fill="#fff"/><circle cx="27" cy="13" r="1.2" fill="#fff"/></svg>';

  var PUMPKIN = '<svg viewBox="0 0 90 80" width="90" height="80">' +
    '<path d="M44 14c0-6 3-10 8-12l2 3c-4 2-5 5-5 9z" fill="#4d7a2a"/>' +
    '<ellipse cx="45" cy="47" rx="40" ry="31" fill="#e8741c"/><ellipse cx="45" cy="47" rx="22" ry="31" fill="#f08a2c"/>' +
    '<ellipse cx="45" cy="47" rx="8" ry="31" fill="#e8741c" fill-opacity=".6"/>' +
    '<g class="face" fill="#ffd34d"><path d="M24 38l9-9 7 11z"/><path d="M66 38l-9-9-7 11z"/>' +
    '<path d="M22 54c8 9 38 9 46 0l-6 3-5-4-5 5-6-5-6 5-5-5-5 4z"/></g></svg>';

  Backdrop.seasonalEffects.register('halloween', function (stage) {
    var alive = 0;

    stage.addStyle(
      '.creature{position:absolute;left:0;top:0;will-change:transform}' +
      '.creature svg{display:block;overflow:visible}' +
      '.bob{animation:bob 2.4s ease-in-out infinite alternate}' +
      '@keyframes bob{from{transform:translateY(-6px)}to{transform:translateY(6px)}}' +
      '.wing{transform-origin:40px 20px;animation:flap .18s ease-in-out infinite alternate}' +
      '@keyframes flap{from{transform:scaleY(1)}to{transform:scaleY(-.35)}}' +
      '.thread{position:absolute;width:1px;height:100vh;background:rgba(120,120,120,.6)}' +
      '.face{animation:flicker 1.7s infinite}' +
      '@keyframes flicker{0%,100%{opacity:1}45%{opacity:.7}50%{opacity:.95}70%{opacity:.6}}' +
      '.hit:hover{filter:drop-shadow(0 0 6px rgba(255,170,60,.9))}'
    );

    /**
     * Adds a creature at scale s, removes it when its animation ends, and
     * banishes it once if clicked.
     */
    function spawn(markup, path, banish, s) {
      alive++;
      var el = stage.add(markup, 'creature hit', s);
      var anim = el.animate(path.frames, path.options);
      var gone = false;
      var finish = function () {
        if (!gone) {
          gone = true;
          alive--;
          el.remove();
        }
      };
      anim.onfinish = finish;
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (el.dataset.banished) {
          return;
        }
        el.dataset.banished = '1';
        anim.pause();
        var at = getComputedStyle(el).transform;
        anim.cancel();
        el.style.transform = at === 'none' ? '' : at;
        var out = el.animate(banish(at === 'none' ? '' : at), {duration: 900, easing: 'ease-in', fill: 'forwards'});
        out.onfinish = finish;
      });
    }

    function ghost() {
      var w = stage.width(), h = stage.height(), s = stage.size();
      var ltr = stage.chance(0.5);
      var y = stage.rand(0.12, 0.6) * h;
      var frames = [];
      for (var i = 0; i <= 6; i++) {
        var x = ltr ? -80 * s + (w + 160 * s) * i / 6 : w + 80 * s - (w + 160 * s) * i / 6;
        frames.push({transform: 'translate(' + x + 'px,' + (y + Math.sin(i * 1.3) * 40 * s) + 'px)', opacity: i === 0 || i === 6 ? 0 : 0.95});
      }
      spawn('<div class="bob">' + GHOST + '</div>', {frames: frames, options: {duration: stage.rand(12000, 18000), easing: 'linear'}},
        function (at) {
          return [{transform: at, opacity: 1}, {transform: at + ' translateY(-60px) scale(1.7)', opacity: 0}];
        }, s);
    }

    function bat() {
      var w = stage.width(), h = stage.height(), s = stage.size();
      var ltr = stage.chance(0.5);
      var y = stage.rand(0.08, 0.45) * h;
      var frames = [];
      for (var i = 0; i <= 8; i++) {
        var x = ltr ? -90 * s + (w + 180 * s) * i / 8 : w + 90 * s - (w + 180 * s) * i / 8;
        frames.push({transform: 'translate(' + x + 'px,' + (y + Math.sin(i * 1.7) * 55 * s) + 'px)' + (ltr ? '' : ' scaleX(-1)')});
      }
      spawn(BAT, {frames: frames, options: {duration: stage.rand(5000, 8000), easing: 'linear'}},
        function (at) {
          return [{transform: at}, {transform: at + ' translateY(' + h + 'px) rotate(600deg)'}];
        }, s);
    }

    function spider() {
      var s = stage.size();
      var x = stage.rand(0.08, 0.9) * stage.width();
      var drop = stage.rand(0.18, 0.42) * stage.height();
      var t = function (y, r) { return 'translate(' + x + 'px,' + y + 'px) rotate(' + (r || 0) + 'deg)'; };
      spawn('<div class="thread" style="left:' + Math.round(21 * s) + 'px;bottom:' + Math.round(30 * s) + 'px"></div>' + SPIDER, {
        frames: [
          {transform: t(-60 * s), offset: 0},
          {transform: t(drop), offset: 0.25, easing: 'ease-in-out'},
          {transform: t(drop + 8, 6), offset: 0.4},
          {transform: t(drop - 4, -6), offset: 0.55},
          {transform: t(drop, 0), offset: 0.7},
          {transform: t(-60 * s), offset: 1}
        ],
        options: {duration: stage.rand(10000, 14000), easing: 'ease-in-out'}
      }, function () {
        return [{transform: t(drop)}, {transform: t(-80 * s)}];
      }, s);
    }

    function pumpkin() {
      var s = stage.size();
      var x = stage.rand(0.05, 0.85) * stage.width();
      var h = stage.height();
      var peek = h - 55 * s;
      var t = function (y, r) { return 'translate(' + x + 'px,' + y + 'px) rotate(' + (r || 0) + 'deg)'; };
      spawn(PUMPKIN, {
        frames: [
          {transform: t(h + 10), offset: 0},
          {transform: t(peek, -4), offset: 0.15, easing: 'ease-out'},
          {transform: t(peek - 3 * s, 4), offset: 0.5},
          {transform: t(peek, -2), offset: 0.85},
          {transform: t(h + 10), offset: 1}
        ],
        options: {duration: stage.rand(7000, 10000), easing: 'ease-in-out'}
      }, function () {
        return [{transform: t(peek) + ' scale(1.15,.8)'}, {transform: t(peek - 15 * s) + ' scale(.9,1.1)', offset: 0.3}, {transform: t(h + 20)}];
      }, s);
    }

    var kinds = [ghost, ghost, ghost, bat, bat, bat, spider, spider, pumpkin];

    return {
      icon: '🎃',
      start: function () {
        stage.every(5000, 13000, function () {
          if (alive < stage.maxAlive) {
            stage.pick(kinds)();
          }
        }, 1500);
      },
      stop: function () {
        alive = 0;
      }
    };
  });
})();
