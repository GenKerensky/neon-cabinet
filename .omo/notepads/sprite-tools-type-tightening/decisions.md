# Decisions — sprite-tools-type-tightening

- Runtime bugs IN scope (direction→dir, ellipse→arc)
- Tests/mocks/CLI included in tightening
- Non-null `!` assertions included
- 3 minimal public accessors: getLayer(), getLayerDrawable(), getRotationTarget()
- parseDataParams: Record<string, any> → Record<string, string | number>
- parseNumericAttribute helper for eliminating `!` assertions
- Type guards preferred over casts
