<?php
/**
 * @file
 * Settings page for Seasonal Effects.
 */

/**
 * Form constructor: which effects run, and on which dates.
 *
 * @see seasonal_effects_settings_form_validate()
 * @see seasonal_effects_settings_form_submit()
 */
function seasonal_effects_settings_form($form, &$form_state) {
  $effects = seasonal_effects_get_effects();
  $active = seasonal_effects_active();
  $anchors = seasonal_effects_anchors();
  $hints = array(
    'easter' => array(t('-2 is Good Friday.'), t('1 is Easter Monday.')),
  );

  $form['intro'] = array(
    '#markup' => '<p>' . t('Each effect runs on its own dates, in the site\'s time zone, first and last day included. Where two overlap, the one higher in the list wins. Effects never show on administration pages.') . '</p>'
      . '<p>' . ($active
        ? t('Running now: %effect, until @end.', array('%effect' => $effects[$active[0]]['label'], '@end' => format_date($active[2] - 1, 'custom', 'j F Y')))
        : t('No effect is running today.')) . '</p>',
  );

  $form['effects'] = array(
    '#type' => 'container',
    '#tree' => TRUE,
  );
  foreach ($effects as $name => $effect) {
    $relative = isset($anchors[$effect['schedule']]);
    $hint = isset($hints[$effect['schedule']]) ? $hints[$effect['schedule']] : array(t('0 is the day itself.'), t('0 is the day itself.'));
    $form['effects'][$name] = array(
      '#type' => 'fieldset',
      '#title' => $effect['label'],
      '#description' => check_plain($effect['description']) . ' ' . l(t('Preview on the home page'), '<front>', array(
        'query' => array('seasonal-effect' => $name),
        'attributes' => array('target' => '_blank'),
      )),
    );
    $form['effects'][$name]['enabled'] = array(
      '#type' => 'checkbox',
      '#title' => t('Run on these dates'),
      '#default_value' => $effect['enabled'],
    );
    $form['effects'][$name]['start'] = array(
      '#type' => $relative ? 'number' : 'textfield',
      '#title' => $relative ? t('Start, in days from @anchor', array('@anchor' => $anchors[$effect['schedule']])) : t('First day'),
      '#description' => $relative ? $hint[0] : t('Month and day, MM-DD.'),
      '#default_value' => $effect['start'],
      '#size' => 6,
      '#maxlength' => 5,
      '#required' => TRUE,
    );
    $form['effects'][$name]['end'] = array(
      '#type' => $relative ? 'number' : 'textfield',
      '#title' => $relative ? t('End, in days from @anchor', array('@anchor' => $anchors[$effect['schedule']])) : t('Last day'),
      '#description' => $relative ? $hint[1] : t('Month and day, MM-DD. An earlier date than the first day runs into the new year.'),
      '#default_value' => $effect['end'],
      '#size' => 6,
      '#maxlength' => 5,
      '#required' => TRUE,
    );
    if ($relative) {
      $form['effects'][$name]['start'] += array('#min' => -60, '#max' => 60);
      $form['effects'][$name]['end'] += array('#min' => -60, '#max' => 60);
    }
  }

  $form['frequency'] = array(
    '#type' => 'select',
    '#title' => t('How often'),
    '#options' => array(
      1 => t('1 - Now and then'),
      2 => t('2'),
      3 => t('3 - Normal'),
      4 => t('4'),
      5 => t('5 - Often, and more at once'),
    ),
    '#default_value' => config_get('seasonal_effects.settings', 'frequency') ?: 3,
  );
  $form['size'] = array(
    '#type' => 'select',
    '#title' => t('Size of creatures'),
    '#options' => seasonal_effects_sizes(),
    '#default_value' => config_get('seasonal_effects.settings', 'size') ?: '1.4',
    '#description' => t('Snow and fireworks follow this too.'),
  );

  $form['toggle'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show visitors an on/off button'),
    '#description' => t('A small button in the bottom corner. Each visitor\'s choice is remembered in their own browser. Visitors who ask their device to reduce motion start with effects off.'),
    '#default_value' => config_get('seasonal_effects.settings', 'toggle'),
  );

  $form['actions']['#type'] = 'actions';
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save configuration'),
  );
  return $form;
}

/**
 * Form validation handler for seasonal_effects_settings_form().
 */
function seasonal_effects_settings_form_validate($form, &$form_state) {
  $effects = seasonal_effects_get_effects();
  foreach ($form_state['values']['effects'] as $name => $values) {
    if ($effects[$name]['schedule'] != 'fixed') {
      if ((int) $values['end'] < (int) $values['start']) {
        form_set_error("effects][$name][end", t('%effect: the end must not come before the start.', array('%effect' => $effects[$name]['label'])));
      }
      continue;
    }
    foreach (array('start', 'end') as $key) {
      $value = trim($values[$key]);
      if (!preg_match('/^(\d\d)-(\d\d)$/', $value, $m) || !checkdate((int) $m[1], (int) $m[2], 2024)) {
        form_set_error("effects][$name][$key", t('%effect: enter a date as MM-DD, for example 10-31.', array('%effect' => $effects[$name]['label'])));
      }
    }
  }
}

/**
 * Form submission handler for seasonal_effects_settings_form().
 */
function seasonal_effects_settings_form_submit($form, &$form_state) {
  $effects = seasonal_effects_get_effects();
  $saved = array();
  foreach ($form_state['values']['effects'] as $name => $values) {
    $relative = $effects[$name]['schedule'] != 'fixed';
    $saved[$name] = array(
      'enabled' => (bool) $values['enabled'],
      'start' => $relative ? (int) $values['start'] : trim($values['start']),
      'end' => $relative ? (int) $values['end'] : trim($values['end']),
    );
  }

  config('seasonal_effects.settings')
    ->set('effects', $saved)
    ->set('toggle', (bool) $form_state['values']['toggle'])
    ->set('frequency', (int) $form_state['values']['frequency'])
    ->set('size', (string) $form_state['values']['size'])
    ->save();

  // What visitors see may have changed, and the page cache would hide it.
  backdrop_static_reset('seasonal_effects_get_effects');
  $active = seasonal_effects_active();
  state_set('seasonal_effects_active', $active ? $active[0] : '');
  cache('page')->flush();

  backdrop_set_message(t('The configuration options have been saved.'));
}
