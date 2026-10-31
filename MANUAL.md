# Seasonal Effects manual

## Settings

**Configuration > User interface > Seasonal effects**
(`admin/config/user-interface/seasonal-effects`), permission *Administer
seasonal effects*.

Each effect has:

- **Run on these dates**: tick to use it.
- **First day / Last day** (fixed dates): month and day as `MM-DD`. Both days
  are included. A last day earlier than the first runs into the new year, so
  Christmas from `12-01` to `01-06` covers Twelfth Night.
- **Start / End in days** (Easter and Thanksgiving): counted from Easter
  Sunday or US Thanksgiving Day, which are worked out each year. Easter's
  default, -2 to 1, is Good Friday to Easter Monday.

Dates use the site's time zone. Where two ticked effects overlap, the one
higher in the list runs; only one runs at a time.

**How often** runs from 1 (now and then) to 5 (often). It shortens or
lengthens the gaps between appearances; at 4 and 5 more creatures may be on
screen at once (up to six).

**Size of creatures** is a fixed 1.0x to 2.0x (default 1.4x), or *Random* for
a mix between 1.0x and 1.7x, chosen for each creature as it appears. Snow and
fireworks follow the setting too.

**Show visitors an on/off button** adds a small button in the bottom-left
corner. Each visitor's choice is remembered in their own browser. Visitors
whose device asks for reduced motion start with effects off and can turn them
on.

## Previewing

The **Preview on the home page** link beside each effect opens the site with
that effect running, whatever the date, at three times the usual pace. You can
add `?seasonal-effect=halloween` (or `bonfire_night`, `christmas`, `easter`,
`thanksgiving`) to any page yourself. Only users with *Administer seasonal
effects* can preview; for everyone else the parameter is ignored.

## Caching

The effect is added to the page when it is built, so a page held in the page
cache keeps whatever it had. To keep that in step:

- the visitor's browser stops an effect when its dates end, even on a cached
  page;
- cron clears the page cache when an effect starts or ends, so make sure cron
  runs at least daily;
- saving the settings clears the page cache.

## The Christmas gremlin

Every minute or so a present appears at the foot of the page and a gremlin
creeps towards it. Click him to squash him; if he reaches the present he runs
off with it. Each visitor's score for the year is kept in their browser and
shown when they squash one.

## Adding your own effect

A module declares it with `hook_seasonal_effects_info()` and supplies a
script that calls `Backdrop.seasonalEffects.register()`. See
`seasonal_effects.api.php` for the definition and the helpers the engine
hands the script. New effects start unticked.
