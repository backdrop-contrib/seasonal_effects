<?php
/**
 * @file
 * Hooks provided by Seasonal Effects.
 */

/**
 * Declares seasonal effects.
 *
 * Each effect is a script that registers itself with the engine:
 *
 * @code
 * Backdrop.seasonalEffects.register('diwali', function (stage) {
 *   return {
 *     icon: '\u{1FA94}',
 *     start: function () { stage.every(4000, 9000, lightALamp, 1000); },
 *     stop: function () {}
 *   };
 * });
 * @endcode
 *
 * The stage gives the script its own layer inside a shadow root
 * (stage.layer, stage.addStyle(), stage.add()), timers that pause while the
 * tab is hidden (stage.every()), an animation loop (stage.loop()), and the
 * visitor's preferences (stage.reduced, stage.touch). Anything the visitor
 * may click needs the class "hit"; everything else lets clicks through to
 * the page. The engine empties the layer when the effect is switched off.
 *
 * Markup given to stage.add() is cleaned before use: scripts, event
 * handlers, SVG animation, links, external references and anything
 * mentioning javascript: are removed. Draw with plain shapes, style with
 * stage.addStyle(), and put any text in with textContent.
 *
 * @return array
 *   Effects keyed by machine name. Each is an array with:
 *   - label: The name shown on the settings page and to visitors.
 *   - description: (optional) One sentence for the settings page.
 *   - js: Path to the effect's script, from the Backdrop root.
 *   - schedule: 'fixed' for the same dates every year, or a key of
 *     seasonal_effects_anchors() ('easter', 'thanksgiving') for a moving date.
 *   - start, end: The default dates. For 'fixed', month and day as MM-DD;
 *     an end earlier than the start runs into the new year. For a moving
 *     date, days from the anchor (negative is before it).
 *   - weight: (optional) Where two enabled effects overlap, the lighter one
 *     runs.
 *
 * New effects start disabled; the site administrator turns them on.
 */
function hook_seasonal_effects_info() {
  return array(
    'diwali' => array(
      'label' => t('Diwali'),
      'description' => t('Lamps light up along the foot of the page.'),
      'js' => backdrop_get_path('module', 'mymodule') . '/js/diwali.js',
      'schedule' => 'fixed',
      'start' => '10-20',
      'end' => '10-24',
      'weight' => 10,
    ),
  );
}

/**
 * Alters the declared effects.
 *
 * @param array $effects
 *   The effects from hook_seasonal_effects_info(), keyed by machine name.
 */
function hook_seasonal_effects_info_alter(array &$effects) {
  // Swap the Christmas script for the theme's own.
  $effects['christmas']['js'] = backdrop_get_path('theme', 'mytheme') . '/js/christmas.js';
}
