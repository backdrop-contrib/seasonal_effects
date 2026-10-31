# Changelog - Seasonal Effects

## 1.x-1.0.0 (unreleased)

### Added
- Engine: an overlay in a shadow root, click-through except on the effect's own pieces, with a visitor on/off button and reduced-motion support.
- Effects: Halloween, Bonfire Night, Christmas (snow and the gremlin game), Easter and Thanksgiving.
- Dates per effect, fixed or counted from Easter Sunday or US Thanksgiving; one effect at a time.
- Bertie, a Dutch rabbit, hops through Easter and does a binky when clicked.
- How often (1 to 5) and creature size (1.0x to 2.0x, or random) settings.
- Administrator preview of any effect with `?seasonal-effect=NAME`.
- `hook_seasonal_effects_info()` for other modules to add effects; their drawings are cleaned of anything that could run code.
