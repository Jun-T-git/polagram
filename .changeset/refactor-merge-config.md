---
"@polagram/core": minor
"@polagram/cli": patch
---

Refactor merge configuration:
- Introduce `into` object for merge targets.
- Support `id` and `name` in `into`.
- Implement auto-naming if `id`/`name` are omitted.
- Fix participant ordering (insert at first merged participant's position).
