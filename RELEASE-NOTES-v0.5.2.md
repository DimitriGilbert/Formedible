# Formedible v0.5.2

Documentation-site content fixes for the homepage example generators.

## What's fixed

- The **installation guide generator** now links to the correct examples browser at `https://formedible.dev/docs/examples` (it previously emitted `formedible.dev/examples`, which returned 404).
- The **AI system prompt generator's field-type catalog** now matches the current field model: it teaches the canonical `color` type (noting the `colorPicker` legacy alias) and includes `tel`, `combobox`, and `multiCombobox`, bringing the documented catalog to the full 26 supported types.

No library changes; the `formedible-core` registry item is unchanged from [v0.5.1](https://github.com/DimitriGilbert/Formedible/releases/tag/v0.5.1).
